import { Level, PlanCode, PlanStatus, Prisma, User } from "../lib/prisma";
import { prisma } from "../lib/prisma";
import {
  CheckoutData,
  UserActivityCreationMetadata,
  UserIdentity,
  UserSignedLinkMetadata,
} from "../types/domain";
import type { ResolvedActivityRequest } from "../core/activity-request";
import { getNearestReminderTimeSlot } from "../core/daily-reminder-time";
import { runSerializable } from "./serializable";

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { phone } });
}

// Update condicional: duas aberturas ao mesmo tempo nao rodam o onboarding
// duas vezes.
export async function claimUserOnboarding(userId: string): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { id: userId, onboardedAt: null },
    data: { onboardedAt: new Date() },
  });
  return count > 0;
}

export async function updateUserPlanStatus(
  userId: string,
  planStatus: PlanStatus,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { planStatus, planStatusUpdatedAt: new Date() },
  });
}

// Job em lote: sem filtro por userId, como a consulta do lembrete. Conta
// cortesia (planExpiresAt nulo) nunca expira, igual ao canPractice.
export async function expireEndedPlans(now: Date): Promise<number> {
  const { count } = await prisma.user.updateMany({
    where: { planStatus: "active", planExpiresAt: { lt: now } },
    data: { planStatus: "expired", planStatusUpdatedAt: now },
  });
  return count;
}

export async function updateUserLevel(
  userId: string,
  level: Level,
): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { level } });
}

export async function updateUserPendingIntent(
  userId: string,
  intent: string | null,
  metadata: Prisma.InputJsonValue | null = null,
): Promise<void> {
  await updateUserMetadata(
    userId,
    (current) => {
      const rest = omitKey(current, "intent_data");
      return intent && metadata !== null
        ? { ...rest, intent_data: metadata as Prisma.JsonValue }
        : rest;
    },
    { pendingIntent: intent, pendingIntentAt: intent ? new Date() : null },
  );
}

function toJsonObject(metadata: Prisma.JsonValue | undefined): Prisma.JsonObject {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata
    : {};
}

async function findUserMetadata(userId: string): Promise<Prisma.JsonObject> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  });
  return toJsonObject(user?.metadata);
}

// Le e grava na mesma transacao: chaves diferentes gravadas ao mesmo tempo
// (pedido de atividade, aviso de telefone, link) nao se apagam.
async function updateUserMetadata(
  userId: string,
  change: (current: Prisma.JsonObject) => Prisma.JsonObject,
  extraData: Prisma.UserUpdateInput = {},
): Promise<void> {
  await runSerializable(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    const next = change(toJsonObject(user?.metadata));
    await tx.user.update({
      where: { id: userId },
      data: {
        ...extraData,
        metadata:
          Object.keys(next).length > 0
            ? (next as Prisma.InputJsonObject)
            : Prisma.DbNull,
      },
    });
  });
}

function omitKey(
  metadata: Prisma.JsonObject,
  key: string,
): Prisma.JsonObject {
  return Object.fromEntries(
    Object.entries(metadata).filter(([entryKey]) => entryKey !== key),
  );
}

export async function findUserSignedLink(
  userId: string,
): Promise<UserSignedLinkMetadata | null> {
  const { signedLinkToken, signedLinkExpiresAt } =
    await findUserMetadata(userId);
  if (
    typeof signedLinkToken !== "string" ||
    typeof signedLinkExpiresAt !== "string"
  ) {
    return null;
  }
  return { signedLinkToken, signedLinkExpiresAt };
}

export async function updateUserSignedLink(
  userId: string,
  signedLink: UserSignedLinkMetadata,
): Promise<void> {
  await updateUserMetadata(userId, (current) => ({
    ...current,
    ...signedLink,
  }));
}

export async function findUserActivityCreation(
  userId: string,
): Promise<UserActivityCreationMetadata> {
  const { lastActivityRequest, activityCreatingAt } =
    await findUserMetadata(userId);
  return {
    lastActivityRequest:
      lastActivityRequest && typeof lastActivityRequest === "object"
        ? (lastActivityRequest as ResolvedActivityRequest)
        : null,
    activityCreatingAt:
      typeof activityCreatingAt === "string" ? activityCreatingAt : null,
  };
}

// Sem request grava so o horario: a marcacao sai antes da extracao do pedido.
export async function markUserActivityCreating(
  userId: string,
  request?: ResolvedActivityRequest,
): Promise<void> {
  await updateUserMetadata(userId, (current) => ({
    ...current,
    ...(request ? { lastActivityRequest: request as Prisma.JsonObject } : {}),
    activityCreatingAt: new Date().toISOString(),
  }));
}

export async function clearUserActivityCreating(userId: string): Promise<void> {
  await updateUserMetadata(userId, (current) =>
    omitKey(current, "activityCreatingAt"),
  );
}

export async function markUserPhonePrompted(userId: string): Promise<void> {
  await updateUserMetadata(userId, (current) => ({
    ...current,
    phonePromptedAt: new Date().toISOString(),
  }));
}

export async function updateUserPhone(
  userId: string,
  phone: string,
): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { phone } });
}

export async function updateUserPlan(
  userId: string,
  data: {
    planCode?: PlanCode;
    planStatus?: PlanStatus;
    planExpiresAt?: Date | null;
  },
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      ...(data.planCode !== undefined ? { planCodeUpdatedAt: new Date() } : {}),
      ...(data.planStatus !== undefined
        ? { planStatusUpdatedAt: new Date() }
        : {}),
    },
  });
}

// Update condicional: dois invoice.paid ao mesmo tempo, so um aplica o periodo
// (e manda a confirmacao). O outro encontra o mesmo valor ja gravado.
export async function applyPaidPlan(
  userId: string,
  planExpiresAt: Date,
): Promise<boolean> {
  const now = new Date();
  const { count } = await prisma.user.updateMany({
    where: {
      id: userId,
      // planExpiresAt nulo entra a parte: no SQL o NOT com NULL nao casa.
      OR: [
        { planExpiresAt: null },
        { NOT: { planCode: "pro", planStatus: "active", planExpiresAt } },
      ],
    },
    data: {
      planCode: "pro",
      planStatus: "active",
      planExpiresAt,
      planCodeUpdatedAt: now,
      planStatusUpdatedAt: now,
    },
  });
  return count > 0;
}

export async function updateUserCheckoutData(
  userId: string,
  checkoutData: CheckoutData | null,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { checkoutData: checkoutData ?? Prisma.DbNull },
  });
}

type UserStat = {
  total: number;
  active: number;
  trial: number;
  pro: number;
  expired: number;
  recent: {
    phone: string | null;
    email: string | null;
    name: string | null;
    createdAt: Date;
  }[];
};

export async function fetchUserStats(): Promise<UserStat> {
  const now = new Date();
  const [total, active, trial, pro, expired, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { planStatus: "active" } }),
    prisma.user.count({
      where: {
        planCode: "trial",
        planStatus: "active",
        planExpiresAt: { gt: now },
      },
    }),
    prisma.user.count({ where: { planCode: "pro", planStatus: "active" } }),
    prisma.user.count({ where: { planStatus: "expired" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { name: true, phone: true, email: true, createdAt: true },
    }),
  ]);
  return { total, active, trial, pro, expired, recent };
}

// Mesmo criterio do isTurnInProgress, num update so: duas mensagens ao mesmo
// tempo nunca pegam o turno juntas. lastResponseAt preenchido ja e o fim do
// turno anterior, porque a trava zera esse campo.
export async function claimUserTurn(
  userId: string,
  messageId: string,
  staleBefore: Date,
): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [
        { lastRequestAt: null },
        { lastResponseAt: { not: null } },
        { lastRequestAt: { lt: staleBefore } },
      ],
    },
    data: {
      lastRequestAt: new Date(),
      lastMessageId: messageId,
      lastResponseAt: null,
    },
  });
  return count > 0;
}

export async function updateUserLastResponse(
  userId: string,
  messageId: string,
): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, lastMessageId: messageId },
    data: { lastResponseAt: new Date() },
  });
}

type NewUserData = {
  identity: UserIdentity;
  name?: string | null;
  imageUrl?: string | null;
  planExpiresAt: Date;
  source: string | null;
  sourceData: Prisma.InputJsonValue | null;
  timezone?: string;
};

export function findUserByIdentity(
  identity: UserIdentity,
): Promise<User | null> {
  return prisma.user.findUnique({ where: identity });
}

async function createUser(data: NewUserData): Promise<User> {
  const { identity, name, imageUrl, planExpiresAt, source, sourceData, timezone } =
    data;
  return prisma.user.create({
    data: {
      ...identity,
      name: name ?? undefined,
      imageUrl: imageUrl ?? undefined,
      planCode: "trial",
      planStatus: "active",
      planExpiresAt,
      ...(source ? { source, sourceData: sourceData ?? undefined } : {}),
      ...(timezone
        ? {
            timezone,
            dailyReminderTime: getNearestReminderTimeSlot(new Date(), timezone),
          }
        : {}),
    },
  });
}

export async function findOrCreateUser(
  data: NewUserData,
): Promise<{ user: User; isNew: boolean }> {
  const existing = await findUserByIdentity(data.identity);
  if (existing) return { user: existing, isNew: false };

  try {
    return { user: await createUser(data), isNew: true };
  } catch (err) {
    // Login concorrente com a mesma identidade criou o User entre a busca e o insert.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const created = await findUserByIdentity(data.identity);
      if (created) return { user: created, isNew: false };
    }
    throw err;
  }
}

const DAILY_REMINDER_USER_INCLUDE = {
  activities: {
    where: { status: "active", deletedAt: null },
    orderBy: { statusUpdatedAt: "desc" },
    take: 1,
    select: { lastInteractionAt: true, createdAt: true },
  },
} satisfies Prisma.UserInclude;

export type DailyReminderCandidateUser = Prisma.UserGetPayload<{
  include: typeof DAILY_REMINDER_USER_INCLUDE;
}>;

// "Hoje" é o dia no fuso do usuário: em UTC, um lembrete das 21h BRT cairia no
// dia seguinte e bloquearia (ou liberaria em dobro) o lembrete do outro dia.
async function findUserIdsMatchingCurrentSlot(
  reminderKinds: string[],
  cursorId: string | null,
  limit: number,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT u.id
    FROM public.users u
    WHERE to_char(
        date_trunc('hour', now() AT TIME ZONE u.timezone)
        + (floor(extract(minute from now() AT TIME ZONE u.timezone) / 30) * 30 || ' minutes')::interval,
        'HH24:MI'
      ) = u.daily_reminder_time
      AND NOT EXISTS (
        SELECT 1
        FROM public.notifications n
        WHERE n.user_id = u.id
          AND n.kind IN (${Prisma.join(reminderKinds)})
          AND n.deleted_at IS NULL
          AND (n.created_at AT TIME ZONE 'UTC' AT TIME ZONE u.timezone)::date
            = (now() AT TIME ZONE u.timezone)::date
      )
      ${cursorId ? Prisma.sql`AND u.id > ${cursorId}` : Prisma.empty}
    ORDER BY u.id ASC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.id);
}

export async function findUsersForDailyReminder(
  reminderKinds: string[],
  cursorId: string | null,
  limit = 500,
): Promise<{
  users: DailyReminderCandidateUser[];
  lastRawId: string | null;
  rawBatchSize: number;
}> {
  const candidateIds = await findUserIdsMatchingCurrentSlot(
    reminderKinds,
    cursorId,
    limit,
  );
  if (candidateIds.length === 0) {
    return { users: [], lastRawId: null, rawBatchSize: 0 };
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: candidateIds },
      status: "active",
      planStatus: "active",
      OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: new Date() } }],
      activities: { some: { status: "active", deletedAt: null } },
    },
    include: DAILY_REMINDER_USER_INCLUDE,
  });

  return {
    users,
    lastRawId: candidateIds[candidateIds.length - 1],
    rawBatchSize: candidateIds.length,
  };
}

export async function updateUserDailyReminder(
  userId: string,
  data: { enabled: boolean; time: string; timezone: string },
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyReminderEnabled: data.enabled,
      dailyReminderTime: data.time,
      timezone: data.timezone,
    },
  });
}

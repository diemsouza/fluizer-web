import { Activity, User } from "../lib/prisma";
import { startOfUserDay } from "../lib/datetime-utils";
import {
  isPracticeLimitReached,
  isTurnInProgress,
  resolvePracticeActions,
  resolvePracticePillState,
  type PracticeActions,
  type PracticePillState,
} from "../core/practice-pill";
import { findCurrentActivityByUser } from "../repo/activities.repo";
import { getTodayUsage } from "../repo/daily-usage.repo";
import { findLastStudyMessage } from "../repo/messages.repo";
import {
  findNextGeneralQuestion,
  findPendingQuestion,
  findUserQuestionById,
} from "../repo/questions.repo";
import { findUserActivityCreation } from "../repo/users.repo";
import { findPendingDocByUser } from "../repo/docs.repo";
import { isActivityCreationInProgress } from "../core/activity-request";
import { DOC_PENDING_TIMEOUT_MS } from "../lib/constants";

async function findTodayLimitReached(
  userId: string,
  today: Date,
): Promise<boolean> {
  const usage = await getTodayUsage(userId, today);
  return isPracticeLimitReached(
    usage?.practiceCount ?? 0,
    usage?.intensiveCount ?? 0,
  );
}

// Nada e salvo: atividade ativa, nenhuma pergunta pendente e a ultima mensagem
// de estudo e o feedback da ultima pergunta respondida.
export async function findPracticeActions(
  activity: Pick<
    Activity,
    "id" | "status" | "roundCompleted" | "lastQuestionId"
  >,
  userId: string,
  today: Date,
): Promise<PracticeActions | null> {
  if (activity.status !== "active") return null;
  if (await findPendingQuestion(activity.id)) return null;

  const lastStudy = await findLastStudyMessage(userId, activity.id);
  if (!lastStudy?.questionId || lastStudy.intent === "practice_question") {
    return null;
  }
  const question = await findUserQuestionById(lastStudy.questionId, userId);
  if (!question?.answeredAt) return null;

  const hasNextQuestion =
    !activity.roundCompleted ||
    !!(await findNextGeneralQuestion(activity.id, activity.lastQuestionId));
  return resolvePracticeActions({
    question,
    messageId: lastStudy.id,
    isLimitReached: await findTodayLimitReached(userId, today),
    hasNextQuestion,
  });
}

export async function isActivityBeingCreated(
  userId: string,
  now: Date,
): Promise<boolean> {
  const [{ activityCreatingAt }, pendingDoc] = await Promise.all([
    findUserActivityCreation(userId),
    findPendingDocByUser(userId),
  ]);
  const isMaterialProcessing =
    pendingDoc !== null &&
    now.getTime() - pendingDoc.createdAt.getTime() < DOC_PENDING_TIMEOUT_MS;
  return isActivityCreationInProgress(activityCreatingAt, now) || isMaterialProcessing;
}

export async function findPracticePillState(
  user: Pick<User, "id" | "timezone" | "lastRequestAt" | "lastResponseAt">,
): Promise<PracticePillState> {
  const today = startOfUserDay(new Date(), user.timezone);
  const [activity, isLimitReached, isCreating] = await Promise.all([
    findCurrentActivityByUser(user.id),
    findTodayLimitReached(user.id, today),
    isActivityBeingCreated(user.id, new Date()),
  ]);
  const isTurnBusy = isCreating || isTurnInProgress(user, Date.now());
  const practiceActions =
    activity && !isTurnBusy
      ? await findPracticeActions(activity, user.id, today)
      : null;
  return resolvePracticePillState({
    hasActiveActivity: activity?.status === "active",
    intensiveUntil: activity?.intensiveUntil ?? null,
    isLimitReached,
    practiceActions,
  });
}

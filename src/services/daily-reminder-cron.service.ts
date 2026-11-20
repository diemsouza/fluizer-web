import {
  DailyReminderCandidateUser,
  findUsersForDailyReminder,
} from "../repo/users.repo";
import { countSm2EligibleQuestionsByUser } from "../repo/questions.repo";
import {
  createNotification,
  markNotificationSent,
} from "../repo/notifications.repo";
import {
  formatEngagementReminder,
  formatEngagementReminderEmail,
} from "../core/formatters";
import {
  daysSince,
  EngagementReminder,
  ENGAGEMENT_REMINDERS,
  isDailyReminderWindow,
  pickEngagementReminder,
} from "../core/engagement-reminder";
import { sendWhatsAppTemplate } from "../vendors/whatsapp.vendor";
import { EmailTemplates, sendEmailTemplateOrThrow } from "../vendors/email.vendor";
import { getOrCreateWaLoginUrl } from "./wa-login-link-service";
import { ReminderEmailDeliveryError } from "../lib/custom-errors";

const DAILY_REMINDER_BATCH_LIMIT = 500;

type ReminderParams = { eligibleCount: number; daysInactive: number };

type DailyReminderResult = {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
};

async function countEligibleIfNeeded(
  user: DailyReminderCandidateUser,
  daysInactive: number,
): Promise<number> {
  if (!user.dailyReminderEnabled || !isDailyReminderWindow(daysInactive)) {
    return 0;
  }
  return countSm2EligibleQuestionsByUser(user.id);
}

async function trySendReminder(
  user: DailyReminderCandidateUser,
  now: Date,
): Promise<"sent" | "skipped"> {
  const activity = user.activities[0];
  if (!activity) return "skipped";

  const daysInactive = daysSince(
    activity.lastInteractionAt ?? activity.createdAt,
    now,
  );
  const eligibleCount = await countEligibleIfNeeded(user, daysInactive);
  const reminder = pickEngagementReminder({
    daysInactive,
    isReminderEnabled: user.dailyReminderEnabled,
    eligibleCount,
  });
  if (!reminder) return "skipped";

  const params = { eligibleCount, daysInactive };
  // WhatsApp é o canal preferido; conta sem número (login pelo Google) recebe por e-mail.
  if (user.phone) {
    await sendWhatsAppReminder(user.id, user.phone, reminder, params, now);
    return "sent";
  }
  if (user.email) {
    await sendEmailReminder(user.id, user.email, reminder, params, now);
    return "sent";
  }
  return "skipped";
}

async function sendEmailReminder(
  userId: string,
  email: string,
  reminder: EngagementReminder,
  params: ReminderParams,
  now: Date,
): Promise<void> {
  const { subject, ...content } = formatEngagementReminderEmail(
    reminder,
    params,
  );
  const url = await getOrCreateWaLoginUrl(userId, { email });
  const isSent = await sendEmailTemplateOrThrow({
    to: email,
    subject,
    template: EmailTemplates.REMINDER,
    data: { ...content, url },
  });
  if (!isSent) throw new ReminderEmailDeliveryError();

  const notification = await createNotification({
    userId,
    targetChannel: "email",
    targetId: email,
    kind: reminder,
    message: `${content.title}\n\n${content.message}`,
    templateId: reminder,
    metadata: { subject, url },
    nextAt: now,
  });
  await markNotificationSent(notification.id, null);
}

async function sendWhatsAppReminder(
  userId: string,
  phone: string,
  reminder: EngagementReminder,
  params: ReminderParams,
  now: Date,
): Promise<void> {
  const message = formatEngagementReminder(reminder, params);
  const externalId = await sendWhatsAppTemplate(
    phone,
    reminder,
    message.templateBodyParams,
  );

  const notification = await createNotification({
    userId,
    targetChannel: "whatsapp",
    targetId: phone,
    kind: reminder,
    message: message.text,
    templateId: reminder,
    metadata: { templateBodyParams: message.templateBodyParams },
    nextAt: now,
  });
  await markNotificationSent(notification.id, externalId);
}

export async function decideDailyReminders(): Promise<DailyReminderResult> {
  const now = new Date();

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let errors = 0;
  let cursorId: string | null = null;

  for (;;) {
    const { users, lastRawId, rawBatchSize } = await findUsersForDailyReminder(
      ENGAGEMENT_REMINDERS,
      cursorId,
      DAILY_REMINDER_BATCH_LIMIT,
    );
    if (rawBatchSize === 0) break;

    for (const user of users) {
      processed++;
      try {
        const outcome = await trySendReminder(user, now);
        if (outcome === "sent") sent++;
        else skipped++;
      } catch (err) {
        console.error(`[decideDailyReminders] user ${user.id}:`, err);
        errors++;
      }
    }

    cursorId = lastRawId;
    if (rawBatchSize < DAILY_REMINDER_BATCH_LIMIT) break;
  }

  return { processed, sent, skipped, errors };
}

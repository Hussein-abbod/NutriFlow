import type { AppNotification, DailyReminder } from '@/lib/platform/notifications';

/** notification_service.dart `_scheduleDailyReminders`: 8:00, 14:00 and 20:00 local time. */
export const DAILY_REMINDERS: readonly DailyReminder[] = [
  {
    tag: 'reminder-breakfast',
    hour: 8,
    minute: 0,
    title: 'Good Morning!',
    body: "Don't forget to log your breakfast today to stay on track!",
  },
  {
    tag: 'reminder-lunch',
    hour: 14,
    minute: 0,
    title: 'Checking in',
    body: 'Have you logged your meals yet? Keeping track helps you hit your goals.',
  },
  {
    tag: 'reminder-dinner',
    hour: 20,
    minute: 0,
    title: 'Daily Wrap-up',
    body: 'Time to log your dinner and check your daily progress!',
  },
];

/** `showTargetReachedNotification` */
export const TARGET_REACHED: AppNotification = {
  tag: 'target-reached',
  title: 'Target Reached!',
  body: "Great job! You've reached your daily calorie target.",
};

/** "8:00, 14:00 and 20:00" in the user's locale. */
export function reminderTimesLabel(locale?: string): string {
  const times = DAILY_REMINDERS.map(({ hour, minute }) =>
    new Date(2000, 0, 1, hour, minute).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  );
  return `${times.slice(0, -1).join(', ')} and ${times.at(-1) ?? ''}`;
}

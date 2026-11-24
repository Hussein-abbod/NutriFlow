import { notifications } from '@/lib/platform/notifications';
import { TARGET_REACHED } from './messages';
import { claimTargetNotification, useNotificationSettings } from './notificationSettings';

/**
 * FoodLogProvider: "Target Reached!" once the day's calories reach the daily target
 * (Flutter used a fixed 2000 kcal). Shown at most once per day, only with reminders on.
 */
export function notifyTargetReached(consumed: number, target: number, isoDay: string) {
  if (target <= 0 || consumed < target) return;
  if (!useNotificationSettings.getState().remindersEnabled) return;
  if (notifications.permission() !== 'granted') return;
  if (claimTargetNotification(isoDay)) void notifications.show(TARGET_REACHED);
}

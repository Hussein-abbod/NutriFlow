import { useEffect } from 'react';
import { notifications } from '@/lib/platform/notifications';
import { DAILY_REMINDERS } from './messages';
import { useNotificationSettings } from './notificationSettings';

/**
 * NotificationService.init: while the signed-in app is open and the user turned reminders
 * on, the daily meal reminders are scheduled. Leaving the app (logout) cancels them.
 */
export function useMealReminders() {
  const remindersEnabled = useNotificationSettings((state) => state.remindersEnabled);

  useEffect(() => {
    if (!remindersEnabled || notifications.permission() !== 'granted') return;
    notifications.scheduleDailyReminders(DAILY_REMINDERS);
    return () => notifications.cancelDailyReminders();
  }, [remindersEnabled]);
}

import { useState } from 'react';
import { notifications, type NotificationPermissionState } from '@/lib/platform/notifications';
import { useNotificationSettings } from './notificationSettings';

export type ReminderStatus = 'on' | 'off' | 'blocked' | 'unsupported';

/**
 * The meal-reminder switch. Turning it on asks for permission (it must run in a click
 * handler); a denied permission can only be changed in the browser settings.
 */
export function useReminderSettings() {
  const remindersEnabled = useNotificationSettings((state) => state.remindersEnabled);
  const setRemindersEnabled = useNotificationSettings((state) => state.setRemindersEnabled);
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    notifications.permission(),
  );
  const [asking, setAsking] = useState(false);

  const status: ReminderStatus =
    permission === 'unsupported'
      ? 'unsupported'
      : permission === 'denied'
        ? 'blocked'
        : remindersEnabled && permission === 'granted'
          ? 'on'
          : 'off';

  /** Resolves to the resulting status so callers can show feedback. */
  const enable = async (): Promise<ReminderStatus> => {
    setAsking(true);
    try {
      const answer =
        notifications.permission() === 'granted'
          ? 'granted'
          : await notifications.requestPermission();
      setPermission(answer);
      if (answer === 'granted') {
        setRemindersEnabled(true);
        return 'on';
      }
      return answer === 'unsupported' ? 'unsupported' : answer === 'denied' ? 'blocked' : 'off';
    } finally {
      setAsking(false);
    }
  };

  const disable = () => setRemindersEnabled(false);

  /** The browser has not been asked yet, so a prompt can still lead to a permission dialog. */
  const canAsk = permission === 'default' && !remindersEnabled;

  return { status, canAsk, asking, enable, disable };
}

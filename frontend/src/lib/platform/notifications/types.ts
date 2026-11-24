/** Whether the app may show notifications ('unsupported': this browser cannot at all). */
export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface AppNotification {
  title: string;
  body: string;
  /** Notifications with the same tag replace each other instead of piling up. */
  tag: string;
}

/** A notification repeated every day at a local time (notification_service.dart). */
export interface DailyReminder extends AppNotification {
  hour: number;
  minute: number;
}

/**
 * Local notifications. The web build uses the Notifications API; the Capacitor build will
 * swap in `@capacitor/local-notifications` behind the same interface.
 */
export interface NotificationAdapter {
  permission: () => NotificationPermissionState;
  /** Must be called from a user gesture (click) on the web. */
  requestPermission: () => Promise<NotificationPermissionState>;
  show: (notification: AppNotification) => Promise<void>;
  /**
   * Repeat these reminders daily (replacing earlier ones). Native schedules them with the
   * OS; the web can only fire them while the app is open in a tab or installed window.
   */
  scheduleDailyReminders: (reminders: readonly DailyReminder[]) => void;
  cancelDailyReminders: () => void;
}

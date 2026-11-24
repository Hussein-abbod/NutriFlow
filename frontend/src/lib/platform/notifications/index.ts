import type { NotificationAdapter } from './types';
import { webNotifications } from './webNotifications';

export { nextOccurrence } from './nextOccurrence';
export type {
  AppNotification,
  DailyReminder,
  NotificationAdapter,
  NotificationPermissionState,
} from './types';

/** Local notifications for this platform (web today; the Capacitor build replaces it). */
export const notifications: NotificationAdapter = webNotifications;

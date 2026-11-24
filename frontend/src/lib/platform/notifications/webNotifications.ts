import { nextOccurrence } from './nextOccurrence';
import type {
  AppNotification,
  DailyReminder,
  NotificationAdapter,
  NotificationPermissionState,
} from './types';

const ICON = '/icons/icon-192.png';

const supported = () => typeof window !== 'undefined' && 'Notification' in window;

function permission(): NotificationPermissionState {
  return supported() ? Notification.permission : 'unsupported';
}

async function requestPermission(): Promise<NotificationPermissionState> {
  if (!supported()) return 'unsupported';
  return Notification.requestPermission();
}

/**
 * Android Chrome only allows notifications through the service worker (`new Notification`
 * throws there); without a worker (dev server, old browsers) the constructor is used.
 */
async function show({ title, body, tag }: AppNotification): Promise<void> {
  if (permission() !== 'granted') return;
  // `serviceWorker` is missing outside secure contexts (plain http on a LAN address).
  const registration =
    'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  if (registration) {
    await registration.showNotification(title, { body, tag, icon: ICON, badge: ICON });
    return;
  }
  new Notification(title, { body, tag, icon: ICON });
}

let timers: ReturnType<typeof setTimeout>[] = [];

function cancelDailyReminders() {
  timers.forEach(clearTimeout);
  timers = [];
}

function scheduleDailyReminders(reminders: readonly DailyReminder[]) {
  cancelDailyReminders();
  const arm = (reminder: DailyReminder) => {
    const delay = nextOccurrence(new Date(), reminder.hour, reminder.minute).getTime() - Date.now();
    const timer = setTimeout(() => {
      timers = timers.filter((other) => other !== timer);
      void show(reminder);
      arm(reminder);
    }, delay);
    timers.push(timer);
  };
  reminders.forEach(arm);
}

export const webNotifications: NotificationAdapter = {
  permission,
  requestPermission,
  show,
  scheduleDailyReminders,
  cancelDailyReminders,
};

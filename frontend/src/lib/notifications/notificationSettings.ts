import { create } from 'zustand';

const REMINDERS_KEY = 'nutriflow.reminders';
const PROMPT_DISMISSED_KEY = 'nutriflow.remindersPromptDismissed';
const TARGET_NOTIFIED_KEY = 'nutriflow.targetNotifiedOn';

/** Device preferences only (never anything sensitive), so localStorage is fine. */
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage blocked
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Not remembered across visits; still applies now.
  }
}

interface NotificationSettingsState {
  /** The user turned meal reminders on (on this device). */
  remindersEnabled: boolean;
  /** "Not now" on the food-log prompt: don't ask again. */
  promptDismissed: boolean;
  setRemindersEnabled: (enabled: boolean) => void;
  dismissPrompt: () => void;
}

export const useNotificationSettings = create<NotificationSettingsState>((set) => ({
  remindersEnabled: read(REMINDERS_KEY) === 'on',
  promptDismissed: read(PROMPT_DISMISSED_KEY) === 'yes',
  setRemindersEnabled: (enabled) => {
    write(REMINDERS_KEY, enabled ? 'on' : null);
    set({ remindersEnabled: enabled });
  },
  dismissPrompt: () => {
    write(PROMPT_DISMISSED_KEY, 'yes');
    set({ promptDismissed: true });
  },
}));

/** True the first time it is called for `isoDay` (the celebration shows once a day). */
export function claimTargetNotification(isoDay: string): boolean {
  if (read(TARGET_NOTIFIED_KEY) === isoDay) return false;
  write(TARGET_NOTIFIED_KEY, isoDay);
  return true;
}

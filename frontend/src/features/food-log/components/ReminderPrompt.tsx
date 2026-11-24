import { Button, Icon, showSnackbar } from '@/components';
import {
  reminderTimesLabel,
  useNotificationSettings,
  useReminderSettings,
} from '@/lib/notifications';
import styles from './ReminderPrompt.module.css';

/**
 * Asks about meal reminders at a sensible moment: after the user has logged food today,
 * once, and only while the browser has not been asked yet (Flutter asked at app start).
 */
export function ReminderPrompt() {
  const { canAsk, asking, enable } = useReminderSettings();
  const dismissed = useNotificationSettings((state) => state.promptDismissed);
  const dismiss = useNotificationSettings((state) => state.dismissPrompt);
  if (!canAsk || dismissed) return null;

  const turnOn = async () => {
    const status = await enable();
    dismiss();
    if (status === 'on') showSnackbar('Meal reminders are on');
    else if (status === 'blocked')
      showSnackbar('Notifications are blocked in your browser', 'error');
  };

  return (
    <section className={styles.prompt} aria-labelledby="reminder-prompt-title">
      <span className={styles.icon} aria-hidden="true">
        <Icon name="notificationsOutlined" size={22} />
      </span>
      <div className={styles.text}>
        <h2 id="reminder-prompt-title" className={styles.title}>
          Get meal reminders?
        </h2>
        <p className={styles.body}>
          A nudge at {reminderTimesLabel()} to log your meals, and a cheer when you hit your target.
        </p>
        <div className={styles.actions}>
          <Button variant="text" onClick={dismiss} disabled={asking}>
            Not now
          </Button>
          <Button
            variant="outlined"
            loading={asking}
            loadingLabel="Turning on reminders"
            onClick={() => void turnOn()}
          >
            Turn on
          </Button>
        </div>
      </div>
    </section>
  );
}

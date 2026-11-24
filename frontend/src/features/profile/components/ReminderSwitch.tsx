import { useId } from 'react';
import { showSnackbar } from '@/components';
import { reminderTimesLabel, useReminderSettings, type ReminderStatus } from '@/lib/notifications';
import styles from './ReminderSwitch.module.css';

function description(status: ReminderStatus): string {
  switch (status) {
    case 'blocked':
      return 'Notifications are blocked. Allow them for this site in your browser settings.';
    case 'unsupported':
      return "This browser can't show notifications. On iPhone or iPad, add NutriFlow to your Home Screen first.";
    default:
      return `At ${reminderTimesLabel()} while NutriFlow is open, and when you reach your daily target.`;
  }
}

/** Meal reminders (notification_service.dart), switched on here per device. */
export function ReminderSwitch() {
  const { status, asking, enable, disable } = useReminderSettings();
  const labelId = useId();
  const descriptionId = useId();
  const on = status === 'on';

  const toggle = async () => {
    if (on) {
      disable();
      return;
    }
    const result = await enable();
    if (result === 'on') showSnackbar('Meal reminders are on');
    else if (result === 'blocked')
      showSnackbar('Notifications are blocked in your browser', 'error');
  };

  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <p id={labelId} className={styles.label}>
          Meal reminders
        </p>
        <p id={descriptionId} className={styles.description}>
          {description(status)}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        className={styles.switch}
        aria-checked={on}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={asking || status === 'blocked' || status === 'unsupported'}
        onClick={() => void toggle()}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
    </div>
  );
}

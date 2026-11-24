import { ReminderSwitch } from './ReminderSwitch';
import { SectionCard } from './SectionCard';
import { ThemeSelector } from './ThemeSelector';
import styles from './AppSettingsCard.module.css';

/** New in the web app: theme and meal reminders (both stored on this device). */
export function AppSettingsCard() {
  return (
    <SectionCard title="App Settings" icon="smartphone">
      <div className={styles.body}>
        <ThemeSelector />
        <ReminderSwitch />
      </div>
    </SectionCard>
  );
}

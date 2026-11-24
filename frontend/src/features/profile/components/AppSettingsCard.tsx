import { InstallAppRow } from './InstallAppRow';
import { ReminderSwitch } from './ReminderSwitch';
import { SectionCard } from './SectionCard';
import { ThemeSelector } from './ThemeSelector';
import styles from './AppSettingsCard.module.css';

/** New in the web app: theme, meal reminders (both stored on this device), install. */
export function AppSettingsCard() {
  return (
    <SectionCard title="App Settings" icon="smartphone">
      <div className={styles.body}>
        <ThemeSelector />
        <ReminderSwitch />
        <InstallAppRow />
      </div>
    </SectionCard>
  );
}

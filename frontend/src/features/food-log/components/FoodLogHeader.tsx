import { Icon } from '@/components';
import styles from './FoodLogHeader.module.css';

/** Top bar of food_log_tab.dart: initial avatar + "NutriFlow" + notifications bell. */
export function FoodLogHeader({ fullName }: { fullName: string | null | undefined }) {
  const firstName = fullName?.trim().split(/\s+/)[0] ?? '';
  const initial = firstName.charAt(0).toUpperCase() || 'U';
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.avatar} aria-hidden="true">
          {initial}
        </span>
        <h1 className={styles.title}>
          NutriFlow<span className="visually-hidden"> food log</span>
        </h1>
      </div>
      {/* Notifications arrive with the profile tab (session 4); Flutter's button did nothing. */}
      <Icon name="notificationsOutlined" className={styles.bell} />
    </header>
  );
}

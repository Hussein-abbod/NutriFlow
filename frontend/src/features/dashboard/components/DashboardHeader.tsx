import styles from './DashboardHeader.module.css';

/** Flat header shared with the food log: small "Dashboard" label over "Today's Overview". */
export function DashboardHeader() {
  return (
    <header className={styles.header}>
      <p className={styles.eyebrow}>Dashboard</p>
      <h1 className={styles.title}>Today&apos;s Overview</h1>
    </header>
  );
}

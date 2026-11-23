import type { ReactNode } from 'react';
import { EmptyState } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import styles from './TabPlaceholder.module.css';

export interface TabPlaceholderProps {
  title: string;
  subtitle: string;
  icon: IconName;
  /** Extra content under the message (e.g. the Log out button on Profile). */
  action?: ReactNode;
}

/** A tab that later sessions will build: the tab header and a calm "coming soon" state. */
export function TabPlaceholder({ title, subtitle, icon, action }: TabPlaceholderProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>
      <EmptyState
        icon={icon}
        title="Coming soon"
        message="This part of NutriFlow is being rebuilt for the web app."
        action={action}
      />
    </main>
  );
}

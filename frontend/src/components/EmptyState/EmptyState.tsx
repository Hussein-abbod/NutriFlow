import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon/Icon';
import type { IconName } from '@/components/Icon/icons';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  action?: ReactNode;
}

/** Tinted icon bubble + title + message (coach_ai_tab.dart empty conversation). */
export function EmptyState({ title, message, icon = 'inbox', action }: EmptyStateProps) {
  return (
    <section className={styles.root} aria-label={title}>
      <div className={styles.bubble}>
        <Icon name={icon} size={40} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.message}>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}

import type { ReactNode } from 'react';
import styles from './AuthHeader.module.css';

export interface AuthHeaderProps {
  badge: ReactNode;
  title: string;
  subtitle: string;
}

/** Badge + 28/800 white title + 70% white subtitle, shared by login and register. */
export function AuthHeader({ badge, title, subtitle }: AuthHeaderProps) {
  return (
    <header className={styles.header}>
      {badge}
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}

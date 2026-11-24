import type { ReactNode } from 'react';
import { useId } from 'react';
import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import styles from './SectionCard.module.css';

export interface SectionCardProps {
  title: string;
  icon: IconName;
  /** Shown at the end of the title row (e.g. an edit button). */
  action?: ReactNode;
  children: ReactNode;
}

/** profile_tab.dart `_SectionCard`: bordered card with an icon + title row. */
export function SectionCard({ title, icon, action, children }: SectionCardProps) {
  const titleId = useId();
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <div className={styles.titleRow}>
        <h2 id={titleId} className={styles.title}>
          <Icon name={icon} size={18} className={styles.icon} />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

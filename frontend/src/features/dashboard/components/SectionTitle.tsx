import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import styles from './SectionTitle.module.css';

export interface SectionTitleProps {
  id: string;
  title: string;
  icon: IconName;
}

/** `_SectionTitle`: primary icon + 18/700 heading. */
export function SectionTitle({ id, title, icon }: SectionTitleProps) {
  return (
    <h2 id={id} className={styles.title}>
      <Icon name={icon} size={20} className={styles.icon} />
      {title}
    </h2>
  );
}

import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import { cn } from '@/lib/utils/cn';
import styles from './StepHeader.module.css';

export interface StepHeaderProps {
  icon: IconName;
  title: string;
  subtitle: string;
  /** The summary step uses a slightly bigger badge (padding 16, icon 40). */
  size?: 'default' | 'large';
}

/** Icon badge + white headline + subtitle at the top of every onboarding step. */
export function StepHeader({ icon, title, subtitle, size = 'default' }: StepHeaderProps) {
  const large = size === 'large';
  return (
    <header className={styles.header}>
      <div className={cn(styles.badge, large && styles.badgeLarge)}>
        <Icon name={icon} size={large ? 40 : 36} />
      </div>
      {/* tabIndex -1: focus moves here when the step changes, for screen readers. */}
      <h1 className={styles.title} tabIndex={-1}>
        {title}
      </h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}

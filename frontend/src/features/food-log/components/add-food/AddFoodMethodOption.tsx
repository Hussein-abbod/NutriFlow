import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import { cn } from '@/lib/utils/cn';
import type { OpenedFromLogState } from '../../paths';
import styles from './AddFoodMethodOption.module.css';

export type MethodTone = 'primary' | 'photo' | 'coral';

export interface AddFoodMethodOptionProps {
  to: string;
  icon: IconName;
  title: string;
  subtitle: string;
  tone: MethodTone;
  /** Extra entrance time: Flutter animates each tile for 400 ms + delay. */
  delayMs: number;
}

const OPENED_FROM_LOG: OpenedFromLogState = { fromFoodLog: true };

/** `_OptionTile`: gradient icon badge, title, subtitle and a chevron. */
export function AddFoodMethodOption({
  to,
  icon,
  title,
  subtitle,
  tone,
  delayMs,
}: AddFoodMethodOptionProps) {
  const style = { '--entrance-duration': `${400 + delayMs}ms` } as CSSProperties;
  return (
    <li className={styles.entrance} style={style}>
      <Link to={to} state={OPENED_FROM_LOG} className={styles.tile}>
        <span className={cn(styles.badge, styles[tone])} aria-hidden="true">
          <Icon name={icon} size={22} />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>{title}</span>
          <span className={styles.subtitle}>{subtitle}</span>
        </span>
        <Icon name="arrowForwardIos" size={14} className={styles.chevron} />
      </Link>
    </li>
  );
}

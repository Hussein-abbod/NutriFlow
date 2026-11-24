import { Icon } from '@/components';
import { cn } from '@/lib/utils/cn';
import styles from './CoachAvatar.module.css';

export interface CoachAvatarProps {
  kind: 'coach' | 'user';
  /** `large` = the 24px robot in the tab header, `small` = the 14px badge next to bubbles. */
  size?: 'large' | 'small';
}

/** The tinted square with the robot (coach) or person (user) icon. Decorative. */
export function CoachAvatar({ kind, size = 'small' }: CoachAvatarProps) {
  return (
    <span className={cn(styles.avatar, styles[size])} aria-hidden="true">
      <Icon name={kind === 'coach' ? 'smartToy' : 'person'} size={size === 'large' ? 24 : 14} />
    </span>
  );
}

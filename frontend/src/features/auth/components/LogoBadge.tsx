import logoUrl from '@/assets/logo.png';
import { cn } from '@/lib/utils/cn';
import styles from './LogoBadge.module.css';

export interface LogoBadgeProps {
  /** `splash`: 120px circle, 80px logo. `login`: 20px padding, 64px logo. */
  variant: 'splash' | 'login';
  className?: string;
}

/** The app logo inside a translucent white circle (splash + login screens). */
export function LogoBadge({ variant, className }: LogoBadgeProps) {
  const size = variant === 'splash' ? 80 : 64;
  return (
    <div className={cn(styles.badge, styles[variant], className)}>
      <img src={logoUrl} alt="" width={size} height={size} className={styles.logo} />
    </div>
  );
}

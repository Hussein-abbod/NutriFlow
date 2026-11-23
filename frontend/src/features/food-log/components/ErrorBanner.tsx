import { Icon } from '@/components';
import { cn } from '@/lib/utils/cn';
import styles from './ErrorBanner.module.css';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/** add_food_sheet.dart `_ErrorBanner`: coral tinted message with a Retry button. */
export function ErrorBanner({
  message,
  onRetry,
  retryLabel = 'Retry',
  className,
}: ErrorBannerProps) {
  return (
    <div className={cn(styles.banner, className)} role="alert">
      <Icon name="errorOutline" className={styles.icon} />
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

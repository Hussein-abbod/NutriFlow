import { Button } from '@/components/Button/Button';
import { Icon } from '@/components/Icon/Icon';
import styles from './ErrorState.module.css';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Centered error with a Retry action (dashboard_tab.dart error state). */
export function ErrorState({ message, onRetry, retryLabel = 'Retry' }: ErrorStateProps) {
  return (
    <div className={styles.root} role="alert">
      <Icon name="errorOutline" size={48} className={styles.icon} />
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="text" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

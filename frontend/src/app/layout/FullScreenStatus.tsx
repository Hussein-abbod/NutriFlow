import { ErrorState, Spinner } from '@/components';
import styles from './FullScreenStatus.module.css';

export interface FullScreenStatusProps {
  /** When set, shows an error with Retry instead of the spinner. */
  error?: string;
  onRetry?: () => void;
}

/** Centered loading spinner or error used while route data is resolving. */
export function FullScreenStatus({ error, onRetry }: FullScreenStatusProps) {
  return (
    <main className={styles.screen}>
      {error ? <ErrorState message={error} onRetry={onRetry} /> : <Spinner />}
    </main>
  );
}

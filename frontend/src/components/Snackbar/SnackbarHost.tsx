import { useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useSnackbarStore } from './snackbarStore';
import styles from './Snackbar.module.css';

/** Renders the current floating snackbar. Mount once at the app root. */
export function SnackbarHost() {
  const current = useSnackbarStore((state) => state.current);
  const dismiss = useSnackbarStore((state) => state.dismiss);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, current.durationMs);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  return (
    <div className={styles.region} aria-live="polite">
      {current && (
        <div
          key={current.id}
          role={current.tone === 'error' ? 'alert' : 'status'}
          className={cn(styles.snackbar, current.tone === 'error' && styles.error)}
        >
          {current.message}
        </div>
      )}
    </div>
  );
}

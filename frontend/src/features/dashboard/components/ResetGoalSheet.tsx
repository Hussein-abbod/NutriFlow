import { BottomSheet, Button, showSnackbar } from '@/components';
import { getErrorMessage } from '@/lib/api';
import { useResetGoal } from '../api/useGoalActions';
import styles from './ResetGoalSheet.module.css';

export interface ResetGoalSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Confirmation before "Reset Goal" (Flutter reset at once). On success the user is no
 * longer onboarded, so the route guard opens onboarding. Used by Dashboard and Profile.
 */
export function ResetGoalSheet({ open, onClose }: ResetGoalSheetProps) {
  const resetGoal = useResetGoal();
  const reset = () =>
    resetGoal.mutate(undefined, {
      onSuccess: onClose,
      onError: (error) => showSnackbar(getErrorMessage(error), 'error'),
    });

  return (
    <BottomSheet open={open} onClose={onClose} label="Reset goal">
      <div className={styles.sheet}>
        <h2 className={styles.title}>Reset your goal?</h2>
        <p className={styles.text}>
          You&apos;ll set up a new goal and get new daily targets. Your food log stays as it is.
        </p>
        <div className={styles.actions}>
          <Button variant="text" onClick={onClose} disabled={resetGoal.isPending}>
            Cancel
          </Button>
          <Button
            variant="text"
            className={styles.reset}
            loading={resetGoal.isPending}
            loadingLabel="Resetting goal"
            onClick={reset}
          >
            Reset Goal
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

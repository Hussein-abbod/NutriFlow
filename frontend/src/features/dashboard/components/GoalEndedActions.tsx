import { useState } from 'react';
import { BottomSheet, Button, Icon, showSnackbar } from '@/components';
import { getErrorMessage } from '@/lib/api';
import { GOAL_EXTENSION_WEEKS, useExtendGoal, useResetGoal } from '../api/useGoalActions';
import styles from './GoalEndedActions.module.css';

const showError = (error: unknown) => showSnackbar(getErrorMessage(error), 'error');

/**
 * Shown when the goal period is over (0 days left). Offers the profile tab's goal actions:
 * extend by 2 weeks, or reset the goal (after a confirmation) and run onboarding again.
 */
export function GoalEndedActions() {
  const extendGoal = useExtendGoal();
  const resetGoal = useResetGoal();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = extendGoal.isPending || resetGoal.isPending;

  const extend = () =>
    extendGoal.mutate(undefined, {
      onSuccess: () => showSnackbar(`Goal extended by ${GOAL_EXTENSION_WEEKS} weeks.`),
      onError: showError,
    });

  const reset = () =>
    resetGoal.mutate(undefined, {
      onSuccess: () => setConfirmOpen(false),
      onError: showError,
    });

  return (
    <div className={styles.ended}>
      <p className={styles.message}>Your goal period has ended. What&apos;s next?</p>
      <div className={styles.actions}>
        <Button
          variant="outlined"
          leadingIcon={<Icon name="flag" size={18} />}
          loading={extendGoal.isPending}
          loadingLabel="Extending goal"
          disabled={busy}
          onClick={extend}
        >
          Extend {GOAL_EXTENSION_WEEKS} weeks
        </Button>
        <Button
          variant="text"
          className={styles.reset}
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
        >
          Reset Goal
        </Button>
      </div>

      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} label="Reset goal">
        <div className={styles.sheet}>
          <h2 className={styles.sheetTitle}>Reset your goal?</h2>
          <p className={styles.sheetText}>
            You&apos;ll set up a new goal and get new daily targets. Your food log stays as it is.
          </p>
          <div className={styles.sheetActions}>
            <Button
              variant="text"
              onClick={() => setConfirmOpen(false)}
              disabled={resetGoal.isPending}
            >
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
    </div>
  );
}

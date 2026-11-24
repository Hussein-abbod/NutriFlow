import { useState } from 'react';
import { Button, Icon, showSnackbar } from '@/components';
import { getErrorMessage } from '@/lib/api';
import { GOAL_EXTENSION_WEEKS, useExtendGoal } from '../api/useGoalActions';
import { ResetGoalSheet } from './ResetGoalSheet';
import styles from './GoalEndedActions.module.css';

/**
 * Shown when the goal period is over (0 days left). Offers the profile tab's goal actions:
 * extend by 2 weeks, or reset the goal (after a confirmation) and run onboarding again.
 */
export function GoalEndedActions() {
  const extendGoal = useExtendGoal();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const extend = () =>
    extendGoal.mutate(undefined, {
      onSuccess: () => showSnackbar(`Goal extended by ${GOAL_EXTENSION_WEEKS} weeks.`),
      onError: (error) => showSnackbar(getErrorMessage(error), 'error'),
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
          onClick={extend}
        >
          Extend {GOAL_EXTENSION_WEEKS} weeks
        </Button>
        <Button
          variant="text"
          className={styles.reset}
          disabled={extendGoal.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          Reset Goal
        </Button>
      </div>
      <ResetGoalSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </div>
  );
}

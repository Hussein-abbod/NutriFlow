import { useState } from 'react';
import { showSnackbar } from '@/components';
import { useLogout } from '@/features/auth';
// Deep imports: the dashboard index would pull its lazy chart bundle in.
import { GOAL_EXTENSION_WEEKS, useExtendGoal } from '@/features/dashboard/api/useGoalActions';
import { ResetGoalSheet } from '@/features/dashboard/components/ResetGoalSheet';
import { getErrorMessage } from '@/lib/api';
import { ActionTile } from './ActionTile';
import { ChangePasswordSheet } from './ChangePasswordSheet';
import { SectionCard } from './SectionCard';
import styles from './AccountCard.module.css';

/** "Account": change password, extend / reset the goal, log out. */
export function AccountCard() {
  const extendGoal = useExtendGoal();
  const logout = useLogout();
  const [open, setOpen] = useState<'password' | 'reset' | null>(null);
  const close = () => setOpen(null);

  const extend = () =>
    extendGoal.mutate(undefined, {
      onSuccess: () => showSnackbar(`Goal extended by ${GOAL_EXTENSION_WEEKS} weeks.`),
      onError: (error) => showSnackbar(getErrorMessage(error), 'error'),
    });

  return (
    <SectionCard title="Account" icon="settingsOutlined">
      <div className={styles.tiles}>
        <ActionTile
          icon="lockOutline"
          label="Change Password"
          onClick={() => setOpen('password')}
        />
        <hr className={styles.divider} />
        <ActionTile
          icon="flag"
          label={`Extend Goal (${GOAL_EXTENSION_WEEKS} Weeks)`}
          busy={extendGoal.isPending}
          onClick={extend}
        />
        <ActionTile
          icon="refresh"
          label="Reset Goal"
          destructive
          onClick={() => setOpen('reset')}
        />
        <ActionTile
          icon="logout"
          label="Logout"
          destructive
          busy={logout.isPending}
          onClick={() => logout.mutate()}
        />
      </div>
      <ChangePasswordSheet open={open === 'password'} onClose={close} />
      <ResetGoalSheet open={open === 'reset'} onClose={close} />
    </SectionCard>
  );
}

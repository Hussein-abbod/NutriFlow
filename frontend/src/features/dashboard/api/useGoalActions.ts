import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRefreshCurrentUser } from '@/features/auth';
import { dashboardApi } from './dashboardApi';
import { dashboardKeys } from './queryKeys';

/** Weeks added by "Extend Goal" (profile_tab.dart extends by 2). */
export const GOAL_EXTENSION_WEEKS = 2;

/** PUT /dashboard/extend-goal: new target date and gentler daily targets. */
export function useExtendGoal() {
  const queryClient = useQueryClient();
  const refreshCurrentUser = useRefreshCurrentUser();
  return useMutation({
    mutationFn: () => dashboardApi.extendGoal({ extra_weeks: GOAL_EXTENSION_WEEKS }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        refreshCurrentUser(),
      ]);
    },
  });
}

/**
 * PUT /dashboard/reset-goal: the goal ends and the profile is no longer complete, so the
 * refreshed user is sent back to onboarding by the route guard.
 */
export function useResetGoal() {
  const queryClient = useQueryClient();
  const refreshCurrentUser = useRefreshCurrentUser();
  return useMutation({
    mutationFn: () => dashboardApi.resetGoal(),
    onSuccess: async () => {
      await refreshCurrentUser();
      queryClient.removeQueries({ queryKey: dashboardKeys.all });
    },
  });
}

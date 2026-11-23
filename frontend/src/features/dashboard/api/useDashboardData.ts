import { useQueries } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api';
import type { DailyCaloriesDto, GoalProgressDto, TodaySummaryDto } from '@/types/api';
import { dashboardApi } from './dashboardApi';
import { dashboardKeys } from './queryKeys';

export type DashboardData =
  | { status: 'pending' }
  | { status: 'error'; message: string; retry: () => void }
  | {
      status: 'success';
      today: TodaySummaryDto;
      weekly: DailyCaloriesDto[];
      goal: GoalProgressDto;
    };

/**
 * DashboardProvider.loadDashboard(): today, weekly and goal progress are loaded together
 * and the tab only renders once all three are there (or shows one error with Retry).
 */
export function useDashboardData(): DashboardData {
  return useQueries({
    queries: [
      { queryKey: dashboardKeys.today(), queryFn: ({ signal }) => dashboardApi.today(signal) },
      { queryKey: dashboardKeys.weekly(), queryFn: ({ signal }) => dashboardApi.weekly(signal) },
      {
        queryKey: dashboardKeys.goalProgress(),
        queryFn: ({ signal }) => dashboardApi.goalProgress(signal),
      },
    ],
    combine: ([today, weekly, goal]): DashboardData => {
      if (today.data && weekly.data && goal.data) {
        return { status: 'success', today: today.data, weekly: weekly.data, goal: goal.data };
      }
      const failed = [today, weekly, goal].find((query) => query.isError);
      if (failed) {
        return {
          status: 'error',
          message: getErrorMessage(failed.error),
          retry: () => {
            void today.refetch();
            void weekly.refetch();
            void goal.refetch();
          },
        };
      }
      return { status: 'pending' };
    },
  });
}

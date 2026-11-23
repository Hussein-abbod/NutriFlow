import { apiClient } from '@/lib/api';
import type {
  DailyCaloriesDto,
  ExtendGoalRequestDto,
  GoalProgressDto,
  MessageDto,
  TodaySummaryDto,
} from '@/types/api';

/** services/dashboard_service.dart */
export const dashboardApi = {
  today: (signal?: AbortSignal) => apiClient.get<TodaySummaryDto>('/dashboard/today', { signal }),

  weekly: (signal?: AbortSignal) =>
    apiClient.get<DailyCaloriesDto[]>('/dashboard/weekly', { signal }),

  goalProgress: (signal?: AbortSignal) =>
    apiClient.get<GoalProgressDto>('/dashboard/goal-progress', { signal }),

  resetGoal: () => apiClient.put<MessageDto>('/dashboard/reset-goal'),

  extendGoal: (body: ExtendGoalRequestDto) =>
    apiClient.put<MessageDto>('/dashboard/extend-goal', body),
};

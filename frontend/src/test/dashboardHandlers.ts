import { http, HttpResponse } from 'msw';
import type { DailyCaloriesDto, GoalProgressDto, TodaySummaryDto } from '@/types/api';
import { buildGoalProgress, buildTodaySummary, buildWeekly, TEST_API } from './fixtures';

interface DashboardFixture {
  today?: TodaySummaryDto;
  weekly?: DailyCaloriesDto[];
  goal?: GoalProgressDto;
}

/** GET /dashboard/today, /weekly and /goal-progress. */
export function dashboardHandlers({
  today = buildTodaySummary(),
  weekly = buildWeekly(),
  goal = buildGoalProgress(),
}: DashboardFixture = {}) {
  return [
    http.get(`${TEST_API}/dashboard/today`, () => HttpResponse.json(today)),
    http.get(`${TEST_API}/dashboard/weekly`, () => HttpResponse.json(weekly)),
    http.get(`${TEST_API}/dashboard/goal-progress`, () => HttpResponse.json(goal)),
  ];
}

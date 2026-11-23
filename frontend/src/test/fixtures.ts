import type {
  DailyCaloriesDto,
  GoalProgressDto,
  TodaySummaryDto,
  TokenResponseDto,
  UserDto,
} from '@/types/api';

export const TEST_API = import.meta.env.VITE_API_BASE_URL;

export function buildUser(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 1,
    email: 'alice@example.com',
    full_name: 'Alice',
    age: null,
    gender: null,
    height_cm: null,
    weight_kg: null,
    activity_level: null,
    goal_type: null,
    goal_weight_kg: null,
    goal_period_weeks: null,
    daily_calories_target: null,
    daily_protein_target: null,
    daily_carbs_target: null,
    daily_fat_target: null,
    food_allergies: null,
    is_profile_complete: false,
    created_at: '2026-11-23T10:00:00Z',
    updated_at: '2026-11-23T10:00:00Z',
    ...overrides,
  };
}

export function buildTokens(accessToken = 'access-1'): TokenResponseDto {
  return { access_token: accessToken, token_type: 'bearer', expires_in: 1800, refresh_token: null };
}

export function buildTodaySummary(overrides: Partial<TodaySummaryDto> = {}): TodaySummaryDto {
  return {
    calories_consumed: 1200,
    calories_target: 2000,
    protein: { consumed: 70, target: 140 },
    carbs: { consumed: 150, target: 250 },
    fat: { consumed: 40, target: 65 },
    meals: {
      breakfast: { calories: 400, target: 500 },
      lunch: { calories: 800, target: 700 },
      snack: { calories: 0, target: 200 },
      dinner: { calories: 0, target: 600 },
    },
    ...overrides,
  };
}

/** Mon 2026-11-16 … Sun 2026-11-22. */
export function buildWeekly(
  calories = [1800, 2100, 0, 1500, 2500, 1900, 1200],
): DailyCaloriesDto[] {
  return calories.map((value, index) => ({ date: `2026-11-${16 + index}`, calories: value }));
}

export function buildGoalProgress(overrides: Partial<GoalProgressDto> = {}): GoalProgressDto {
  return {
    has_active_goal: true,
    goal_type: 'lose_weight',
    start_weight: 80,
    current_weight: 75,
    target_weight: 70,
    days_remaining: 42,
    start_date: '2026-10-01',
    target_date: '2027-01-04',
    ...overrides,
  };
}

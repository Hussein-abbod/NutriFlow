import type {
  DailyCaloriesDto,
  DayLogsDto,
  FoodItemResultDto,
  FoodLogDto,
  FoodLogItemDto,
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

/** USDA rice: values per 100 g, default serving 100 g. */
export function buildFoodResult(overrides: Partial<FoodItemResultDto> = {}): FoodItemResultDto {
  return {
    fdc_id: 169757,
    food_name: 'Rice, white, long-grain, cooked',
    brand_name: null,
    serving_size: 100,
    serving_unit: 'g',
    calories: 130,
    protein: 2.7,
    carbs: 28.2,
    fat: 0.3,
    fiber: 0.4,
    sugar: 0.1,
    sodium: 1,
    ...overrides,
  };
}

export function buildLogItem(overrides: Partial<FoodLogItemDto> = {}): FoodLogItemDto {
  return {
    id: 11,
    food_name: 'Rice, white, long-grain, cooked',
    brand_name: null,
    quantity: 200,
    unit: 'g',
    calories: 260,
    protein: 5.4,
    carbs: 56.4,
    fat: 0.6,
    ...overrides,
  };
}

export function buildFoodLog(overrides: Partial<FoodLogDto> = {}): FoodLogDto {
  const items = overrides.items ?? [buildLogItem()];
  return {
    id: 7,
    meal_type: 'breakfast',
    log_date: '2026-11-24',
    log_method: 'text',
    total_calories: items.reduce((sum, item) => sum + (item.calories ?? 0), 0),
    total_protein: 5.4,
    total_carbs: 56.4,
    total_fat: 0.6,
    ai_advice: 'Great start! Add some protein at lunch.',
    ...overrides,
    items,
  };
}

/** One day of logs; totals are summed from the meals given. */
export function buildDayLogs(date: string, meals: Partial<DayLogsDto> = {}): DayLogsDto {
  const day: DayLogsDto = {
    date,
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: [],
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    ...meals,
  };
  const logs = [...day.breakfast, ...day.lunch, ...day.snack, ...day.dinner];
  return {
    ...day,
    total_calories: logs.reduce((sum, log) => sum + (log.total_calories ?? 0), 0),
    total_protein: logs.reduce((sum, log) => sum + (log.total_protein ?? 0), 0),
    total_carbs: logs.reduce((sum, log) => sum + (log.total_carbs ?? 0), 0),
    total_fat: logs.reduce((sum, log) => sum + (log.total_fat ?? 0), 0),
  };
}

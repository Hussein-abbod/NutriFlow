import type { IconName } from '@/components/Icon/icons';
import type { MealType } from '@/types/api';

export interface MealConfig {
  type: MealType;
  label: string;
  icon: IconName;
  /** Share of the daily calorie target (food_log_tab.dart `_meals[].pct`). */
  share: number;
}

export const MEALS: readonly MealConfig[] = [
  { type: 'breakfast', label: 'Breakfast', icon: 'wbSunny', share: 0.25 },
  { type: 'lunch', label: 'Lunch', icon: 'restaurant', share: 0.35 },
  { type: 'snack', label: 'Snack', icon: 'cookie', share: 0.1 },
  { type: 'dinner', label: 'Dinner', icon: 'nightlight', share: 0.3 },
];

export const MEAL_TYPES = MEALS.map((meal) => meal.type) as [MealType, ...MealType[]];

export function mealLabel(type: MealType): string {
  return MEALS.find((meal) => meal.type === type)?.label ?? type;
}

/** Fallback used by the Flutter app when the user has no calculated target. */
export const DEFAULT_DAILY_CALORIES = 2000;

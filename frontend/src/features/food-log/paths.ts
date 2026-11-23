import type { MealType } from '@/types/api';

/**
 * The tab plus the screens Flutter pushes over it (no bottom nav): the three ways to find
 * food and the confirm screen. Meal and day travel in the URL so a reload keeps them.
 */
export const foodLogPaths = {
  log: '/food-log',
  search: '/food-log/add/search',
  barcode: '/food-log/add/barcode',
  photo: '/food-log/add/photo',
  confirm: '/food-log/confirm',
} as const;

export type AddFoodPath = (typeof foodLogPaths)['search' | 'barcode' | 'photo' | 'confirm'];

export interface AddFoodTarget {
  meal: MealType;
  /** ISO day the meal is logged on. */
  date: string;
}

export function addFoodUrl(path: AddFoodPath, { meal, date }: AddFoodTarget): string {
  return `${path}?${new URLSearchParams({ meal, date }).toString()}`;
}

/** The food log on `day` (no query for today, so the tab link stays `/food-log`). */
export function foodLogUrl(day: string, today: string): string {
  return day === today ? foodLogPaths.log : `${foodLogPaths.log}?date=${day}`;
}

/**
 * Router state for "Discuss with Coach AI" (Flutter `HomeScreen.switchTab(2, coachContext)`).
 * The coach tab (session 4) reads it to start the chat about this advice.
 */
export interface CoachContextState {
  coachContext: string;
}

/** Router state set when an add-food screen is opened from the food log. */
export interface OpenedFromLogState {
  fromFoodLog: true;
}

export function isOpenedFromLog(state: unknown): state is OpenedFromLogState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'fromFoodLog' in state &&
    state.fromFoodLog === true
  );
}

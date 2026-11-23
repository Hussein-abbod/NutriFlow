/** DTOs mirroring backend/app/schemas (keep in sync with the Pydantic models). */

export type ActivityLevel =
  'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';

export type GoalType = 'gain_weight' | 'lose_weight' | 'maintain_weight';

/** backend: schemas.user.UserOut */
export interface UserDto {
  id: number;
  email: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal_type: GoalType | null;
  goal_weight_kg: number | null;
  goal_period_weeks: number | null;
  daily_calories_target: number | null;
  daily_protein_target: number | null;
  daily_carbs_target: number | null;
  daily_fat_target: number | null;
  food_allergies: string[] | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

/** backend: schemas.user.TokenResponse (refresh_token is only set for native clients) */
export interface TokenResponseDto {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  refresh_token: string | null;
}

/** backend: schemas.user.RegisterResponse */
export interface RegisterResponseDto extends TokenResponseDto {
  id: number;
  email: string;
  full_name: string | null;
  is_profile_complete: boolean;
}

/** backend: schemas.user.UserLogin */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/** backend: schemas.user.UserCreate */
export interface RegisterRequestDto {
  email: string;
  password: string;
  full_name?: string;
}

/** FastAPI validation error item (422). */
export interface ValidationErrorItemDto {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/** Every API error body: `{"detail": "..."}` or a list of validation errors. */
export interface ApiErrorBodyDto {
  detail?: string | ValidationErrorItemDto[];
}

export type Gender = 'male' | 'female';

/** backend: schemas.onboarding.ProfileData */
export interface OnboardingProfileRequestDto {
  full_name: string;
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
}

/** backend: schemas.onboarding.GoalData */
export interface OnboardingGoalRequestDto {
  goal_type: GoalType;
  target_weight_kg?: number;
  goal_period_weeks?: number;
}

/** backend: schemas.onboarding.NutritionTargets */
export interface NutritionTargetsDto {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
}

/** backend: schemas.onboarding.GoalResponse */
export interface OnboardingGoalResponseDto {
  is_feasible: boolean;
  message: string;
  suggested_weeks: number | null;
  targets: NutritionTargetsDto | null;
}

/** backend: schemas.onboarding.AllergiesData */
export interface OnboardingAllergiesRequestDto {
  food_allergies: string[];
}

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/** backend: schemas.dashboard.MacroSummary */
export interface MacroSummaryDto {
  consumed: number;
  target: number;
}

/** backend: schemas.dashboard.MealSummary */
export interface MealSummaryDto {
  calories: number;
  target: number;
}

/** backend: schemas.dashboard.TodaySummaryOut */
export interface TodaySummaryDto {
  calories_consumed: number;
  calories_target: number;
  protein: MacroSummaryDto;
  carbs: MacroSummaryDto;
  fat: MacroSummaryDto;
  meals: Partial<Record<MealType, MealSummaryDto>>;
}

/** backend: schemas.dashboard.DailyCalories (`date` is an ISO day, e.g. "2026-11-23") */
export interface DailyCaloriesDto {
  date: string;
  calories: number;
}

/** backend: schemas.dashboard.GoalProgressOut */
export interface GoalProgressDto {
  has_active_goal: boolean;
  goal_type: GoalType | '';
  start_weight: number;
  current_weight: number;
  target_weight: number;
  days_remaining: number;
  start_date: string | null;
  target_date: string | null;
}

/** backend: schemas.dashboard.ExtendGoalRequest */
export interface ExtendGoalRequestDto {
  extra_weeks: number;
}

/** backend: schemas.dashboard.MessageOut */
export interface MessageDto {
  message: string;
}

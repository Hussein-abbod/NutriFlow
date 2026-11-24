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

export type LogMethod = 'text' | 'barcode' | 'image';

/** backend: schemas.food_log.TextRequest */
export interface TextSearchRequestDto {
  query: string;
  meal_type: MealType;
  use_ai_parse: boolean;
}

/** backend: schemas.food_log.BarcodeRequest */
export interface BarcodeRequestDto {
  barcode: string;
}

/** backend: schemas.food_log.ImageRequest (base64 without the `data:` prefix) */
export interface ImageRequestDto {
  image_base64: string;
  meal_type: MealType;
}

/** backend: schemas.food_log.FoodItemResult — nutrients are per 100 g. */
export interface FoodItemResultDto {
  fdc_id: number | null;
  food_name: string;
  brand_name: string | null;
  serving_size: number | null;
  serving_unit: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

/** backend: schemas.food_log.FoodItemSubmit — nutrients for the whole portion. */
export interface FoodItemSubmitDto {
  food_name: string;
  brand_name: string | null;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  nutritionix_food_id?: string;
}

/** backend: schemas.food_log.FoodSubmitRequest (`log_date` is an ISO day) */
export interface FoodSubmitRequestDto {
  meal_type: MealType;
  log_method: LogMethod;
  log_date: string;
  items: FoodItemSubmitDto[];
}

/** backend: schemas.food_log.FoodLogItemOut */
export interface FoodLogItemDto {
  id: number;
  food_name: string;
  brand_name: string | null;
  quantity: number | null;
  unit: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

/** backend: schemas.food_log.FoodLogOut */
export interface FoodLogDto {
  id: number;
  meal_type: MealType;
  log_date: string;
  log_method: LogMethod;
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  ai_advice: string | null;
  items: FoodLogItemDto[];
}

/** backend: schemas.food_log.TodayLogsOut (one day, grouped by meal) */
export interface DayLogsDto {
  date: string;
  breakfast: FoodLogDto[];
  lunch: FoodLogDto[];
  snack: FoodLogDto[];
  dinner: FoodLogDto[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

/** backend: schemas.dashboard.MessageOut */
export interface MessageDto {
  message: string;
}

/** backend: schemas.user.ProfileUpdateRequest (PUT /users/profile, partial) */
export interface ProfileUpdateRequestDto {
  full_name?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
}

/** backend: schemas.user.PasswordChangeRequest */
export interface PasswordChangeRequestDto {
  current_password: string;
  new_password: string;
}

/** backend: schemas.user.PasswordChangeOut — other sessions end; this one gets new tokens. */
export interface PasswordChangeResponseDto extends TokenResponseDto {
  message: string;
}

/** backend: schemas.user.AllergiesOut */
export interface AllergiesResponseDto {
  message: string;
  allergies: string[];
}

export type CoachRole = 'user' | 'assistant';

/** backend: schemas.coach.CoachMessageOut */
export interface CoachMessageDto {
  id: number;
  role: CoachRole;
  content: string;
  created_at: string;
}

/** backend: schemas.coach.CoachMessageRequest — a message, or a logged meal to discuss. */
export type CoachMessageRequestDto = { message: string } | { food_log_id: number };

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

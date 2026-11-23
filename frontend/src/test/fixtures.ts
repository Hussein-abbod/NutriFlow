import type { TokenResponseDto, UserDto } from '@/types/api';

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

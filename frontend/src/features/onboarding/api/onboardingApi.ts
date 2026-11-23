import { apiClient } from '@/lib/api';
import type {
  OnboardingAllergiesRequestDto,
  OnboardingGoalRequestDto,
  OnboardingGoalResponseDto,
  OnboardingProfileRequestDto,
  UserDto,
} from '@/types/api';

/** services/onboarding_service.dart */
export const onboardingApi = {
  saveProfile: (body: OnboardingProfileRequestDto) =>
    apiClient.post<UserDto>('/onboarding/profile', body),

  saveGoal: (body: OnboardingGoalRequestDto) =>
    apiClient.post<OnboardingGoalResponseDto>('/onboarding/goal', body),

  saveAllergies: (body: OnboardingAllergiesRequestDto) =>
    apiClient.post<UserDto>('/onboarding/allergies', body),

  complete: () => apiClient.post<UserDto>('/onboarding/complete'),
};

import { apiClient } from '@/lib/api';
import type {
  AllergiesResponseDto,
  PasswordChangeRequestDto,
  PasswordChangeResponseDto,
  ProfileUpdateRequestDto,
  UserDto,
} from '@/types/api';

/** AuthProvider.updateProfile / updateAllergies and the password change (users router). */
export const profileApi = {
  updateProfile: (body: ProfileUpdateRequestDto) => apiClient.put<UserDto>('/users/profile', body),

  changePassword: (body: PasswordChangeRequestDto) =>
    apiClient.put<PasswordChangeResponseDto>('/users/password', body),

  updateAllergies: (allergies: string[]) =>
    apiClient.put<AllergiesResponseDto>('/users/allergies', { allergies }),
};

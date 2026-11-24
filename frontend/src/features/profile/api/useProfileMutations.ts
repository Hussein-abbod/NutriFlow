import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authKeys, useSetCurrentUser } from '@/features/auth';
// Only the query keys: the dashboard feature's index would pull its lazy chart bundle in.
import { dashboardKeys } from '@/features/dashboard/api/queryKeys';
import { tokenStore } from '@/lib/api';
import type { PasswordChangeRequestDto, ProfileUpdateRequestDto, UserDto } from '@/types/api';
import { profileApi } from './profileApi';

/** PUT /users/profile. New body metrics change the daily targets, so the dashboard reloads. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setCurrentUser = useSetCurrentUser();
  return useMutation({
    mutationFn: (body: ProfileUpdateRequestDto) => profileApi.updateProfile(body),
    onSuccess: async (user) => {
      setCurrentUser(user);
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * PUT /users/password. Every other session ends; this one continues with the new access
 * token from the response (the new refresh cookie is set by the server).
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (body: PasswordChangeRequestDto) => profileApi.changePassword(body),
    onSuccess: (tokens) => tokenStore.setAccessToken(tokens.access_token),
  });
}

/** PUT /users/allergies: the saved list goes straight into the cached user. */
export function useUpdateAllergies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (allergies: string[]) => profileApi.updateAllergies(allergies),
    onSuccess: ({ allergies }) =>
      queryClient.setQueryData<UserDto>(authKeys.currentUser(), (user) =>
        user ? { ...user, food_allergies: allergies } : user,
      ),
  });
}

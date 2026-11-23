import { useMutation } from '@tanstack/react-query';
import { useSetCurrentUser } from '@/features/auth';
import type { UserDto } from '@/types/api';
import { useOnboardingStore } from '../store/onboardingStore';
import { onboardingApi } from './onboardingApi';

/** Every onboarding mutation shares this key prefix so the screen can show one busy state. */
export const onboardingMutationKey = ['onboarding'] as const;

export function useSaveProfile() {
  const setCurrentUser = useSetCurrentUser();
  return useMutation({
    mutationKey: [...onboardingMutationKey, 'profile'],
    mutationFn: onboardingApi.saveProfile,
    onSuccess: setCurrentUser,
  });
}

/** Resolves with the backend verdict; an unsafe goal is `is_feasible: false`, not an error. */
export function useSaveGoal() {
  return useMutation({
    mutationKey: [...onboardingMutationKey, 'goal'],
    mutationFn: onboardingApi.saveGoal,
  });
}

export function useSaveAllergies() {
  const setCurrentUser = useSetCurrentUser();
  return useMutation({
    mutationKey: [...onboardingMutationKey, 'allergies'],
    mutationFn: onboardingApi.saveAllergies,
    onSuccess: setCurrentUser,
  });
}

/** The updated user has `is_profile_complete: true`, so the route guard moves on to the app. */
export function useCompleteOnboarding() {
  const setCurrentUser = useSetCurrentUser();
  return useMutation({
    mutationKey: [...onboardingMutationKey, 'complete'],
    mutationFn: () => onboardingApi.complete(),
    onSuccess: (user: UserDto) => {
      // User first: the route guard leaves onboarding in the same render that marks it done.
      setCurrentUser(user);
      useOnboardingStore.getState().markCompleted();
    },
  });
}

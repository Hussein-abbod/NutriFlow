import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserDto } from '@/types/api';
import { useSessionStore } from '../store/sessionStore';
import { authApi } from './authApi';
import { authKeys } from './queryKeys';

/** The signed-in user (`/auth/me`). Disabled until a session exists. */
export function useCurrentUser() {
  const status = useSessionStore((state) => state.status);
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: ({ signal }) => authApi.fetchCurrentUser(signal),
    enabled: status === 'authenticated',
    staleTime: 60_000,
  });
}

/** Replace the cached `/auth/me` user with a fresh copy returned by another endpoint. */
export function useSetCurrentUser() {
  const queryClient = useQueryClient();
  return (user: UserDto) => queryClient.setQueryData(authKeys.currentUser(), user);
}

/** Re-fetch `/auth/me` (e.g. after a change that moves the user to another part of the app). */
export function useRefreshCurrentUser() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
}

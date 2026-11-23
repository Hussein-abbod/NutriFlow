import { useQuery } from '@tanstack/react-query';
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

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStore } from '@/lib/api';
import type { LoginRequestDto, RegisterRequestDto, UserDto } from '@/types/api';
import { useSessionStore } from '../store/sessionStore';
import { authApi } from './authApi';
import { authKeys } from './queryKeys';

/** Store the access token in memory, then load the profile that decides where to go next. */
async function startSession(accessToken: string): Promise<UserDto> {
  tokenStore.setAccessToken(accessToken);
  try {
    return await authApi.fetchCurrentUser();
  } catch (error) {
    tokenStore.clear();
    throw error;
  }
}

function useSessionStarted() {
  const queryClient = useQueryClient();
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);
  return (user: UserDto) => {
    queryClient.setQueryData(authKeys.currentUser(), user);
    setAuthenticated();
  };
}

export function useLogin() {
  const onSessionStarted = useSessionStarted();
  return useMutation({
    mutationFn: async (credentials: LoginRequestDto) => {
      const tokens = await authApi.login(credentials);
      return startSession(tokens.access_token);
    },
    onSuccess: onSessionStarted,
  });
}

export function useRegister() {
  const onSessionStarted = useSessionStarted();
  return useMutation({
    mutationFn: async (payload: RegisterRequestDto) => {
      const response = await authApi.register(payload);
      return startSession(response.access_token);
    },
    onSuccess: onSessionStarted,
  });
}

/** Revoke tokens server-side (best effort) and always clear the local session. */
export function useLogout() {
  const queryClient = useQueryClient();
  const setAnonymous = useSessionStore((state) => state.setAnonymous);
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // Like the Flutter app: a failed logout call must not keep the user signed in.
      }
    },
    onSettled: () => {
      tokenStore.clear();
      queryClient.clear();
      setAnonymous();
    },
  });
}

import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError, tokenStore } from '@/lib/api';
import { authApi } from '../api/authApi';
import { authKeys } from '../api/queryKeys';
import { useSessionStore } from '../store/sessionStore';

/** splash_screen.dart waits 2.5 s before routing. */
export const SPLASH_MIN_DURATION_MS = 2500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type RestoreOutcome = 'restored' | 'signed-out' | 'unreachable';

/** Network errors, timeouts, 429 and 5xx: the server could not answer the question. */
const isUnreachable = (error: unknown) =>
  error instanceof ApiError && (error.status === 0 || error.status === 429 || error.status >= 500);

/**
 * Try the refresh cookie; on success load the user. A rejected cookie means "not signed
 * in"; when the server cannot be reached the answer is unknown (`unreachable`).
 */
export async function restoreSession(queryClient: QueryClient): Promise<RestoreOutcome> {
  const outcome = await authApi.refreshSession();
  if (outcome === 'unavailable') return 'unreachable';
  if (outcome === 'expired') return 'signed-out';
  try {
    await queryClient.fetchQuery({
      queryKey: authKeys.currentUser(),
      queryFn: ({ signal }) => authApi.fetchCurrentUser(signal),
    });
    return 'restored';
  } catch (error) {
    tokenStore.clear();
    return isUnreachable(error) ? 'unreachable' : 'signed-out';
  }
}

/**
 * Runs once while the session status is `unknown` (fresh page load): restores the session
 * and keeps the splash visible for at least `minDurationMs`, like the Flutter app.
 */
export function useSessionBootstrap(minDurationMs = SPLASH_MIN_DURATION_MS) {
  const queryClient = useQueryClient();
  const status = useSessionStore((state) => state.status);
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);
  const setAnonymous = useSessionStore((state) => state.setAnonymous);
  const setUnreachable = useSessionStore((state) => state.setUnreachable);

  useEffect(() => {
    if (status !== 'unknown') return;
    let cancelled = false;
    // Concurrent calls (React StrictMode) share the client's single in-flight refresh.
    Promise.all([restoreSession(queryClient), wait(minDurationMs)]).then(([outcome]) => {
      if (cancelled) return;
      if (outcome === 'restored') setAuthenticated();
      else if (outcome === 'unreachable') setUnreachable();
      else setAnonymous();
    });
    return () => {
      cancelled = true;
    };
  }, [status, queryClient, minDurationMs, setAuthenticated, setAnonymous, setUnreachable]);
}

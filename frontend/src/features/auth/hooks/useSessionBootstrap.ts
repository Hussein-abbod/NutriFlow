import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { tokenStore } from '@/lib/api';
import { authApi } from '../api/authApi';
import { authKeys } from '../api/queryKeys';
import { useSessionStore } from '../store/sessionStore';

/** splash_screen.dart waits 2.5 s before routing. */
export const SPLASH_MIN_DURATION_MS = 2500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Try the refresh cookie; on success load the user. Any failure means "not signed in". */
export async function restoreSession(queryClient: QueryClient): Promise<boolean> {
  const outcome = await authApi.refreshSession();
  if (outcome !== 'refreshed') return false;
  try {
    await queryClient.fetchQuery({
      queryKey: authKeys.currentUser(),
      queryFn: ({ signal }) => authApi.fetchCurrentUser(signal),
    });
    return true;
  } catch {
    tokenStore.clear();
    return false;
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

  useEffect(() => {
    if (status !== 'unknown') return;
    let cancelled = false;
    // Concurrent calls (React StrictMode) share the client's single in-flight refresh.
    Promise.all([restoreSession(queryClient), wait(minDurationMs)]).then(([restored]) => {
      if (cancelled) return;
      if (restored) setAuthenticated();
      else setAnonymous();
    });
    return () => {
      cancelled = true;
    };
  }, [status, queryClient, minDurationMs, setAuthenticated, setAnonymous]);
}

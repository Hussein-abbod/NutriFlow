import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { showSnackbar } from '@/components';
import { tokenStore } from '@/lib/api';
import { useSessionStore } from '../store/sessionStore';

/** When the API client cannot refresh, drop all cached data and send the user to login. */
export function useSessionExpiryHandler() {
  const queryClient = useQueryClient();
  const setAnonymous = useSessionStore((state) => state.setAnonymous);

  useEffect(
    () =>
      tokenStore.onSessionExpired(() => {
        const wasSignedIn = useSessionStore.getState().status === 'authenticated';
        queryClient.clear();
        setAnonymous();
        if (wasSignedIn) showSnackbar('Your session has expired. Please log in again.');
      }),
    [queryClient, setAnonymous],
  );
}

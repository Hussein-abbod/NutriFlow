import { useEffect } from 'react';
import { useSessionStore } from '@/features/auth';
import { resetNotificationSettings } from '@/lib/notifications';

/** Logout and session expiry: reminders belong to the person who turned them on. */
export function useSignOutCleanup() {
  useEffect(
    () =>
      useSessionStore.subscribe((session, previous) => {
        if (previous.status === 'authenticated' && session.status === 'anonymous') {
          resetNotificationSettings();
        }
      }),
    [],
  );
}

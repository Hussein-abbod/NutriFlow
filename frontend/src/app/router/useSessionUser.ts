import { useCurrentUser, useSessionStore } from '@/features/auth';

/** Session status plus the signed-in user, with loading/error flags for guards. */
export function useSessionUser() {
  const status = useSessionStore((state) => state.status);
  const userQuery = useCurrentUser();
  const awaitingUser = status === 'authenticated' && !userQuery.data;
  return {
    status,
    user: userQuery.data,
    isLoadingUser: awaitingUser && !userQuery.isError,
    userError: awaitingUser && userQuery.isError ? userQuery.error.message : undefined,
    retry: () => void userQuery.refetch(),
  };
}

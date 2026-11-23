import { Navigate } from 'react-router';
import { homePathFor, paths } from '@/features/auth';
import { FullScreenStatus } from '../layout/FullScreenStatus';
import { useSessionUser } from './useSessionUser';

/** `/` sends everyone to where they belong. */
export function RootRedirect() {
  const { status, user, userError, retry } = useSessionUser();
  if (status === 'anonymous') return <Navigate to={paths.login} replace />;
  if (userError) return <FullScreenStatus error={userError} onRetry={retry} />;
  if (!user) return <FullScreenStatus />;
  return <Navigate to={homePathFor(user)} replace />;
}

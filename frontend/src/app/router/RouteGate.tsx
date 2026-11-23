import { Navigate, Outlet } from 'react-router';
import { resolveRedirect, type RouteAudience } from '@/features/auth';
import { FullScreenStatus } from '../layout/FullScreenStatus';
import { useSessionUser } from './useSessionUser';

/**
 * Route guard: guests → login/register, signed-in without onboarding → onboarding,
 * onboarded → app. Anything else is redirected.
 */
export function RouteGate({ audience }: { audience: RouteAudience }) {
  const { status, user, isLoadingUser, userError, retry } = useSessionUser();
  if (status === 'unknown') return null;
  if (userError) return <FullScreenStatus error={userError} onRetry={retry} />;
  if (isLoadingUser) return <FullScreenStatus />;

  const redirectTo = resolveRedirect(audience, status, user);
  return redirectTo ? <Navigate to={redirectTo} replace /> : <Outlet />;
}

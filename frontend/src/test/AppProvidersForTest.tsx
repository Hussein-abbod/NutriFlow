import { Outlet } from 'react-router';
import { useSignOutCleanup } from '@/app/providers/useSignOutCleanup';
import { useSessionExpiryHandler } from '@/features/auth';

/** Mirrors the listeners mounted by AppProviders (the QueryClient comes from renderRoutes). */
export function AppProvidersForTest() {
  useSessionExpiryHandler();
  useSignOutCleanup();
  return <Outlet />;
}

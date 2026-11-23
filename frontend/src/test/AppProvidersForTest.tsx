import { Outlet } from 'react-router';
import { useSessionExpiryHandler } from '@/features/auth';

/** Mirrors the listeners mounted by AppProviders (the QueryClient comes from renderRoutes). */
export function AppProvidersForTest() {
  useSessionExpiryHandler();
  return <Outlet />;
}

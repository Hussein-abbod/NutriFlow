import { Outlet } from 'react-router';
import { SplashPage, useSessionStore } from '@/features/auth';
import { ConnectionBanner } from '../layout/ConnectionBanner';
import { OfflineScreen } from '../layout/OfflineScreen';
import { PageTransition } from '../layout/PageTransition';

export interface RootLayoutProps {
  splashMinDurationMs?: number;
}

/**
 * Shows the splash until the session is known (or the offline screen when the server could
 * not be reached), then the routed page with a transition.
 */
export function RootLayout({ splashMinDurationMs }: RootLayoutProps) {
  const status = useSessionStore((state) => state.status);
  if (status === 'unknown') return <SplashPage minDurationMs={splashMinDurationMs} />;
  if (status === 'unreachable') return <OfflineScreen />;
  return (
    <>
      <ConnectionBanner />
      <PageTransition>
        <Outlet />
      </PageTransition>
    </>
  );
}

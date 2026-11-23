import { Outlet } from 'react-router';
import { SplashPage, useSessionStore } from '@/features/auth';
import { PageTransition } from '../layout/PageTransition';

export interface RootLayoutProps {
  splashMinDurationMs?: number;
}

/** Shows the splash until the session is known, then the routed page with a transition. */
export function RootLayout({ splashMinDurationMs }: RootLayoutProps) {
  const status = useSessionStore((state) => state.status);
  if (status === 'unknown') return <SplashPage minDurationMs={splashMinDurationMs} />;
  return (
    <PageTransition>
      <Outlet />
    </PageTransition>
  );
}

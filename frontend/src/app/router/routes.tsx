import { Navigate, type RouteObject } from 'react-router';
import { LoginPage, paths, RegisterPage } from '@/features/auth';
import { OnboardingPage } from '@/features/onboarding';
import { AppShell } from '../layout/AppShell';
import { CoachPlaceholderPage } from '../placeholders/CoachPlaceholderPage';
import { FoodLogPlaceholderPage } from '../placeholders/FoodLogPlaceholderPage';
import { ProfilePlaceholderPage } from '../placeholders/ProfilePlaceholderPage';
import { RootLayout } from './RootLayout';
import { RootRedirect } from './RootRedirect';
import { RouteGate } from './RouteGate';
import { DEFAULT_TAB_PATH, tabPaths } from './tabs';

export interface AppRouteOptions {
  splashMinDurationMs?: number;
}

export function createAppRoutes({ splashMinDurationMs }: AppRouteOptions = {}): RouteObject[] {
  return [
    {
      element: <RootLayout splashMinDurationMs={splashMinDurationMs} />,
      children: [
        { index: true, element: <RootRedirect /> },
        {
          element: <RouteGate audience="guest" />,
          children: [
            { path: paths.login, element: <LoginPage /> },
            { path: paths.register, element: <RegisterPage /> },
          ],
        },
        {
          element: <RouteGate audience="onboarding" />,
          children: [{ path: paths.onboarding, element: <OnboardingPage /> }],
        },
        {
          element: <RouteGate audience="app" />,
          children: [
            { path: paths.home, element: <Navigate to={DEFAULT_TAB_PATH} replace /> },
            {
              element: <AppShell />,
              children: [
                { path: tabPaths.foodLog, element: <FoodLogPlaceholderPage /> },
                {
                  path: tabPaths.dashboard,
                  // Lazy: keeps Recharts out of the bundle for login and onboarding.
                  lazy: async () => ({
                    Component: (await import('@/features/dashboard')).DashboardPage,
                  }),
                },
                { path: tabPaths.coach, element: <CoachPlaceholderPage /> },
                { path: tabPaths.profile, element: <ProfilePlaceholderPage /> },
              ],
            },
          ],
        },
        { path: '*', element: <Navigate to={paths.root} replace /> },
      ],
    },
  ];
}

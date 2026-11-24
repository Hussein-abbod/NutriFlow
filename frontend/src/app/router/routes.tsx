import { Navigate, type RouteObject } from 'react-router';
import { LoginPage, paths, RegisterPage } from '@/features/auth';
import { CoachPage } from '@/features/coach';
import { FoodLogPage, foodLogPaths } from '@/features/food-log';
import { OnboardingPage } from '@/features/onboarding';
import { ProfilePage } from '@/features/profile';
import { AppShell } from '../layout/AppShell';
import { RootLayout } from './RootLayout';
import { RootRedirect } from './RootRedirect';
import { RouteGate } from './RouteGate';
import { DEFAULT_TAB_PATH, tabPaths } from './tabs';

const addFoodScreens = () => import('@/features/food-log/addFoodScreens');

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
                { path: tabPaths.foodLog, element: <FoodLogPage /> },
                {
                  path: tabPaths.dashboard,
                  // Lazy: keeps Recharts out of the bundle for login and onboarding.
                  lazy: async () => ({
                    Component: (await import('@/features/dashboard')).DashboardPage,
                  }),
                },
                { path: tabPaths.coach, element: <CoachPage /> },
                { path: tabPaths.profile, element: <ProfilePage /> },
              ],
            },
            // Screens Flutter pushes over the tabs (full screen, no bottom nav), lazy-loaded.
            {
              path: foodLogPaths.search,
              lazy: async () => ({ Component: (await addFoodScreens()).TextSearchPage }),
            },
            {
              path: foodLogPaths.barcode,
              lazy: async () => ({ Component: (await addFoodScreens()).BarcodeScanPage }),
            },
            {
              path: foodLogPaths.photo,
              lazy: async () => ({ Component: (await addFoodScreens()).PhotoLogPage }),
            },
            {
              path: foodLogPaths.confirm,
              lazy: async () => ({ Component: (await addFoodScreens()).FoodConfirmPage }),
            },
          ],
        },
        { path: '*', element: <Navigate to={paths.root} replace /> },
      ],
    },
  ];
}

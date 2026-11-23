import { Navigate, type RouteObject } from 'react-router';
import { LoginPage, paths, RegisterPage } from '@/features/auth';
import { HomePlaceholderPage } from '../placeholders/HomePlaceholderPage';
import { OnboardingPlaceholderPage } from '../placeholders/OnboardingPlaceholderPage';
import { RootLayout } from './RootLayout';
import { RootRedirect } from './RootRedirect';
import { RouteGate } from './RouteGate';

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
          children: [{ path: paths.onboarding, element: <OnboardingPlaceholderPage /> }],
        },
        {
          element: <RouteGate audience="app" />,
          children: [{ path: paths.home, element: <HomePlaceholderPage /> }],
        },
        { path: '*', element: <Navigate to={paths.root} replace /> },
      ],
    },
  ];
}

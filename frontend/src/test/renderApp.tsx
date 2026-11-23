import { createAppRoutes } from '@/app/router/routes';
import { renderRoutes } from './renderWithProviders';
import { AppProvidersForTest } from './AppProvidersForTest';

/** Render the real route tree (guards included) starting at `path`, splash delay disabled. */
export function renderApp(path: string) {
  return renderRoutes({
    routes: [
      { element: <AppProvidersForTest />, children: createAppRoutes({ splashMinDurationMs: 0 }) },
    ],
    initialPath: path,
  });
}

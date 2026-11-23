import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { SnackbarHost } from '@/components';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

interface RenderRouteOptions {
  routes: RouteObject[];
  initialPath?: string;
  queryClient?: QueryClient;
}

/** Render routes inside a memory router + fresh QueryClient + snackbar host. */
export function renderRoutes({
  routes,
  initialPath = '/',
  queryClient = createTestQueryClient(),
}: RenderRouteOptions) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <SnackbarHost />
    </QueryClientProvider>,
  );
  return { ...view, router, queryClient };
}

export function renderWithQuery(ui: ReactElement, queryClient = createTestQueryClient()) {
  return {
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
    queryClient,
  };
}

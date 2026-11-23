import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppProviders } from './providers/AppProviders';
import { createQueryClient } from './providers/queryClient';
import { createAppRoutes } from './router/routes';

const queryClient = createQueryClient();
const router = createBrowserRouter(createAppRoutes());

export function App() {
  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

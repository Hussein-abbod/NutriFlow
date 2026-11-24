import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SnackbarHost } from '@/components';
import { useSessionExpiryHandler } from '@/features/auth';
import { UpdateToast } from '../layout/UpdateToast';

function SessionExpiryListener() {
  useSessionExpiryHandler();
  return null;
}

export function AppProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionExpiryListener />
      {children}
      <UpdateToast />
      <SnackbarHost />
    </QueryClientProvider>
  );
}

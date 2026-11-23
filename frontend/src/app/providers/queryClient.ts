import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';

const MAX_RETRIES = 2;

/** Retry only transient failures (network / 5xx), never 4xx. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (error instanceof ApiError) return error.status === 0 || error.status >= 500;
  return false;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
}

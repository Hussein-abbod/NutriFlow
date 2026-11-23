import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api';
import { shouldRetry } from './queryClient';

describe('shouldRetry', () => {
  it('retries network and server errors up to twice', () => {
    expect(shouldRetry(0, ApiError.network())).toBe(true);
    expect(shouldRetry(1, new ApiError('x', { status: 503, kind: 'http' }))).toBe(true);
    expect(shouldRetry(2, ApiError.network())).toBe(false);
  });

  it('never retries client errors or unknown errors', () => {
    expect(shouldRetry(0, new ApiError('x', { status: 401, kind: 'http' }))).toBe(false);
    expect(shouldRetry(0, new Error('boom'))).toBe(false);
  });
});

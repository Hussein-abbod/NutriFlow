import { createApiClient } from './client';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { platform } from '@/lib/platform';

export { ApiError } from './ApiError';
export { getErrorMessage, UNKNOWN_ERROR_MESSAGE } from './errorMessage';
export type { ApiErrorKind } from './ApiError';
export { tokenStore } from './tokenStore';
export type { ApiClient, RefreshOutcome, RequestOptions } from './client';

/** The app-wide API client. Feature `api/` modules call this; components never fetch directly. */
export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  timeoutMs: REQUEST_TIMEOUT_MS,
  headers: platform.apiHeaders,
});

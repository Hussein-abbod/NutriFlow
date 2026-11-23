import { ApiError } from './ApiError';
import { tokenStore } from './tokenStore';
import type { TokenResponseDto } from '@/types/api';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Send the bearer token and, on 401, refresh once and retry. Defaults to true. */
  authenticated?: boolean;
  signal?: AbortSignal;
  /** Overrides the client timeout (e.g. for slow AI endpoints). */
  timeoutMs?: number;
}

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs: number;
  headers?: Readonly<Record<string, string>>;
  fetchFn?: typeof fetch;
}

/**
 * Result of a refresh attempt.
 * - `expired`: the server rejected the refresh token (401/403), so the session is over.
 * - `unavailable`: network error, timeout, 429 or 5xx; the session state is unknown, keep it.
 */
export type RefreshOutcome = 'refreshed' | 'expired' | 'unavailable';

const REFRESH_PATH = '/auth/refresh';
const REFRESH_LOCK = 'nutriflow-token-refresh';
const TIMEOUT_REASON = 'nutriflow-request-timeout';

/**
 * Refresh tokens rotate, so two tabs refreshing at once would race with the same cookie.
 * The Web Locks API serialises refreshes across tabs; the second tab then sends the
 * already-rotated cookie. Falls back to no lock where unsupported (e.g. tests).
 */
function withCrossTabLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  return locks ? locks.request(REFRESH_LOCK, task) : task();
}

export function createApiClient(config: ApiClientConfig) {
  const fetchFn = config.fetchFn ?? ((input, init) => fetch(input, init));
  let refreshInFlight: Promise<RefreshOutcome> | null = null;

  async function send(path: string, options: RequestOptions, token: string | null) {
    const headers: Record<string, string> = { Accept: 'application/json', ...config.headers };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(TIMEOUT_REASON),
      options.timeoutMs ?? config.timeoutMs,
    );
    const forwardAbort = () => controller.abort(options.signal?.reason);
    if (options.signal?.aborted) forwardAbort();
    else options.signal?.addEventListener('abort', forwardAbort, { once: true });

    try {
      return await fetchFn(`${config.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        // Needed so the browser stores/sends the httpOnly refresh cookie cross-origin.
        credentials: 'include',
        signal: controller.signal,
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      if (controller.signal.reason === TIMEOUT_REASON) throw ApiError.timeout();
      throw ApiError.network();
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', forwardAbort);
    }
  }

  async function readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw ApiError.invalidResponse(response.status);
    }
  }

  async function toResult<T>(response: Response): Promise<T> {
    if (response.ok) {
      return (await readJson(response)) as T;
    }
    let body: unknown;
    try {
      body = await readJson(response);
    } catch {
      body = undefined;
    }
    throw ApiError.fromResponseBody(response.status, body);
  }

  async function performRefresh(): Promise<RefreshOutcome> {
    let response: Response;
    try {
      response = await send(REFRESH_PATH, { method: 'POST' }, null);
    } catch {
      return 'unavailable';
    }
    if (response.status === 401 || response.status === 403) return 'expired';
    if (!response.ok) return 'unavailable';
    try {
      const body = (await readJson(response)) as Partial<TokenResponseDto> | undefined;
      if (!body?.access_token) return 'expired';
      tokenStore.setAccessToken(body.access_token);
      return 'refreshed';
    } catch {
      return 'expired';
    }
  }

  /** Exchange the refresh cookie for a new access token. Concurrent callers share one call. */
  function refreshSession(): Promise<RefreshOutcome> {
    refreshInFlight ??= withCrossTabLock(performRefresh).finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const authenticated = options.authenticated ?? true;
    const response = await send(path, options, authenticated ? tokenStore.getAccessToken() : null);
    if (response.status !== 401 || !authenticated) {
      return toResult<T>(response);
    }

    const outcome = await refreshSession();
    if (outcome === 'unavailable') throw ApiError.unavailable();
    if (outcome === 'expired') {
      tokenStore.notifySessionExpired();
      return toResult<T>(response);
    }

    const retried = await send(path, options, tokenStore.getAccessToken());
    if (retried.status === 401) tokenStore.notifySessionExpired();
    return toResult<T>(retried);
  }

  return {
    request,
    refreshSession,
    get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...options, method: 'POST', body }),
    put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...options, method: 'PUT', body }),
    delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...options, method: 'DELETE' }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

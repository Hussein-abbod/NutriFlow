import { http, HttpResponse, delay } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/server';
import { ApiError } from './ApiError';
import { createApiClient } from './client';
import { tokenStore } from './tokenStore';

const BASE = 'http://client.test';

function makeClient(timeoutMs = 5_000) {
  return createApiClient({ baseUrl: BASE, timeoutMs, headers: { 'X-Test': '1' } });
}

function refreshReturns(token: string, counter?: { calls: number }) {
  return http.post(`${BASE}/auth/refresh`, async () => {
    if (counter) counter.calls += 1;
    await delay(20);
    return HttpResponse.json({ access_token: token, token_type: 'bearer', expires_in: 1800 });
  });
}

/** Protected endpoint that only accepts `validToken`. */
function protectedEndpoint(validToken: string) {
  return http.get(`${BASE}/auth/me`, ({ request }) =>
    request.headers.get('Authorization') === `Bearer ${validToken}`
      ? HttpResponse.json({ id: 1 })
      : HttpResponse.json({ detail: 'Could not validate credentials' }, { status: 401 }),
  );
}

describe('createApiClient', () => {
  afterEach(() => tokenStore.clear());

  it('sends JSON, the bearer token, custom headers and includes credentials', async () => {
    tokenStore.setAccessToken('abc');
    let captured: Request | undefined;
    server.use(
      http.post(`${BASE}/items`, async ({ request }) => {
        captured = request.clone();
        return HttpResponse.json({ ok: true }, { status: 201 });
      }),
    );

    const result = await makeClient().post<{ ok: boolean }>('/items', { name: 'Rice' });

    expect(result).toEqual({ ok: true });
    expect(captured?.headers.get('Authorization')).toBe('Bearer abc');
    expect(captured?.headers.get('Content-Type')).toBe('application/json');
    expect(captured?.headers.get('X-Test')).toBe('1');
    expect(captured?.credentials).toBe('include');
    expect(await captured?.json()).toEqual({ name: 'Rice' });
  });

  it('omits the token for unauthenticated requests and returns undefined for 204', async () => {
    tokenStore.setAccessToken('abc');
    let authorization: string | null = 'unset';
    server.use(
      http.post(`${BASE}/auth/logout`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(
      makeClient().post('/auth/logout', undefined, { authenticated: false }),
    ).resolves.toBeUndefined();
    expect(authorization).toBeNull();
  });

  it('maps a FastAPI string detail to ApiError', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({ detail: 'Invalid email or password.' }, { status: 401 }),
      ),
    );
    const error = await makeClient()
      .post('/auth/login', {}, { authenticated: false })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 401,
      kind: 'http',
      message: 'Invalid email or password.',
    });
  });

  it('maps 422 validation errors to field errors', async () => {
    server.use(
      http.post(`${BASE}/auth/register`, () =>
        HttpResponse.json(
          {
            detail: [
              {
                loc: ['body', 'password'],
                msg: 'String should have at least 8 characters',
                type: 'x',
              },
              { loc: ['body', 'email'], msg: 'value is not a valid email address', type: 'y' },
            ],
          },
          { status: 422 },
        ),
      ),
    );
    const error = (await makeClient()
      .post('/auth/register', {}, { authenticated: false })
      .catch((caught: unknown) => caught)) as ApiError;
    expect(error.status).toBe(422);
    expect(error.message).toBe('String should have at least 8 characters');
    expect(error.fieldErrors).toEqual({
      password: 'String should have at least 8 characters',
      email: 'value is not a valid email address',
    });
  });

  it('uses a generic message for non-JSON error bodies', async () => {
    server.use(
      http.get(`${BASE}/boom`, () => new HttpResponse('<html>500</html>', { status: 500 })),
    );
    await expect(makeClient().get('/boom')).rejects.toMatchObject({
      status: 500,
      message: 'Something went wrong. Please try again.',
    });
  });

  it('rejects invalid JSON in a success response', async () => {
    server.use(http.get(`${BASE}/bad`, () => new HttpResponse('{not json', { status: 200 })));
    await expect(makeClient().get('/bad')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('maps network failures to a friendly ApiError', async () => {
    server.use(http.get(`${BASE}/down`, () => HttpResponse.error()));
    await expect(makeClient().get('/down')).rejects.toMatchObject({
      kind: 'network',
      status: 0,
      message: 'Unable to reach the server. Check your connection and try again.',
    });
  });

  it('times out slow requests', async () => {
    server.use(
      http.get(`${BASE}/slow`, async () => {
        await delay(200);
        return HttpResponse.json({});
      }),
    );
    await expect(makeClient(30).get('/slow')).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    tokenStore.setAccessToken('expired');
    server.use(protectedEndpoint('fresh'), refreshReturns('fresh'));

    await expect(makeClient().get('/auth/me')).resolves.toEqual({ id: 1 });
    expect(tokenStore.getAccessToken()).toBe('fresh');
  });

  it('shares a single in-flight refresh between concurrent 401s', async () => {
    tokenStore.setAccessToken('expired');
    const counter = { calls: 0 };
    server.use(protectedEndpoint('fresh'), refreshReturns('fresh', counter));

    const client = makeClient();
    const results = await Promise.all([
      client.get('/auth/me'),
      client.get('/auth/me'),
      client.get('/auth/me'),
    ]);

    expect(results).toEqual([{ id: 1 }, { id: 1 }, { id: 1 }]);
    expect(counter.calls).toBe(1);
  });

  it('logs out (session expired) when the refresh fails', async () => {
    tokenStore.setAccessToken('expired');
    const listener = vi.fn();
    const unsubscribe = tokenStore.onSessionExpired(listener);
    server.use(
      protectedEndpoint('never'),
      http.post(`${BASE}/auth/refresh`, () =>
        HttpResponse.json({ detail: 'Could not validate credentials' }, { status: 401 }),
      ),
    );

    await expect(makeClient().get('/auth/me')).rejects.toMatchObject({ status: 401 });
    expect(listener).toHaveBeenCalledOnce();
    expect(tokenStore.getAccessToken()).toBeNull();
    unsubscribe();
  });

  it('does not log out when the refresh fails because the network is down', async () => {
    tokenStore.setAccessToken('expired');
    const listener = vi.fn();
    const unsubscribe = tokenStore.onSessionExpired(listener);
    server.use(
      protectedEndpoint('never'),
      http.post(`${BASE}/auth/refresh`, () => HttpResponse.error()),
    );

    await expect(makeClient().get('/auth/me')).rejects.toMatchObject({ kind: 'network' });
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it.each([429, 502, 503])('keeps the session when refresh returns %i', async (status) => {
    tokenStore.setAccessToken('expired');
    const listener = vi.fn();
    const unsubscribe = tokenStore.onSessionExpired(listener);
    server.use(
      protectedEndpoint('never'),
      http.post(`${BASE}/auth/refresh`, () => HttpResponse.json({ detail: 'busy' }, { status })),
    );

    await expect(makeClient().get('/auth/me')).rejects.toMatchObject({
      message: 'The server is temporarily unavailable. Please try again.',
    });
    expect(listener).not.toHaveBeenCalled();
    expect(tokenStore.getAccessToken()).toBe('expired');
    unsubscribe();
  });

  it('does not send a request whose signal is already aborted', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/items`, () => {
        calls += 1;
        return HttpResponse.json({});
      }),
    );
    const controller = new AbortController();
    controller.abort();
    await expect(makeClient().get('/items', { signal: controller.signal })).rejects.toBeDefined();
    expect(calls).toBe(0);
  });

  it('serialises refreshes across tabs with the Web Locks API when available', async () => {
    tokenStore.setAccessToken('expired');
    const request = vi.fn((_name: string, task: () => Promise<unknown>) => task());
    vi.stubGlobal('navigator', { ...navigator, locks: { request } });
    server.use(protectedEndpoint('fresh'), refreshReturns('fresh'));

    await expect(makeClient().get('/auth/me')).resolves.toEqual({ id: 1 });
    expect(request).toHaveBeenCalledWith('nutriflow-token-refresh', expect.any(Function));
    vi.unstubAllGlobals();
  });

  it('does not try to refresh for unauthenticated calls', async () => {
    const counter = { calls: 0 };
    server.use(
      refreshReturns('fresh', counter),
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({ detail: 'Invalid email or password.' }, { status: 401 }),
      ),
    );
    await expect(
      makeClient().post('/auth/login', {}, { authenticated: false }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(counter.calls).toBe(0);
  });

  it('refreshSession reports expired sessions without throwing', async () => {
    server.use(
      http.post(`${BASE}/auth/refresh`, () =>
        HttpResponse.json({ detail: 'Refresh token missing.' }, { status: 401 }),
      ),
    );
    await expect(makeClient().refreshSession()).resolves.toBe('expired');
  });
});

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TEST_API } from './fixtures';

/**
 * Default handlers: no session (refresh fails). Tests override per case with
 * `server.use(...)`. Unhandled requests fail the test.
 */
export const defaultHandlers = [
  http.post(`${TEST_API}/auth/refresh`, () =>
    HttpResponse.json({ detail: 'Refresh token missing.' }, { status: 401 }),
  ),
  http.post(`${TEST_API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
];

export const server = setupServer(...defaultHandlers);

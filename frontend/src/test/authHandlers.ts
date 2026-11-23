import { http, HttpResponse } from 'msw';
import type { UserDto } from '@/types/api';
import { buildTokens, buildUser, TEST_API } from './fixtures';

/** A restorable session: refresh succeeds and /auth/me returns `user`. */
export function sessionHandlers(user: UserDto = buildUser()) {
  return [
    http.post(`${TEST_API}/auth/refresh`, () => HttpResponse.json(buildTokens('restored'))),
    http.get(`${TEST_API}/auth/me`, () => HttpResponse.json(user)),
  ];
}

/** /auth/me for whoever just logged in or registered. */
export function meHandler(user: UserDto = buildUser()) {
  return http.get(`${TEST_API}/auth/me`, () => HttpResponse.json(user));
}

export { buildUser };

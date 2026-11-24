import { http, HttpResponse } from 'msw';
import type { PasswordChangeRequestDto, ProfileUpdateRequestDto, UserDto } from '@/types/api';
import { buildTokens, buildUser, TEST_API } from './fixtures';

/**
 * A signed-in user that the profile endpoints change in memory: /auth/me always returns
 * the current state. `requests` records every body sent.
 */
export function profileServer(initial: UserDto = buildUser({ is_profile_complete: true })) {
  let user = { ...initial };
  const requests: { path: string; body: unknown }[] = [];
  const record = async (path: string, request: Request) => {
    const body: unknown = await request.json().catch(() => null);
    requests.push({ path, body });
    return body;
  };

  const handlers = [
    http.post(`${TEST_API}/auth/refresh`, () => HttpResponse.json(buildTokens('restored'))),
    http.get(`${TEST_API}/auth/me`, () => HttpResponse.json(user)),
    http.put(`${TEST_API}/users/profile`, async ({ request }) => {
      const body = (await record('/users/profile', request)) as ProfileUpdateRequestDto;
      user = { ...user, ...body };
      return HttpResponse.json(user);
    }),
    http.put(`${TEST_API}/users/password`, async ({ request }) => {
      const body = (await record('/users/password', request)) as PasswordChangeRequestDto;
      if (body.current_password !== 'Str0ngPass!') {
        return HttpResponse.json({ detail: 'Incorrect current password' }, { status: 400 });
      }
      return HttpResponse.json({
        ...buildTokens('after-password-change'),
        message: 'Password changed successfully',
      });
    }),
    http.put(`${TEST_API}/users/allergies`, async ({ request }) => {
      const { allergies } = (await record('/users/allergies', request)) as { allergies: string[] };
      user = { ...user, food_allergies: allergies };
      return HttpResponse.json({ message: 'Allergies updated successfully', allergies });
    }),
    http.put(`${TEST_API}/dashboard/extend-goal`, async ({ request }) => {
      await record('/dashboard/extend-goal', request);
      return HttpResponse.json({ message: 'Goal extended' });
    }),
    http.put(`${TEST_API}/dashboard/reset-goal`, async ({ request }) => {
      await record('/dashboard/reset-goal', request);
      user = { ...user, is_profile_complete: false };
      return HttpResponse.json({ message: 'Goal reset' });
    }),
  ];
  return { handlers, requests, currentUser: () => user };
}

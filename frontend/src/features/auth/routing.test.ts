import { describe, expect, it } from 'vitest';
import { homePathFor, resolveRedirect } from './routing';

const newUser = { is_profile_complete: false };
const onboardedUser = { is_profile_complete: true };

describe('homePathFor', () => {
  it('sends incomplete profiles to onboarding and complete ones home', () => {
    expect(homePathFor(newUser)).toBe('/onboarding');
    expect(homePathFor(onboardedUser)).toBe('/home');
  });
});

describe('resolveRedirect', () => {
  it.each([
    ['guest', 'anonymous', undefined, null],
    ['onboarding', 'anonymous', undefined, '/login'],
    ['app', 'anonymous', undefined, '/login'],
    ['guest', 'authenticated', newUser, '/onboarding'],
    ['guest', 'authenticated', onboardedUser, '/home'],
    ['onboarding', 'authenticated', newUser, null],
    ['onboarding', 'authenticated', onboardedUser, '/home'],
    ['app', 'authenticated', newUser, '/onboarding'],
    ['app', 'authenticated', onboardedUser, null],
  ] as const)('%s route, %s session → %s', (audience, status, user, expected) => {
    expect(resolveRedirect(audience, status, user)).toBe(expected);
  });
});

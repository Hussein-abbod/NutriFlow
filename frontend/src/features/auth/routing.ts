import type { UserDto } from '@/types/api';

export const paths = {
  root: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  home: '/home',
} as const;

/** Which kind of user a route group is for. */
export type RouteAudience = 'guest' | 'onboarding' | 'app';

/** Where a signed-in user belongs (splash_screen.dart `_checkAuth`). */
export function homePathFor(user: Pick<UserDto, 'is_profile_complete'>): string {
  return user.is_profile_complete ? paths.home : paths.onboarding;
}

/**
 * Decide whether a route group may render.
 * Returns `null` to render, or the path to redirect to.
 * Requires the user when `status === 'authenticated'`.
 */
export function resolveRedirect(
  audience: RouteAudience,
  status: 'authenticated' | 'anonymous',
  user: Pick<UserDto, 'is_profile_complete'> | undefined,
): string | null {
  if (status === 'anonymous') {
    return audience === 'guest' ? null : paths.login;
  }
  if (!user) return null;
  const home = homePathFor(user);
  if (audience === 'guest') return home;
  if (audience === 'onboarding') return user.is_profile_complete ? home : null;
  return user.is_profile_complete ? null : home;
}

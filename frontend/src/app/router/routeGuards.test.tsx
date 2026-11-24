import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeAll, describe, expect, it } from 'vitest';
import { tokenStore } from '@/lib/api';
import { useNotificationSettings } from '@/lib/notifications/notificationSettings';
import { sessionHandlers } from '@/test/authHandlers';
import { coachServer } from '@/test/coachHandlers';
import { buildUser, TEST_API } from '@/test/fixtures';
import { foodLogHandlers } from '@/test/foodLogHandlers';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';

const onboardedUser = buildUser({ is_profile_complete: true });

// Lazy routes the guards lead to; load them once up front.
beforeAll(() =>
  Promise.all([
    import('@/features/coach'),
    import('@/features/profile'),
    import('@/features/onboarding'),
  ]),
);

describe('splash + route guards', () => {
  it('shows the splash while restoring the session', async () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'NutriFlow' })).toBeInTheDocument();
    expect(screen.getByText('Smart Nutrition Tracking')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Loading NutriFlow' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
  });

  it('sends anonymous users from protected routes to login', async () => {
    const { router } = renderApp('/home');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('restores a session from the refresh cookie and opens the first tab', async () => {
    server.use(...sessionHandlers(onboardedUser), ...foodLogHandlers());
    const { router } = renderApp('/');
    await waitFor(() => expect(router.state.location.pathname).toBe('/food-log'));
    expect(await screen.findByRole('heading', { name: 'NutriFlow food log' })).toBeInTheDocument();
    expect(tokenStore.getAccessToken()).toBe('restored');
  });

  it('keeps users who have not finished onboarding out of the app', async () => {
    server.use(...sessionHandlers(buildUser({ is_profile_complete: false })));
    const { router } = renderApp('/home');
    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'));
  });

  it('keeps onboarded users away from login and onboarding', async () => {
    server.use(...sessionHandlers(onboardedUser));
    const { router } = renderApp('/onboarding');
    await waitFor(() => expect(router.state.location.pathname).toBe('/food-log'));
    await act(() => router.navigate('/login'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/food-log'));
  });

  it('logs out and returns to login', async () => {
    let logoutCalls = 0;
    server.use(
      ...sessionHandlers(onboardedUser),
      http.post(`${TEST_API}/auth/logout`, () => {
        logoutCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    useNotificationSettings.getState().setRemindersEnabled(true);
    const { router } = renderApp('/profile');
    await userEvent.click(await screen.findByRole('button', { name: 'Logout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    // The next person on this browser decides about reminders themselves.
    expect(useNotificationSettings.getState().remindersEnabled).toBe(false);
    expect(logoutCalls).toBe(1);
    expect(tokenStore.getAccessToken()).toBeNull();
  });

  it('redirects to login with a message when the session expires', async () => {
    server.use(...sessionHandlers(onboardedUser), ...coachServer().handlers);
    const { router } = renderApp('/coach');
    await screen.findByRole('heading', { name: 'Coach AI' });
    act(() => tokenStore.notifySessionExpired());
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your session has expired. Please log in again.',
    );
  });

  it('treats a session whose profile cannot load as signed out', async () => {
    server.use(
      http.post(`${TEST_API}/auth/refresh`, () =>
        HttpResponse.json({ access_token: 'x', token_type: 'bearer', expires_in: 1800 }),
      ),
      http.get(`${TEST_API}/auth/me`, () =>
        HttpResponse.json({ detail: 'User not found' }, { status: 404 }),
      ),
    );
    const { router } = renderApp('/');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(tokenStore.getAccessToken()).toBeNull();
  });

  it('redirects unknown URLs to the right home', async () => {
    const { router } = renderApp('/does-not-exist');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});

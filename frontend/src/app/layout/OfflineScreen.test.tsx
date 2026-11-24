import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sessionHandlers } from '@/test/authHandlers';
import { buildUser, TEST_API } from '@/test/fixtures';
import { foodLogHandlers } from '@/test/foodLogHandlers';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';

const onboardedUser = buildUser({ is_profile_complete: true });
const networkDown = () =>
  server.use(http.post(`${TEST_API}/auth/refresh`, () => HttpResponse.error()));

function setOnline(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
  act(() => {
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  });
}

afterEach(() => vi.restoreAllMocks());

describe('offline handling', () => {
  it('shows a friendly offline screen instead of the login when the server is out of reach', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    networkDown();
    const { router } = renderApp('/food-log');

    expect(await screen.findByRole('heading', { name: "You're offline" })).toBeVisible();
    expect(router.state.location.pathname).toBe('/food-log');
    expect(screen.queryByRole('heading', { name: 'Welcome Back' })).not.toBeInTheDocument();
  });

  it('tries again by itself when the connection comes back', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    networkDown();
    const { router } = renderApp('/food-log');
    await screen.findByRole('heading', { name: "You're offline" });

    server.use(...sessionHandlers(onboardedUser), ...foodLogHandlers());
    setOnline(true);
    expect(await screen.findByRole('heading', { name: 'NutriFlow food log' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/food-log');
  });

  it('says when the server is down although the device is online, with Try again', async () => {
    server.use(
      http.post(`${TEST_API}/auth/refresh`, () =>
        HttpResponse.json({ detail: 'Bad gateway' }, { status: 502 }),
      ),
    );
    renderApp('/');
    expect(await screen.findByRole('heading', { name: "Can't reach NutriFlow" })).toBeVisible();

    server.use(...sessionHandlers(onboardedUser), ...foodLogHandlers());
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'NutriFlow food log' })).toBeVisible();
  });

  it('shows a banner while the signed-in app is offline', async () => {
    server.use(...sessionHandlers(onboardedUser), ...foodLogHandlers());
    renderApp('/food-log');
    await screen.findByRole('heading', { name: 'NutriFlow food log' });

    setOnline(false);
    expect(
      screen.getByText("You're offline. Changes can't be saved until you reconnect."),
    ).toBeVisible();
    setOnline(true);
    await waitFor(() => expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument());
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeAll, describe, expect, it } from 'vitest';
import { sessionHandlers } from '@/test/authHandlers';
import { dashboardHandlers } from '@/test/dashboardHandlers';
import {
  buildGoalProgress,
  buildTodaySummary,
  buildUser,
  buildWeekly,
  TEST_API,
} from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';

const onboarded = buildUser({ is_profile_complete: true });

// The dashboard route is lazy-loaded; import it once up front so the first test is not slow.
beforeAll(() => import('@/features/dashboard'));

describe('DashboardPage', () => {
  it('shows a spinner, then today, meals, the week and the goal', async () => {
    server.use(...sessionHandlers(onboarded), ...dashboardHandlers());
    server.use(
      http.get(`${TEST_API}/dashboard/today`, async () => {
        await delay(50);
        return HttpResponse.json(buildTodaySummary());
      }),
    );
    renderApp('/dashboard');

    expect(
      await screen.findByRole('progressbar', { name: 'Loading dashboard' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: "Today's Overview" })).toBeInTheDocument();
    expect(screen.getByText('1200 of 2000 kcal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Meal Breakdown' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Weekly Progress' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /target 2000 kcal/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Goal Progress' })).toBeInTheDocument();
    expect(screen.getByText('42 days left')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the error with Retry and recovers', async () => {
    let failures = 1;
    server.use(...sessionHandlers(onboarded), ...dashboardHandlers());
    server.use(
      http.get(`${TEST_API}/dashboard/weekly`, () => {
        if (failures-- > 0)
          return HttpResponse.json({ detail: 'Weekly data unavailable' }, { status: 400 });
        return HttpResponse.json(buildWeekly());
      }),
    );
    renderApp('/dashboard');

    expect(await screen.findByRole('alert')).toHaveTextContent('Weekly data unavailable');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: "Today's Overview" })).toBeInTheDocument();
  });

  it('works for a brand-new account with nothing logged', async () => {
    server.use(
      ...sessionHandlers(onboarded),
      ...dashboardHandlers({
        today: buildTodaySummary({
          calories_consumed: 0,
          protein: { consumed: 0, target: 140 },
          carbs: { consumed: 0, target: 169 },
          fat: { consumed: 0, target: 46 },
          meals: {},
        }),
        weekly: buildWeekly([0, 0, 0, 0, 0, 0, 0]),
        goal: buildGoalProgress({ has_active_goal: false }),
      }),
    );
    renderApp('/dashboard');
    expect(await screen.findByText('0 of 2000 kcal')).toBeInTheDocument();
    expect(screen.getAllByText('0 kcal')).toHaveLength(4 + 7);
    expect(screen.getByText('No active goal found.')).toBeInTheDocument();
  });

  it('sends the user back to onboarding after resetting an ended goal', async () => {
    let profileComplete = true;
    server.use(
      ...dashboardHandlers({ goal: buildGoalProgress({ days_remaining: 0 }) }),
      http.post(`${TEST_API}/auth/refresh`, () =>
        HttpResponse.json({ access_token: 'a', token_type: 'bearer', expires_in: 1800 }),
      ),
      http.get(`${TEST_API}/auth/me`, () =>
        HttpResponse.json(buildUser({ is_profile_complete: profileComplete })),
      ),
      http.put(`${TEST_API}/dashboard/reset-goal`, () => {
        profileComplete = false;
        return HttpResponse.json({ message: 'Goal reset successfully' });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderApp('/dashboard');
    await user.click(await screen.findByRole('button', { name: 'Reset Goal' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reset goal' });
    await user.click(within(dialog).getByRole('button', { name: 'Reset Goal' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'));
  });
});

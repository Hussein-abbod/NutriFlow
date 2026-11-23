import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { SnackbarHost } from '@/components';
import { buildGoalProgress, TEST_API } from '@/test/fixtures';
import { renderWithQuery } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { GoalProgressCard } from './GoalProgressCard';

function renderCard(goal = buildGoalProgress()) {
  return renderWithQuery(
    <>
      <GoalProgressCard goal={goal} />
      <SnackbarHost />
    </>,
  );
}

describe('GoalProgressCard', () => {
  it('shows the goal, days left, weights and progress', () => {
    renderCard();
    expect(screen.getByRole('heading', { name: 'Lose Weight' })).toBeInTheDocument();
    expect(screen.getByText('42 days left')).toBeInTheDocument();
    const weights = screen.getByText('75.0kg', { exact: false }).parentElement;
    expect(weights).toHaveTextContent('Start 80kgCurrent 75.0kgTarget 70kg');
    expect(screen.getByRole('progressbar', { name: 'Weight goal progress' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.queryByRole('button', { name: /Extend/ })).not.toBeInTheDocument();
  });

  it('shows the empty state without an active goal', () => {
    renderCard(buildGoalProgress({ has_active_goal: false }));
    expect(screen.getByText('No active goal found.')).toBeInTheDocument();
  });

  it('extends an ended goal by two weeks', async () => {
    let body: unknown;
    server.use(
      http.put(`${TEST_API}/dashboard/extend-goal`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ message: 'Goal extended successfully' });
      }),
    );
    renderCard(buildGoalProgress({ days_remaining: 0 }));
    expect(screen.getByText(/Your goal period has ended/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Extend 2 weeks' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Goal extended by 2 weeks.');
    expect(body).toEqual({ extra_weeks: 2 });
  });

  it('asks before resetting the goal, and reports failures', async () => {
    let resets = 0;
    server.use(
      http.put(`${TEST_API}/dashboard/reset-goal`, () => {
        resets += 1;
        return HttpResponse.json({ detail: 'Something broke' }, { status: 400 });
      }),
    );
    const user = userEvent.setup();
    renderCard(buildGoalProgress({ days_remaining: 0 }));

    await user.click(screen.getByRole('button', { name: 'Reset Goal' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reset goal' });
    expect(dialog).toHaveTextContent('Reset your goal?');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(resets).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Reset Goal' }));
    const confirm = await screen.findByRole('dialog', { name: 'Reset goal' });
    await user.click(within(confirm).getByRole('button', { name: 'Reset Goal' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something broke');
    expect(resets).toBe(1);
  });
});

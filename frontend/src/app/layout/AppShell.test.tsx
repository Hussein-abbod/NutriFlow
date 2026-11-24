import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { sessionHandlers } from '@/test/authHandlers';
import { coachServer } from '@/test/coachHandlers';
import { dashboardHandlers } from '@/test/dashboardHandlers';
import { buildUser } from '@/test/fixtures';
import { foodLogHandlers } from '@/test/foodLogHandlers';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';

// Tabs are lazy-loaded; import them once up front so the first test is not slow.
beforeAll(() =>
  Promise.all([
    import('@/features/dashboard'),
    import('@/features/coach'),
    import('@/features/profile'),
  ]),
);

describe('AppShell bottom navigation', () => {
  it('has the four Flutter tabs and starts on Food Log', async () => {
    server.use(...sessionHandlers(buildUser({ is_profile_complete: true })), ...foodLogHandlers());
    const { router } = renderApp('/home');
    await waitFor(() => expect(router.state.location.pathname).toBe('/food-log'));

    const nav = await screen.findByRole('navigation', { name: 'Main' });
    const links = [...nav.querySelectorAll('a')];
    expect(links.map((link) => link.textContent)).toEqual([
      'Food Log',
      'Dashboard',
      'AI Coach',
      'Profile',
    ]);
    expect(screen.getByRole('link', { name: 'Food Log' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: 'NutriFlow food log' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Breakfast' })).toBeInTheDocument();
  });

  it('switches tabs', async () => {
    server.use(
      ...sessionHandlers(buildUser({ is_profile_complete: true })),
      ...dashboardHandlers(),
      ...foodLogHandlers(),
      ...coachServer().handlers,
    );
    const user = userEvent.setup();
    const { router } = renderApp('/food-log');

    await user.click(await screen.findByRole('link', { name: 'AI Coach' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/coach'));
    expect(await screen.findByRole('heading', { name: 'Coach AI' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AI Coach' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Food Log' })).not.toHaveAttribute('aria-current');

    await user.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(await screen.findByRole('heading', { name: "Today's Overview" })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Profile' }));
    expect(await screen.findByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });
});

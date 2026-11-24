import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RouteErrorScreen } from './RouteErrorScreen';

function renderFailingRoute(error: Error) {
  const router = createMemoryRouter([
    {
      path: '/',
      errorElement: <RouteErrorScreen />,
      lazy: async () => {
        throw error;
      },
    },
  ]);
  render(<RouterProvider router={router} />);
}

describe('RouteErrorScreen', () => {
  it('explains a screen whose code could not be loaded', async () => {
    renderFailingRoute(
      new TypeError('Failed to fetch dynamically imported module: /assets/profile.js'),
    );
    expect(await screen.findByRole('heading', { name: "This screen couldn't load" })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeVisible();
    expect(screen.queryByText(/profile\.js/)).not.toBeInTheDocument();
  });

  it('shows a calm message for any other error, without details', async () => {
    renderFailingRoute(new Error('secret stack detail'));
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    expect(screen.queryByText(/secret stack detail/)).not.toBeInTheDocument();
  });
});

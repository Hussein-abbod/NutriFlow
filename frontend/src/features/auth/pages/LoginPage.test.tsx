import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { meHandler } from '@/test/authHandlers';
import { buildTokens, buildUser, TEST_API } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';

async function openLogin() {
  const view = renderApp('/login');
  await screen.findByRole('heading', { name: 'Welcome Back' });
  return view;
}

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Login' }));
}

describe('LoginPage', () => {
  it('renders the Flutter login copy', async () => {
    await openLogin();
    expect(screen.getByText('Sign in to continue your journey')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Don't have an account? Sign Up" })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('validates fields inline without calling the API', async () => {
    let loginCalls = 0;
    server.use(
      http.post(`${TEST_API}/auth/login`, () => {
        loginCalls += 1;
        return HttpResponse.json(buildTokens());
      }),
    );
    await openLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Please enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Please enter your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    expect(loginCalls).toBe(0);
  });

  it('logs in and routes a new user to onboarding', async () => {
    let body: unknown;
    server.use(
      http.post(`${TEST_API}/auth/login`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildTokens());
      }),
      meHandler(buildUser({ is_profile_complete: false })),
    );
    const { router } = await openLogin();
    await fillAndSubmit(' alice@example.com ', 'Str0ngPass!');

    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'));
    expect(body).toEqual({ email: 'alice@example.com', password: 'Str0ngPass!' });
  });

  it('routes an onboarded user to the app (first tab)', async () => {
    server.use(
      http.post(`${TEST_API}/auth/login`, () => HttpResponse.json(buildTokens())),
      meHandler(buildUser({ is_profile_complete: true })),
    );
    const { router } = await openLogin();
    await fillAndSubmit('alice@example.com', 'Str0ngPass!');
    await waitFor(() => expect(router.state.location.pathname).toBe('/food-log'));
  });

  it('shows the server error in a snackbar and stays on the page', async () => {
    server.use(
      http.post(`${TEST_API}/auth/login`, () =>
        HttpResponse.json({ detail: 'Invalid email or password.' }, { status: 401 }),
      ),
    );
    const { router } = await openLogin();
    await fillAndSubmit('alice@example.com', 'WrongPass1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(router.state.location.pathname).toBe('/login');
    expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled();
  });

  it('shows a loading button while signing in', async () => {
    server.use(
      http.post(`${TEST_API}/auth/login`, async () => {
        await delay('infinite');
        return HttpResponse.json(buildTokens());
      }),
    );
    await openLogin();
    await fillAndSubmit('alice@example.com', 'Str0ngPass!');
    const button = await screen.findByRole('button', { name: 'Logging in' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('navigates to sign up', async () => {
    const { router } = await openLogin();
    await userEvent.click(screen.getByRole('link', { name: /Sign Up/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/register'));
    expect(await screen.findByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });
});

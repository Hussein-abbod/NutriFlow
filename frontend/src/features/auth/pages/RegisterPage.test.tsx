import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { meHandler } from '@/test/authHandlers';
import { buildTokens, buildUser, TEST_API } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';

async function openRegister() {
  const view = renderApp('/register');
  await screen.findByRole('heading', { name: 'Create Account' });
  return view;
}

async function fillForm(values: {
  fullName?: string;
  email?: string;
  password?: string;
  confirm?: string;
}) {
  if (values.fullName) await userEvent.type(screen.getByLabelText('Full Name'), values.fullName);
  if (values.email) await userEvent.type(screen.getByLabelText('Email'), values.email);
  if (values.password) await userEvent.type(screen.getByLabelText('Password'), values.password);
  if (values.confirm)
    await userEvent.type(screen.getByLabelText('Confirm Password'), values.confirm);
  await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
}

const registered = () =>
  HttpResponse.json(
    {
      ...buildTokens(),
      id: 1,
      email: 'alice@example.com',
      full_name: 'Alice',
      is_profile_complete: false,
    },
    { status: 201 },
  );

describe('RegisterPage', () => {
  it('renders the Flutter "Create Account" step with the onboarding progress bar', async () => {
    await openRegister();
    expect(screen.getByText('Start your nutrition journey today')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Sign-up progress' })).toHaveAttribute(
      'aria-valuetext',
      'Step 1 of 6',
    );
    expect(screen.getByRole('link', { name: 'Already have an account? Login' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('shows the Flutter validation messages', async () => {
    await openRegister();
    await fillForm({});
    expect(await screen.findAllByText('Required')).toHaveLength(2);
    expect(screen.getByText('Min 8 characters')).toBeInTheDocument();

    await fillForm({ email: 'alice', password: 'Str0ngPass!', confirm: 'Different1!' });
    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('creates the account with the full name and continues to onboarding', async () => {
    let body: unknown;
    server.use(
      http.post(`${TEST_API}/auth/register`, async ({ request }) => {
        body = await request.json();
        return registered();
      }),
      meHandler(buildUser()),
    );
    const { router } = await openRegister();
    await fillForm({
      fullName: '  Alice  ',
      email: 'alice@example.com',
      password: 'Str0ngPass!',
      confirm: 'Str0ngPass!',
    });

    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'));
    expect(body).toEqual({
      full_name: 'Alice',
      email: 'alice@example.com',
      password: 'Str0ngPass!',
    });
  });

  it('shows a duplicate-email error from the server', async () => {
    server.use(
      http.post(`${TEST_API}/auth/register`, () =>
        HttpResponse.json({ detail: 'A user with this email already exists.' }, { status: 400 }),
      ),
    );
    const { router } = await openRegister();
    await fillForm({
      fullName: 'Alice',
      email: 'alice@example.com',
      password: 'Str0ngPass!',
      confirm: 'Str0ngPass!',
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A user with this email already exists.',
    );
    expect(router.state.location.pathname).toBe('/register');
  });

  it('puts server-side field validation errors inline', async () => {
    server.use(
      http.post(`${TEST_API}/auth/register`, () =>
        HttpResponse.json(
          { detail: [{ loc: ['body', 'email'], msg: 'Email domain is not allowed', type: 'x' }] },
          { status: 422 },
        ),
      ),
    );
    await openRegister();
    await fillForm({
      fullName: 'Alice',
      email: 'alice@example.com',
      password: 'Str0ngPass!',
      confirm: 'Str0ngPass!',
    });
    expect(await screen.findByText('Email domain is not allowed')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});

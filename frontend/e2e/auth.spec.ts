import { expect, test } from '@playwright/test';

/** Real backend: every run registers a brand-new user. */
const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
const PASSWORD = 'E2e-Str0ng-Pass!';

test('register, restore the session on reload, log out and log back in', async ({ page }) => {
  const email = uniqueEmail();

  // Splash → login (no session yet)
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

  // Sign up
  await page.getByRole('link', { name: /Sign Up/ }).click();
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  await page.getByLabel('Full Name', { exact: true }).fill('E2E Tester');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign Up' }).click();

  // New account → onboarding
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText('Hi, E2E Tester')).toBeVisible();

  // The refresh token is an httpOnly cookie, invisible to JavaScript…
  const cookies = await page.context().cookies('http://localhost:8000/auth');
  const refreshCookie = cookies.find((cookie) => cookie.name === 'nf_refresh');
  expect(refreshCookie?.httpOnly).toBe(true);
  expect(refreshCookie?.sameSite).toBe('Strict');
  expect(await page.evaluate(() => document.cookie)).not.toContain('nf_refresh');

  // …and restores the session after a full reload (access token was only in memory).
  await page.reload();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText('Hi, E2E Tester')).toBeVisible();

  // Log out → login
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  // Wrong password → server error snackbar
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Wrong-Pass-123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');

  // Correct password → back to onboarding
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText('Hi, E2E Tester')).toBeVisible();
});

test('protected routes redirect to login without a session', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login$/);
});

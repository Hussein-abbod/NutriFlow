import { expect, test } from '@playwright/test';
import { logIn, signUp, uniqueEmail } from './helpers';

test('register, restore the session on reload, and log in from a new browser', async ({
  page,
  browser,
}) => {
  const email = uniqueEmail();

  // Splash → login (no session yet)
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  await page.getByRole('link', { name: /Sign Up/ }).click();
  await expect(page).toHaveURL(/\/register$/);

  // Sign up → onboarding continues with basic info (as in Flutter)
  await signUp(page, { name: 'E2E Tester', email });
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible();

  // The refresh token is an httpOnly cookie, invisible to JavaScript…
  const cookies = await page.context().cookies('http://localhost:8000/auth');
  const refreshCookie = cookies.find((cookie) => cookie.name === 'nf_refresh');
  expect(refreshCookie?.httpOnly).toBe(true);
  expect(refreshCookie?.sameSite).toBe('Strict');
  expect(await page.evaluate(() => document.cookie)).not.toContain('nf_refresh');

  // …and restores the session after a full reload (access token was only in memory).
  await page.reload();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole('heading', { name: 'Welcome back, E2E Tester!' })).toBeVisible();

  // A fresh browser has no session: wrong password → snackbar, right password → onboarding.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto('/login');
  await logIn(otherPage, email, 'Wrong-Pass-123');
  await expect(otherPage.getByRole('alert')).toHaveText('Invalid email or password.');
  await logIn(otherPage, email);
  await expect(otherPage).toHaveURL(/\/onboarding$/);
  await expect(otherPage.getByRole('heading', { name: 'Welcome back, E2E Tester!' })).toBeVisible();
  await other.close();
});

test('protected routes redirect to login without a session', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

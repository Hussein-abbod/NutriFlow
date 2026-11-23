import { expect, type Page } from '@playwright/test';

/** Real backend: every run registers a brand-new user. */
export const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

export const PASSWORD = 'E2e-Str0ng-Pass!';

export async function signUp(page: Page, { name, email }: { name: string; email: string }) {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  await page.getByLabel('Full Name', { exact: true }).fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign Up' }).click();
}

export async function logIn(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

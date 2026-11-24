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

/**
 * Sign up and finish onboarding with fixed answers: female, 30 y, 165 cm, 70 kg, moderately
 * active, lose 5 kg in 10 weeks → 1651 kcal a day. Ends on the Food Log tab; returns the email.
 */
export async function signUpAndOnboard(page: Page, name = 'E2E User'): Promise<string> {
  const email = uniqueEmail();
  await signUp(page, { name, email });
  const next = () => page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible();
  await page.getByText('Female', { exact: true }).click();
  await page.getByLabel('Age').fill('30');
  await page.getByLabel('Height', { exact: true }).fill('165');
  await page.getByLabel('Weight', { exact: true }).fill('70');
  await next();

  await expect(page.getByRole('heading', { name: 'Activity Level' })).toBeVisible();
  await page.getByText('Moderately Active', { exact: true }).click();
  await next();

  await expect(page.getByRole('heading', { name: 'Your Goal' })).toBeVisible();
  await page.getByText('Lose Weight', { exact: true }).click();
  await page.getByLabel('Target Weight').fill('65');
  await page.getByRole('slider', { name: 'Goal Period' }).fill('10');
  await next();

  await expect(page.getByRole('heading', { name: 'Food Allergies' })).toBeVisible();
  await next();

  await expect(page.getByRole('heading', { name: 'Your Plan is Ready!' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm & Finish' }).click();
  await expect(page).toHaveURL(/\/food-log$/);
  return email;
}

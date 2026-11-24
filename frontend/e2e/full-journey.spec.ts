import { expect, test } from '@playwright/test';
import { logIn, PASSWORD, signUpAndOnboard } from './helpers';

/**
 * The whole app on the real backend + MySQL (AI and USDA are the fixed fakes of
 * backend/tests/e2e_server.py): register → onboarding → log food → dashboard → coach chat
 * → edit profile → change password → logout → log in again.
 */
const DAILY = 1651;
const RICE = 'Rice, white, long-grain, cooked';
const NEW_PASSWORD = 'N3w-E2e-Pass!';

test('a new user goes through every part of NutriFlow', async ({ page }) => {
  const email = await signUpAndOnboard(page, 'Jo Journey');

  // Log 100 g of rice for breakfast
  await page.getByRole('button', { name: 'Log your breakfast' }).click();
  await page.getByRole('link', { name: /Search by Name/ }).click();
  await page.getByRole('textbox', { name: 'Search food' }).fill('rice');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: `Add ${RICE}` }).click();
  await page.getByRole('button', { name: 'Review & Confirm' }).click();
  await page.getByRole('button', { name: 'Log Meal' }).click();

  // The advice → "Discuss with Coach AI" opens the chat about this meal
  const advice = page.getByRole('dialog', { name: 'NutriFlow Advice' });
  await expect(advice).toContainText('Solid breakfast: 130 kcal.');
  await advice.getByRole('button', { name: 'Discuss with Coach AI' }).click();
  await expect(page).toHaveURL(/\/coach$/);
  const conversation = page.getByRole('list', { name: 'Conversation with Coach AI' });
  await expect(conversation).toContainText('Solid breakfast: 130 kcal.');
  await expect(conversation).toContainText('Happy to talk about this meal.');

  // Chat with the coach
  await page
    .getByRole('textbox', { name: 'Message Coach AI' })
    .fill('What should I eat for dinner?');
  await page.keyboard.press('Enter');
  await expect(conversation).toContainText('What should I eat for dinner?');
  await expect(conversation).toContainText(
    'Coach says: try more vegetables with "What should I eat for dinner?".',
  );

  // The dashboard counts the meal
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText(`130 of ${DAILY} kcal`)).toBeAttached();

  // Edit the profile: a new weight gives new daily targets
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByText('Jo Journey')).toBeVisible();
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByRole('textbox', { name: 'Weight (kg)' }).fill('68');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile updated successfully')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Weight (kg)' })).toHaveValue('68');
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText(/130 of \d+ kcal/)).toBeAttached();
  await expect(page.getByText(`130 of ${DAILY} kcal`)).not.toBeAttached();

  // Change the password, then log out
  await page.getByRole('link', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Change Password' }).click();
  const sheet = page.getByRole('dialog', { name: 'Change Password' });
  await sheet.getByLabel('Current Password', { exact: true }).fill(PASSWORD);
  await sheet.getByLabel('New Password', { exact: true }).fill(NEW_PASSWORD);
  await sheet.getByLabel('Confirm New Password', { exact: true }).fill(NEW_PASSWORD);
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByText('Password changed. Other devices have been signed out.'),
  ).toBeVisible();
  // This device keeps its session (new tokens) across a reload
  await page.reload();
  await expect(page.getByText('Jo Journey')).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);

  // The old password no longer works; the new one does, and the data is still there
  await logIn(page, email, PASSWORD);
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
  await logIn(page, email, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/food-log$/);
  await expect(page.getByRole('region', { name: 'Breakfast' })).toContainText(RICE);
  await page.getByRole('link', { name: 'AI Coach' }).click();
  await expect(page.getByRole('list', { name: 'Conversation with Coach AI' })).toContainText(
    'What should I eat for dinner?',
  );
});

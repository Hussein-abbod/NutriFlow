import { expect, test } from '@playwright/test';
import { signUpAndOnboard } from './helpers';

/**
 * Real backend + MySQL; USDA / Groq / Gemini are the fixed fakes of backend/tests/e2e_server.py
 * (rice = 130 kcal per 100 g; advice "Solid <meal>: <kcal> kcal. You have <left> kcal left today.").
 * Daily target from the onboarding answers: 1651 kcal; lunch share 35 % = 578 kcal.
 */
const DAILY = 1651;
const RICE = 'Rice, white, long-grain, cooked';

test('log a food by text → confirm → it shows in the log and the dashboard totals change', async ({
  page,
}) => {
  await signUpAndOnboard(page, 'Lou Logger');

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText(`0 of ${DAILY} kcal`)).toBeAttached();
  await page.getByRole('link', { name: 'Food Log' }).click();

  // Food log → add-food sheet → Search by Name
  await page.getByRole('button', { name: 'Log your lunch' }).click();
  await page.getByRole('link', { name: /Search by Name/ }).click();
  await expect(page.getByRole('heading', { name: 'Search Food' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search food' }).fill('rice');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: `Add ${RICE}` }).click();
  await expect(page.getByText('1 item(s) selected')).toBeVisible();
  await page.getByRole('button', { name: 'Review & Confirm' }).click();

  // Confirm: change the portion to 200 g, then log
  await expect(page.getByRole('heading', { name: 'Confirm Lunch' })).toBeVisible();
  await page.getByRole('button', { name: `Edit ${RICE}: 100 g 130 kcal` }).click();
  const editSheet = page.getByRole('dialog', { name: `Edit ${RICE}` });
  await editSheet.getByRole('textbox', { name: 'Quantity' }).fill('200');
  await editSheet.getByRole('button', { name: 'Update' }).click();
  await expect(page.getByRole('region', { name: 'Total Nutrition' })).toContainText('260 kcal');
  await page.getByRole('button', { name: 'Log Meal' }).click();

  // Back on the food log with the AI advice for this meal
  const advice = page.getByRole('dialog', { name: 'NutriFlow Advice' });
  await expect(advice).toContainText(
    `Solid lunch: 260 kcal. You have ${DAILY - 260} kcal left today.`,
  );
  await advice.getByRole('button', { name: 'Got it!' }).click();
  await expect(page).toHaveURL(/\/food-log$/);

  const lunch = page.getByRole('region', { name: 'Lunch' });
  await expect(lunch).toContainText(RICE);
  await expect(lunch).toContainText('200 g');
  await expect(lunch).toContainText('260 / 578 kcal');
  await expect(page.getByRole('region', { name: 'Calories remaining' })).toContainText(
    `${DAILY - 260} / ${DAILY}`,
  );

  // The dashboard has the new totals
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText(`260 of ${DAILY} kcal`)).toBeAttached();

  // Removing the item brings everything back to zero
  await page.getByRole('link', { name: 'Food Log' }).click();
  await page.getByRole('button', { name: `Remove ${RICE}` }).click();
  await page
    .getByRole('alertdialog', { name: 'Remove item?' })
    .getByRole('button', { name: 'Remove' })
    .click();
  await expect(page.getByRole('button', { name: 'Log your lunch' })).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText(`0 of ${DAILY} kcal`)).toBeAttached();
});

test.describe('barcode scanner', () => {
  // playwright.config.ts gives Chromium a fake camera; permission is denied by default.
  test('starts the camera once access is allowed', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await signUpAndOnboard(page, 'Cam Era');
    await page.getByRole('button', { name: 'Log your snack' }).click();
    await page.getByRole('link', { name: /Barcode Scanner/ }).click();
    await expect(page.getByText('Point the camera at a barcode')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter barcode manually' })).toBeVisible();
  });

  test('blocked camera falls back to typing the code', async ({ page }) => {
    await signUpAndOnboard(page, 'Bar Coder');

    await page.getByRole('button', { name: 'Log your snack' }).click();
    await page.getByRole('link', { name: /Barcode Scanner/ }).click();
    await expect(page.getByRole('heading', { name: 'Scan Barcode' })).toBeVisible();

    // Playwright denies the camera permission, like a user tapping "Block".
    await expect(page.getByRole('heading', { name: 'Camera access is blocked' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Barcode number' }).fill('0123 4567 8905');
    await page.getByRole('button', { name: 'Look up' }).click();

    const product = page.getByRole('region', { name: 'Grilled Chicken Strips' });
    await expect(product).toContainText('E2E Foods');
    await expect(product).toContainText('85 g');
    await product.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByRole('heading', { name: 'Confirm Snack' })).toBeVisible();
    await page.getByRole('button', { name: 'Log Meal' }).click();
    await page
      .getByRole('dialog', { name: 'NutriFlow Advice' })
      .getByRole('button', { name: 'Got it!' })
      .click();
    await expect(page.getByRole('region', { name: 'Snack' })).toContainText(
      'Grilled Chicken Strips',
    );
  });
});

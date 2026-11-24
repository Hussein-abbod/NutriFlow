import { expect, test, type Page } from '@playwright/test';
import { logIn, signUp, uniqueEmail } from './helpers';

/**
 * Female, 30 y, 165 cm, 70 kg, moderately active, lose 5 kg in 10 weeks.
 * Mifflin-St Jeor: BMR 1420.25 → TDEE 2201.39 → −550 kcal = 1651.39 kcal;
 * protein 2 g/kg = 140 g, fat 25 % = 45.87 g, carbs = rest = 169.64 g.
 */
const EXPECTED = { calories: 1651, protein: 140, carbs: 170, fat: 46 };

const next = (page: Page) => page.getByRole('button', { name: 'Next' }).click();

test('register → complete onboarding → dashboard shows the calculated targets', async ({
  page,
}) => {
  const email = uniqueEmail();
  await signUp(page, { name: 'Dana Flow', email });

  // Step 2: basic info
  await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible();
  await page.getByText('Female', { exact: true }).click();
  await page.getByLabel('Age').fill('30');
  await page.getByLabel('Height', { exact: true }).fill('165');
  await page.getByLabel('Weight', { exact: true }).fill('70');
  await next(page);

  // Step 3: activity level (saves the profile)
  await expect(page.getByRole('heading', { name: 'Activity Level' })).toBeVisible();
  await page.getByText('Moderately Active', { exact: true }).click();
  await next(page);

  // Step 4: goal — an unsafe timeline is refused by the backend first
  await expect(page.getByRole('heading', { name: 'Your Goal' })).toBeVisible();
  await page.getByText('Lose Weight', { exact: true }).click();
  await page.getByLabel('Target Weight').fill('60');
  await page.getByRole('slider', { name: 'Goal Period' }).fill('4');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('exceeds the safe maximum');

  await page.getByLabel('Target Weight').fill('65');
  await page.getByRole('slider', { name: 'Goal Period' }).fill('10');
  await expect(page.getByText('10 weeks', { exact: true })).toBeVisible();
  await next(page);

  // Step 5: allergies
  await expect(page.getByRole('heading', { name: 'Food Allergies' })).toBeVisible();
  await page.getByText('Peanuts', { exact: true }).click();
  await page.getByLabel('Other allergies (optional)').fill('Kiwi');
  await next(page);

  // Step 6: summary with the backend's targets
  await expect(page.getByRole('heading', { name: 'Your Plan is Ready!' })).toBeVisible();
  await expect(page.getByText(`${EXPECTED.calories} kcal`)).toBeAttached();
  await expect(page.getByText(`${EXPECTED.protein} grams of protein`)).toBeAttached();
  await expect(page.getByText(`${EXPECTED.carbs} grams of carbs`)).toBeAttached();
  await expect(page.getByText(`${EXPECTED.fat} grams of fat`)).toBeAttached();
  await expect(page.getByText('10 weeks to reach your goal')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm & Finish' }).click();

  // App shell opens on Food Log (Flutter's first tab); the dashboard has the same targets.
  await expect(page).toHaveURL(/\/food-log$/);
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: "Today's Overview" })).toBeVisible();
  await expect(page.getByText(`/ ${EXPECTED.calories} kcal`)).toBeVisible();
  await expect(page.getByText(`0/${EXPECTED.protein}g · 0%`)).toBeVisible();
  await expect(page.getByText(`0/${EXPECTED.carbs}g · 0%`)).toBeVisible();
  await expect(page.getByText(`0/${EXPECTED.fat}g · 0%`)).toBeVisible();
  await expect(page.getByText('70 days left')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lose Weight' })).toBeVisible();
  await expect(page.getByRole('table', { name: /Calories in the last 7 days/ })).toBeAttached();

  // Reload keeps the user in the app; log out from Profile and back in lands in the app.
  await page.reload();
  await expect(page.getByRole('heading', { name: "Today's Overview" })).toBeVisible();
  await page.getByRole('link', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await logIn(page, email);
  await expect(page).toHaveURL(/\/food-log$/);
});

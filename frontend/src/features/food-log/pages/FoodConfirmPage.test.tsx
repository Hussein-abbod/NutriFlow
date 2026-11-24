import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeAll, describe, expect, it } from 'vitest';
import type { FoodSubmitRequestDto } from '@/types/api';
import { sessionHandlers } from '@/test/authHandlers';
import {
  buildDayLogs,
  buildFoodLog,
  buildFoodResult,
  buildLogItem,
  buildUser,
  TEST_API,
} from '@/test/fixtures';
import { foodLogHandlers } from '@/test/foodLogHandlers';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';
import { toIsoDay } from '../model/dates';
import { fromFoodResult } from '../model/foodItem';
import type { ConfirmState } from '../schemas/foodLogSchemas';

// The add-food screens are lazy routes; load them once up front.
beforeAll(() => import('../addFoodScreens'));

const user = buildUser({ is_profile_complete: true, daily_calories_target: 2000 });
const today = toIsoDay(new Date());
const confirmUrl = `/food-log/confirm?meal=lunch&date=${today}`;

const rice = fromFoodResult(buildFoodResult({ serving_size: 200 }));
const chicken = fromFoodResult(
  buildFoodResult({
    fdc_id: 2,
    food_name: 'Chicken breast',
    brand_name: 'Farm',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  }),
);
const confirmState: ConfirmState = { items: [rice, chicken], method: 'text', returnSteps: 0 };

function submitHandler(requests: FoodSubmitRequestDto[], fail = false) {
  return http.post(`${TEST_API}/food-log/submit`, async ({ request }) => {
    requests.push((await request.json()) as FoodSubmitRequestDto);
    await delay(30);
    if (fail)
      return HttpResponse.json(
        { detail: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    return HttpResponse.json(
      buildFoodLog({ meal_type: 'lunch', log_date: today, ai_advice: 'Balanced lunch!' }),
    );
  });
}

function renderConfirm(state: unknown = confirmState) {
  server.use(...sessionHandlers(user), ...foodLogHandlers());
  return { ...renderApp(confirmUrl, state), userEvents: userEvent.setup() };
}

const itemsList = () => screen.getByRole('list', { name: 'Foods in this meal' });

describe('FoodConfirmPage', () => {
  it('goes back to the food log when there is nothing to confirm', async () => {
    const { router } = renderConfirm(null);
    await waitFor(() => expect(router.state.location.pathname).toBe('/food-log'));
  });

  it('rejects tampered history state', async () => {
    const { router } = renderConfirm({ ...confirmState, items: [{ ...rice, quantity: -5 }] });
    await waitFor(() => expect(router.state.location.pathname).toBe('/food-log'));
  });

  it('shows the meal totals and each food', async () => {
    renderConfirm();
    expect(await screen.findByRole('heading', { name: 'Confirm Lunch' })).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Total Nutrition' });
    expect(summary).toHaveTextContent('425 kcal');
    expect(summary).toHaveTextContent('Protein36g');
    expect(summary).toHaveTextContent('Carbs56g');
    expect(summary).toHaveTextContent('Fat4g');

    const rows = within(itemsList()).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(
      within(rows[1] as HTMLElement).getByRole('button', {
        name: 'Edit Chicken breast: 100 g 165 kcal',
      }),
    ).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('Farm')).toBeInTheDocument();
  });

  it('edits a portion in the sheet with validation', async () => {
    const { userEvents } = renderConfirm();
    await userEvents.click(
      await screen.findByRole('button', { name: 'Edit Chicken breast: 100 g 165 kcal' }),
    );
    const sheet = screen.getByRole('dialog', { name: 'Edit Chicken breast' });
    const quantity = within(sheet).getByRole('textbox', { name: 'Quantity' });
    const unit = within(sheet).getByRole('combobox', { name: 'Unit' });
    expect(
      within(unit)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['g', 'oz', 'lb', 'piece']);

    await userEvents.clear(quantity);
    await userEvents.type(quantity, '0');
    await userEvents.click(within(sheet).getByRole('button', { name: 'Update' }));
    expect(within(sheet).getByRole('alert')).toHaveTextContent(
      'Enter an amount from 0.01 to 10000.',
    );

    await userEvents.clear(quantity);
    await userEvents.type(quantity, '25');
    await userEvents.selectOptions(unit, 'lb');
    await userEvents.click(within(sheet).getByRole('button', { name: 'Update' }));
    expect(within(sheet).getByRole('alert')).toHaveTextContent(
      'That portion is too large (max 10 kg).',
    );

    await userEvents.clear(quantity);
    await userEvents.type(quantity, '2');
    await userEvents.selectOptions(unit, 'piece');
    expect(within(sheet).getByText('264 kcal · 2 piece')).toBeInTheDocument();
    await userEvents.click(within(sheet).getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      screen.getByRole('button', { name: 'Edit Chicken breast: 2 piece 264 kcal' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Total Nutrition' })).toHaveTextContent('524 kcal');
  });

  it('removes foods and disables Log Meal when none are left', async () => {
    const { userEvents } = renderConfirm();
    await userEvents.click(await screen.findByRole('button', { name: 'Remove Chicken breast' }));
    await userEvents.click(
      screen.getByRole('button', { name: 'Remove Rice, white, long-grain, cooked' }),
    );
    expect(screen.getByText('No foods left. Go back to add some.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log Meal' })).toBeDisabled();
  });

  it('logs the meal and returns to the day with the advice', async () => {
    const requests: FoodSubmitRequestDto[] = [];
    server.use(submitHandler(requests));
    const { router, userEvents } = renderConfirm();

    await userEvents.click(await screen.findByRole('button', { name: 'Log Meal' }));
    expect(screen.getByRole('button', { name: 'Logging meal...' })).toBeDisabled();

    expect(await screen.findByRole('dialog', { name: 'NutriFlow Advice' })).toHaveTextContent(
      'Balanced lunch!',
    );
    expect(router.state.location.pathname).toBe('/food-log');
    expect(requests).toEqual([
      {
        meal_type: 'lunch',
        log_method: 'text',
        log_date: today,
        items: [
          expect.objectContaining({
            food_name: 'Rice, white, long-grain, cooked',
            quantity: 200,
            calories: 260,
          }),
          expect.objectContaining({
            food_name: 'Chicken breast',
            brand_name: 'Farm',
            calories: 165,
            nutritionix_food_id: '2',
          }),
        ],
      },
    ]);
  });

  it('does not let the user leave while the meal is being logged', async () => {
    let release: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(`${TEST_API}/food-log/submit`, async () => {
        await answered;
        return HttpResponse.json(buildFoodLog({ log_date: today, ai_advice: 'Saved!' }));
      }),
    );
    const { router, userEvents } = renderConfirm();
    await userEvents.click(await screen.findByRole('button', { name: 'Log Meal' }));

    await userEvents.click(screen.getByRole('button', { name: 'Back' }));
    await act(() => router.navigate(-1));
    expect(router.state.location.pathname).toBe('/food-log/confirm');
    expect(screen.getByRole('button', { name: 'Logging meal...' })).toBeDisabled();

    release();
    expect(await screen.findByRole('dialog', { name: 'NutriFlow Advice' })).toHaveTextContent(
      'Saved!',
    );
    expect(router.state.location.pathname).toBe('/food-log');
  });

  it('keeps the foods and shows the error when logging fails', async () => {
    server.use(submitHandler([], true));
    const { router, userEvents } = renderConfirm();
    await userEvents.click(await screen.findByRole('button', { name: 'Log Meal' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests');
    expect(router.state.location.pathname).toBe('/food-log/confirm');
    expect(screen.getByRole('button', { name: 'Log Meal' })).toBeEnabled();
  });
});

describe('logging a meal end to end', () => {
  it('food log → search → confirm → back to the updated day with advice', async () => {
    let day = buildDayLogs(today);
    server.use(
      ...sessionHandlers(user),
      http.get(`${TEST_API}/food-log/history`, () => HttpResponse.json(day)),
      http.post(`${TEST_API}/food-log/text`, () => HttpResponse.json([buildFoodResult()])),
      http.post(`${TEST_API}/food-log/submit`, () => {
        const log = buildFoodLog({
          meal_type: 'lunch',
          log_date: today,
          ai_advice: 'Nice!',
          items: [buildLogItem({ calories: 130, quantity: 100 })],
        });
        day = buildDayLogs(today, { lunch: [log] });
        return HttpResponse.json(log);
      }),
    );
    const userEvents = userEvent.setup();
    const { router } = renderApp('/food-log');

    await userEvents.click(await screen.findByRole('button', { name: 'Log your lunch' }));
    await userEvents.click(screen.getByRole('link', { name: /Search by Name/ }));
    await userEvents.type(
      await screen.findByRole('textbox', { name: 'Search food' }),
      'rice{Enter}',
    );
    await userEvents.click(
      await screen.findByRole('button', { name: 'Add Rice, white, long-grain, cooked' }),
    );
    await userEvents.click(screen.getByRole('button', { name: 'Review & Confirm' }));
    await userEvents.click(await screen.findByRole('button', { name: 'Log Meal' }));

    // Back on the food log (two screens popped, like Flutter's popUntil) with the advice.
    expect(await screen.findByRole('dialog', { name: 'NutriFlow Advice' })).toHaveTextContent(
      'Nice!',
    );
    expect(router.state.location.pathname).toBe('/food-log');
    expect(router.state.historyAction).toBe('POP');
    expect(screen.getByRole('region', { name: 'Lunch' })).toHaveTextContent('130 / 700 kcal');
    expect(screen.getByRole('region', { name: 'Calories remaining' })).toHaveTextContent(
      '1870 / 2000',
    );
  });
});

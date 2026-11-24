import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeAll, describe, expect, it } from 'vitest';
import { sessionHandlers } from '@/test/authHandlers';
import { coachServer } from '@/test/coachHandlers';
import { buildDayLogs, buildFoodLog, buildLogItem, buildUser, TEST_API } from '@/test/fixtures';
import { foodLogHandlers } from '@/test/foodLogHandlers';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';
import { addDays, toIsoDay } from '../model/dates';
import { useAdviceStore } from '../store/adviceStore';

// The add-food screens and the coach tab are lazy routes; load them once up front.
beforeAll(() => Promise.all([import('../addFoodScreens'), import('@/features/coach')]));

const user = buildUser({
  full_name: 'Dana Flow',
  is_profile_complete: true,
  daily_calories_target: 2000,
});
const today = toIsoDay(new Date());
const yesterday = toIsoDay(addDays(new Date(), -1));

const riceItem = buildLogItem({
  id: 11,
  food_name: 'Rice, white, cooked',
  quantity: 200,
  unit: 'g',
  calories: 260,
});
const eggItem = buildLogItem({
  id: 12,
  food_name: 'Egg, whole',
  quantity: 2,
  unit: 'large egg',
  calories: 172,
});
const breakfast = buildFoodLog({ id: 1, log_date: today, items: [riceItem, eggItem] });
const todayLogs = buildDayLogs(today, { breakfast: [breakfast] });

function renderFoodLog(days = { [today]: todayLogs }, path = '/food-log') {
  server.use(...sessionHandlers(user), ...foodLogHandlers(days));
  return renderApp(path);
}

const section = (name: string) => screen.getByRole('region', { name }) as HTMLElement;

describe('FoodLogPage', () => {
  it('shows the header, the week strip, calories left and every meal', async () => {
    renderFoodLog();

    expect(await screen.findByRole('heading', { name: 'NutriFlow food log' })).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument(); // avatar initial
    const days = within(screen.getByRole('group', { name: 'Choose a day' })).getAllByRole('button');
    expect(days).toHaveLength(7);
    expect(days[3]).toHaveAttribute('aria-pressed', 'true');
    expect(days[3]).toHaveAccessibleName(/^\w{3} \d{1,2} \w+, today$/);

    const remaining = await screen.findByRole('region', { name: 'Calories remaining' });
    await waitFor(() => expect(remaining).toHaveTextContent('1568 / 2000'));
    expect(within(remaining).getByRole('progressbar', { name: 'Calories eaten' })).toHaveAttribute(
      'aria-valuenow',
      '22',
    );

    const breakfastSection = section('Breakfast');
    expect(breakfastSection).toHaveTextContent('432 / 500 kcal');
    expect(within(breakfastSection).getByText('Rice, white, cooked')).toBeInTheDocument();
    expect(within(breakfastSection).getByText('200 g')).toBeInTheDocument();
    expect(within(breakfastSection).getByText('2 large egg')).toBeInTheDocument();
    expect(
      within(breakfastSection).getByRole('button', { name: 'Add Food to breakfast' }),
    ).toBeInTheDocument();

    expect(section('Lunch')).toHaveTextContent('0 / 700 kcal');
    expect(within(section('Lunch')).getByRole('button', { name: 'Log your lunch' })).toBeVisible();
    expect(section('Snack')).toHaveTextContent('0 / 200 kcal');
    expect(section('Dinner')).toHaveTextContent('0 / 600 kcal');
  });

  it('uses the 2000 kcal default when the user has no target', async () => {
    server.use(...sessionHandlers({ ...user, daily_calories_target: null }), ...foodLogHandlers());
    renderApp('/food-log');
    expect(await screen.findByRole('region', { name: 'Calories remaining' })).toHaveTextContent(
      '2000 / 2000',
    );
  });

  it('loads another day from the strip and keeps it in the URL', async () => {
    const userEvents = userEvent.setup();
    const { router } = renderFoodLog({
      [today]: todayLogs,
      [yesterday]: buildDayLogs(yesterday, {
        dinner: [
          buildFoodLog({
            id: 2,
            meal_type: 'dinner',
            items: [buildLogItem({ id: 21, food_name: 'Soup', calories: 150 })],
          }),
        ],
      }),
    });
    await screen.findByText('Rice, white, cooked');

    const days = within(screen.getByRole('group', { name: 'Choose a day' })).getAllByRole('button');
    await userEvents.click(days[2] as HTMLElement);

    expect(await screen.findByText('Soup')).toBeInTheDocument();
    expect(screen.queryByText('Rice, white, cooked')).not.toBeInTheDocument();
    expect(days[2]).toHaveAttribute('aria-pressed', 'true');
    expect(router.state.location.search).toBe(`?date=${yesterday}`);
  });

  it('shows a spinner while loading and an error with Retry', async () => {
    let failures = 1;
    server.use(
      ...sessionHandlers(user),
      http.get(`${TEST_API}/food-log/history`, async () => {
        await delay(30);
        if (failures-- > 0)
          return HttpResponse.json({ detail: 'Logs unavailable' }, { status: 500 });
        return HttpResponse.json(todayLogs);
      }),
    );
    const userEvents = userEvent.setup();
    renderApp('/food-log');

    expect(await screen.findByRole('progressbar', { name: 'Loading meals' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Logs unavailable');
    await userEvents.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Rice, white, cooked')).toBeInTheDocument();
  });

  it('removes an item after confirmation and reloads the day', async () => {
    let current = todayLogs;
    const deleted: string[] = [];
    server.use(
      ...sessionHandlers(user),
      http.get(`${TEST_API}/food-log/history`, () => HttpResponse.json(current)),
      http.delete(`${TEST_API}/food-log/item/:itemId`, ({ params }) => {
        deleted.push(String(params.itemId));
        current = buildDayLogs(today, {
          breakfast: [buildFoodLog({ id: 1, items: [eggItem] })],
        });
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const userEvents = userEvent.setup();
    renderApp('/food-log');

    await userEvents.click(
      await screen.findByRole('button', { name: 'Remove Rice, white, cooked' }),
    );
    const dialog = screen.getByRole('alertdialog', { name: 'Remove item?' });
    expect(dialog).toHaveTextContent('Remove Rice, white, cooked?');

    await userEvents.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(deleted).toEqual([]);

    await userEvents.click(screen.getByRole('button', { name: 'Remove Rice, white, cooked' }));
    await userEvents.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(screen.queryByText('Rice, white, cooked')).not.toBeInTheDocument());
    expect(deleted).toEqual(['11']);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(section('Breakfast')).toHaveTextContent('172 / 500 kcal');
  });

  it('reports a failed delete', async () => {
    server.use(
      http.delete(`${TEST_API}/food-log/item/:itemId`, () =>
        HttpResponse.json({ detail: 'Item not found.' }, { status: 404 }),
      ),
    );
    const userEvents = userEvent.setup();
    renderFoodLog();

    await userEvents.click(await screen.findByRole('button', { name: 'Remove Egg, whole' }));
    await userEvents.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Item not found.');
    expect(screen.getByText('Egg, whole')).toBeInTheDocument();
  });

  it('opens the add-food sheet with the three ways to log', async () => {
    const userEvents = userEvent.setup();
    const { router } = renderFoodLog();

    await userEvents.click(await screen.findByRole('button', { name: 'Log your lunch' }));
    const sheet = screen.getByRole('dialog', { name: 'Add food to Lunch' });
    expect(within(sheet).getByRole('heading', { name: 'Add Food to Lunch' })).toBeInTheDocument();
    const query = `meal=lunch&date=${today}`;
    expect(within(sheet).getByRole('link', { name: /Barcode Scanner/ })).toHaveAttribute(
      'href',
      `/food-log/add/barcode?${query}`,
    );
    expect(within(sheet).getByRole('link', { name: /Log by Photo/ })).toHaveAttribute(
      'href',
      `/food-log/add/photo?${query}`,
    );

    await userEvents.click(within(sheet).getByRole('link', { name: /Search by Name/ }));
    expect(router.state.location.pathname).toBe('/food-log/add/search');
    expect(await screen.findByRole('heading', { name: 'Search Food' })).toBeInTheDocument();
  });

  it('shows the advice of the meal just logged once', async () => {
    const userEvents = userEvent.setup();
    act(() => useAdviceStore.getState().setLastSubmittedLog(breakfast));
    renderFoodLog();

    const sheet = await screen.findByRole('dialog', { name: 'NutriFlow Advice' });
    expect(within(sheet).getByText('Great start! Add some protein at lunch.')).toBeInTheDocument();
    expect(within(sheet).getByText('432 kcal')).toBeInTheDocument();
    await waitFor(() => expect(within(sheet).getByText('1568 kcal')).toBeInTheDocument());

    await userEvents.click(within(sheet).getByRole('button', { name: 'Got it!' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(useAdviceStore.getState().lastSubmittedLog).toBeNull();
  });

  it('takes the meal to the coach, which starts the chat about its advice', async () => {
    const userEvents = userEvent.setup();
    const coach = coachServer([], {
      adviceByLogId: { 1: 'Great start! Add some protein at lunch.' },
    });
    server.use(...coach.handlers);
    act(() => useAdviceStore.getState().setLastSubmittedLog(breakfast));
    const { router } = renderFoodLog();

    await userEvents.click(await screen.findByRole('button', { name: 'Discuss with Coach AI' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/coach'));
    const conversation = await screen.findByRole('list', { name: 'Conversation with Coach AI' });
    expect(conversation).toHaveTextContent('Great start! Add some protein at lunch.');
    expect(await within(conversation).findByText('Happy to talk about this meal.')).toBeVisible();
    expect(coach.requests).toEqual([{ food_log_id: 1 }]);
    expect(router.state.location.state).toBeNull(); // a reload does not ask again
  });

  it('falls back to today for an invalid date in the URL', async () => {
    renderFoodLog(undefined, '/food-log?date=2026-02-31');
    expect(await screen.findByText('Rice, white, cooked')).toBeInTheDocument();
  });
});

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { SnackbarHost } from '@/components';
import type { TextSearchRequestDto } from '@/types/api';
import { buildFoodResult, TEST_API } from '@/test/fixtures';
import { renderWithQuery } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { TextSearchPanel } from './TextSearchPanel';

const rice = buildFoodResult();
const chicken = buildFoodResult({
  fdc_id: 2,
  food_name: 'Chicken Strips',
  brand_name: 'E2E Foods',
  serving_size: 85,
  calories: 165,
});

function searchReturns(results = [rice, chicken], requests: TextSearchRequestDto[] = []) {
  server.use(
    http.post(`${TEST_API}/food-log/text`, async ({ request }) => {
      requests.push((await request.json()) as TextSearchRequestDto);
      await delay(20);
      return HttpResponse.json(results);
    }),
  );
  return requests;
}

function renderPanel() {
  const onReview = vi.fn();
  renderWithQuery(
    <>
      <TextSearchPanel meal="lunch" onReview={onReview} />
      <SnackbarHost />
    </>,
  );
  return { onReview, user: userEvent.setup() };
}

const searchBox = () => screen.getByRole('textbox', { name: 'Search food' });

describe('TextSearchPanel', () => {
  it('starts empty and validates the query before searching', async () => {
    const requests = searchReturns();
    const { user } = renderPanel();
    expect(screen.getByText('Search for food above')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Type a food to search for.')).toBeInTheDocument();
    expect(searchBox()).toHaveAttribute('aria-invalid', 'true');
    expect(requests).toEqual([]);
  });

  it('searches USDA and lists results with kcal per portion', async () => {
    const requests = searchReturns();
    const { user } = renderPanel();

    await user.type(searchBox(), '  rice {Enter}');
    expect(await screen.findByRole('progressbar', { name: 'Searching' })).toBeInTheDocument();

    const results = await screen.findByRole('list', { name: 'Search results' });
    expect(within(results).getAllByRole('listitem')).toHaveLength(2);
    expect(within(results).getByText('130 kcal / 100 g')).toBeInTheDocument();
    expect(within(results).getByText('E2E Foods · 140 kcal / 85 g')).toBeInTheDocument();
    expect(requests).toEqual([{ query: 'rice', meal_type: 'lunch', use_ai_parse: false }]);
  });

  it('lets the AI parse a whole meal description', async () => {
    const requests = searchReturns([rice]);
    const { user } = renderPanel();

    await user.type(searchBox(), '2 eggs and toast');
    await user.click(screen.getByRole('button', { name: 'AI Parse' }));

    await screen.findByRole('list', { name: 'Search results' });
    expect(requests).toEqual([
      { query: '2 eggs and toast', meal_type: 'lunch', use_ai_parse: true },
    ]);
  });

  it('says when nothing was found', async () => {
    searchReturns([]);
    const { user } = renderPanel();
    await user.type(searchBox(), 'zzz{Enter}');
    expect(await screen.findByText(/No foods found for “zzz”/)).toBeInTheDocument();
  });

  it('shows the server error and retries the same search', async () => {
    let calls = 0;
    server.use(
      http.post(`${TEST_API}/food-log/text`, () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              { detail: 'The food database is not available right now. Please try again.' },
              { status: 503 },
            )
          : HttpResponse.json([rice]);
      }),
    );
    const { user } = renderPanel();
    await user.type(searchBox(), 'rice{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('food database is not available');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('list', { name: 'Search results' })).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it('collects foods and sends them to review', async () => {
    searchReturns();
    const { user, onReview } = renderPanel();
    await user.type(searchBox(), 'rice{Enter}');

    await user.click(
      await screen.findByRole('button', { name: 'Add Rice, white, long-grain, cooked' }),
    );
    expect(await screen.findByText('Rice, white, long-grain, cooked added')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Chicken Strips' }));
    await user.click(screen.getByRole('button', { name: 'Add Chicken Strips' }));
    expect(screen.getByText('3 item(s) selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Review & Confirm' }));
    const [items] = onReview.mock.calls[0] as [{ foodName: string; key: string }[]];
    expect(items.map((item) => item.foodName)).toEqual([
      'Rice, white, long-grain, cooked',
      'Chicken Strips',
      'Chicken Strips',
    ]);
    expect(new Set(items.map((item) => item.key)).size).toBe(3);
  });

  it('clears the query and the results', async () => {
    searchReturns();
    const { user } = renderPanel();
    await user.type(searchBox(), 'rice{Enter}');
    await screen.findByRole('list', { name: 'Search results' });

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(searchBox()).toHaveValue('');
    expect(screen.getByText('Search for food above')).toBeInTheDocument();
  });
});

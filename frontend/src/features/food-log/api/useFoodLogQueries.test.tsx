import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { dashboardKeys } from '@/features/dashboard/api/queryKeys';
import {
  buildDayLogs,
  buildFoodLog,
  buildFoodResult,
  buildTodaySummary,
  TEST_API,
} from '@/test/fixtures';
import { foodLogHandlers } from '@/test/foodLogHandlers';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { foodLogKeys } from './queryKeys';
import {
  useDayLogs,
  useDeleteFoodItem,
  useIdentifyImage,
  useLookupBarcode,
  useSearchFoods,
  useSubmitFoodLog,
} from './useFoodLogQueries';

function setup() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('food-log query hooks', () => {
  it('loads one day from /history', async () => {
    const day = buildDayLogs('2026-11-20', { snack: [buildFoodLog({ meal_type: 'snack' })] });
    server.use(...foodLogHandlers({ '2026-11-20': day }));
    const { wrapper } = setup();
    const { result } = renderHook(() => useDayLogs('2026-11-20'), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(day));
  });

  /** A cached but unmounted day (the tab is hidden behind the confirm screen) + dashboard. */
  async function cachedDayAndDashboard() {
    const counter = { dayRequests: 0 };
    server.use(
      http.get(`${TEST_API}/food-log/history`, () => {
        counter.dayRequests += 1;
        return HttpResponse.json(buildDayLogs('2026-11-24'));
      }),
      http.post(`${TEST_API}/food-log/submit`, () => HttpResponse.json(buildFoodLog())),
      http.delete(`${TEST_API}/food-log/item/11`, () => new HttpResponse(null, { status: 204 })),
    );
    const { queryClient, wrapper } = setup();
    await queryClient.prefetchQuery({
      queryKey: foodLogKeys.day('2026-11-24'),
      queryFn: () =>
        fetch(`${TEST_API}/food-log/history?log_date=2026-11-24`).then((r) => r.json()),
    });
    queryClient.setQueryData(dashboardKeys.today(), buildTodaySummary());
    return { counter, queryClient, wrapper };
  }

  it('refreshes the food log and the dashboard after a submit', async () => {
    const { counter, queryClient, wrapper } = await cachedDayAndDashboard();
    const { result } = renderHook(() => useSubmitFoodLog(), { wrapper });
    await act(() =>
      result.current.mutateAsync({
        meal_type: 'lunch',
        log_method: 'text',
        log_date: '2026-11-24',
        items: [],
      }),
    );
    expect(counter.dayRequests).toBe(2); // refetched even though no screen shows it
    expect(queryClient.getQueryState(dashboardKeys.today())?.isInvalidated).toBe(true);
  });

  it('refreshes the food log and the dashboard after a delete', async () => {
    const { counter, queryClient, wrapper } = await cachedDayAndDashboard();
    const { result } = renderHook(() => useDeleteFoodItem(), { wrapper });
    await act(() => result.current.mutateAsync(11));
    expect(counter.dayRequests).toBe(2);
    expect(queryClient.getQueryState(dashboardKeys.today())?.isInvalidated).toBe(true);
  });

  it('maps lookup results to food items', async () => {
    server.use(
      http.post(`${TEST_API}/food-log/text`, () => HttpResponse.json([buildFoodResult()])),
      http.post(`${TEST_API}/food-log/barcode`, () =>
        HttpResponse.json(buildFoodResult({ serving_size: 85 })),
      ),
      http.post(`${TEST_API}/food-log/image`, () => HttpResponse.json([buildFoodResult()])),
    );
    const { wrapper } = setup();
    const search = renderHook(() => useSearchFoods(), { wrapper }).result;
    const barcode = renderHook(() => useLookupBarcode(), { wrapper }).result;
    const image = renderHook(() => useIdentifyImage(), { wrapper }).result;

    const [foods, product, identified] = await act(() =>
      Promise.all([
        search.current.mutateAsync({ query: 'rice', meal: 'lunch', useAiParse: false }),
        barcode.current.mutateAsync('012345678905'),
        image.current.mutateAsync({ imageBase64: 'abc', meal: 'lunch' }),
      ]),
    );
    expect(foods[0]).toMatchObject({ foodName: 'Rice, white, long-grain, cooked', quantity: 100 });
    expect(product).toMatchObject({ quantity: 85, per100g: { calories: 130 } });
    expect(identified).toHaveLength(1);
  });
});

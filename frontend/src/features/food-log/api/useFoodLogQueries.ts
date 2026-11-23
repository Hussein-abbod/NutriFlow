import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// Only the query keys: the dashboard feature's index would pull its lazy chart bundle in.
import { dashboardKeys } from '@/features/dashboard/api/queryKeys';
import type { FoodSubmitRequestDto, MealType } from '@/types/api';
import { fromFoodResult } from '../model/foodItem';
import { foodLogApi } from './foodLogApi';
import { foodLogKeys } from './queryKeys';

/** One day's logs grouped by meal (FoodLogProvider.loadDate). */
export function useDayLogs(isoDay: string) {
  return useQuery({
    queryKey: foodLogKeys.day(isoDay),
    queryFn: ({ signal }) => foodLogApi.day(isoDay, signal),
  });
}

/**
 * After a meal changes, the food log (also the unmounted tab, so it is fresh when the user
 * goes back to it) and the dashboard are reloaded.
 */
function useRefreshAfterLogChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: foodLogKeys.all, refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    ]);
}

/** POST /food-log/submit: the saved meal comes back with the AI advice. */
export function useSubmitFoodLog() {
  const refresh = useRefreshAfterLogChange();
  return useMutation({
    mutationFn: (body: FoodSubmitRequestDto) => foodLogApi.submit(body),
    onSuccess: refresh,
  });
}

/** DELETE /food-log/item/{id} */
export function useDeleteFoodItem() {
  const refresh = useRefreshAfterLogChange();
  return useMutation({
    mutationFn: (itemId: number) => foodLogApi.deleteItem(itemId),
    onSuccess: refresh,
  });
}

/** POST /food-log/text: USDA search, or AI parsing of a meal description. */
export function useSearchFoods() {
  return useMutation({
    mutationFn: async (input: { query: string; meal: MealType; useAiParse: boolean }) => {
      const results = await foodLogApi.searchText({
        query: input.query,
        meal_type: input.meal,
        use_ai_parse: input.useAiParse,
      });
      return results.map(fromFoodResult);
    },
  });
}

/** POST /food-log/barcode */
export function useLookupBarcode() {
  return useMutation({
    mutationFn: async (barcode: string) =>
      fromFoodResult(await foodLogApi.lookupBarcode({ barcode })),
  });
}

/** POST /food-log/image */
export function useIdentifyImage() {
  return useMutation({
    mutationFn: async (input: { imageBase64: string; meal: MealType }) => {
      const results = await foodLogApi.identifyImage({
        image_base64: input.imageBase64,
        meal_type: input.meal,
      });
      return results.map(fromFoodResult);
    },
  });
}

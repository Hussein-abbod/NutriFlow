import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { showSnackbar } from '@/components';
import type { MealType } from '@/types/api';
import { useSearchFoods } from '../api/useFoodLogQueries';
import { duplicateItem, type FoodItem } from '../model/foodItem';
import { textSearchSchema, type TextSearchForm } from '../schemas/foodLogSchemas';
import { FOOD_LIMITS } from '../schemas/limits';

/** Flutter shows "<food> added" for one second. */
const ADDED_SNACKBAR_MS = 1000;

/** TextFoodScreen state: the query form, USDA / AI results and the foods picked so far. */
export function useTextSearch(meal: MealType) {
  const search = useSearchFoods();
  const [selected, setSelected] = useState<FoodItem[]>([]);
  const form = useForm<TextSearchForm>({
    resolver: zodResolver(textSearchSchema),
    defaultValues: { query: '' },
  });

  /** Submit handler for the plain search (`useAiParse: false`) or the AI parse button. */
  const submitSearch = (useAiParse: boolean) =>
    form.handleSubmit(({ query }) => {
      if (search.isPending) return;
      search.mutate({ query: query.trim(), meal, useAiParse });
    });

  const retry = () => {
    if (search.variables) search.mutate(search.variables);
  };

  const clear = () => {
    form.reset({ query: '' });
    search.reset();
  };

  const add = (item: FoodItem) => {
    if (selected.length >= FOOD_LIMITS.maxItemsPerLog) {
      showSnackbar(`You can log up to ${FOOD_LIMITS.maxItemsPerLog} foods at once.`, 'error');
      return;
    }
    setSelected((current) => [...current, duplicateItem(item)]);
    showSnackbar(`${item.foodName} added`, 'default', ADDED_SNACKBAR_MS);
  };

  return { form, search, submitSearch, retry, clear, selected, add };
}

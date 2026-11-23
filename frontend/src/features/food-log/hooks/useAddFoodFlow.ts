import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { LogMethod } from '@/types/api';
import type { FoodItem } from '../model/foodItem';
import { addFoodUrl, foodLogPaths, isOpenedFromLog, type AddFoodTarget } from '../paths';
import { addFoodParamsSchema, type ConfirmState } from '../schemas/foodLogSchemas';

/** `?meal=&date=` of the add-food screens, or null when missing / invalid. */
export function useAddFoodTarget(): AddFoodTarget | null {
  const [searchParams] = useSearchParams();
  const parsed = addFoodParamsSchema.safeParse({
    meal: searchParams.get('meal'),
    date: searchParams.get('date'),
  });
  return parsed.success ? parsed.data : null;
}

/** Back like the app-bar arrow: the previous screen, or `fallback` after a deep link / reload. */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (location.key === 'default') void navigate(fallback, { replace: true });
    else void navigate(-1);
  };
}

/** From a search / barcode / photo screen to "Review & Confirm" with the chosen foods. */
export function useOpenConfirm(target: AddFoodTarget | null, method: LogMethod) {
  const navigate = useNavigate();
  const location = useLocation();
  return (items: FoodItem[]) => {
    if (!target || items.length === 0) return;
    const state: ConfirmState = {
      items,
      method,
      returnSteps: isOpenedFromLog(location.state) ? 2 : 0,
    };
    void navigate(addFoodUrl(foodLogPaths.confirm, target), { state });
  };
}

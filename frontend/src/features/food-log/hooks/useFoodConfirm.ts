import { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router';
import { showSnackbar } from '@/components';
import { getErrorMessage } from '@/lib/api';
import { useSubmitFoodLog } from '../api/useFoodLogQueries';
import { toIsoDay } from '../model/dates';
import { toSubmitItem, totalNutrition, type FoodItem } from '../model/foodItem';
import { foodLogUrl, type AddFoodTarget } from '../paths';
import type { ConfirmState } from '../schemas/foodLogSchemas';
import { useAdviceStore } from '../store/adviceStore';

/**
 * FoodConfirmScreen: edit / remove the chosen foods, then log them. On success the advice
 * is handed to the food log (which shows it) and the user returns there, like Flutter's
 * `popUntil(isFirst)`.
 *
 * While the meal is being logged (the AI advice can take a while) leaving the screen is
 * blocked, Back button and browser Back alike: otherwise the meal is saved without any
 * feedback and the user may log it twice.
 */
export function useFoodConfirm(target: AddFoodTarget, initial: ConfirmState) {
  const navigate = useNavigate();
  const submitLog = useSubmitFoodLog();
  const setLastSubmittedLog = useAdviceStore((state) => state.setLastSubmittedLog);
  const [items, setItems] = useState<FoodItem[]>(initial.items);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  // A ref, not `isPending`: it must be false *before* our own navigation in onSuccess.
  const submittingRef = useRef(false);
  const blocker = useBlocker(() => submittingRef.current);

  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker]);

  const submit = () => {
    if (items.length === 0 || submittingRef.current) return;
    submittingRef.current = true;
    submitLog.mutate(
      {
        meal_type: target.meal,
        log_method: initial.method,
        log_date: target.date,
        items: items.map(toSubmitItem),
      },
      {
        onSettled: () => {
          submittingRef.current = false;
        },
        onSuccess: (log) => {
          submittingRef.current = false;
          setLastSubmittedLog(log);
          if (initial.returnSteps > 0) void navigate(-initial.returnSteps);
          else void navigate(foodLogUrl(target.date, toIsoDay(new Date())), { replace: true });
        },
        onError: (error) => showSnackbar(getErrorMessage(error), 'error'),
      },
    );
  };

  return {
    items,
    totals: totalNutrition(items),
    editing: items.find((item) => item.key === editingKey) ?? null,
    startEditing: (key: string) => setEditingKey(key),
    stopEditing: () => setEditingKey(null),
    updateItem: (updated: FoodItem) =>
      setItems((current) => current.map((item) => (item.key === updated.key ? updated : item))),
    removeItem: (key: string) => setItems((current) => current.filter((item) => item.key !== key)),
    submit,
    submitting: submitLog.isPending,
  };
}

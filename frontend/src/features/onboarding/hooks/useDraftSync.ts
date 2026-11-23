import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

/** Report every change of a step's form, so Back / Next never loses what the user typed. */
export function useDraftSync<TValues extends FieldValues, TOutput>(
  form: Pick<UseFormReturn<TValues, unknown, TOutput>, 'watch' | 'getValues'>,
  onDraftChange: (values: TValues) => void,
) {
  const latest = useRef(onDraftChange);
  useEffect(() => {
    latest.current = onDraftChange;
  });
  const { watch, getValues } = form;
  useEffect(() => {
    const subscription = watch(() => latest.current(getValues()));
    return () => subscription.unsubscribe();
  }, [watch, getValues]);
}

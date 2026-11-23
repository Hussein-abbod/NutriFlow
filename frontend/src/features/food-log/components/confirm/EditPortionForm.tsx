import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components';
import { cn } from '@/lib/utils/cn';
import {
  availableUnits,
  formatQuantity,
  portionNutrition,
  withPortion,
  type FoodItem,
} from '../../model/foodItem';
import { portionSchema, type PortionForm } from '../../schemas/foodLogSchemas';
import styles from './EditPortionForm.module.css';

export interface EditPortionFormProps {
  item: FoodItem;
  onSave: (item: FoodItem) => void;
}

/** Quantity + unit with a live kcal preview; "Update" saves a valid portion. */
export function EditPortionForm({ item, onSave }: EditPortionFormProps) {
  const units = useMemo(() => availableUnits(item), [item]);
  const schema = useMemo(() => portionSchema(units), [units]);
  const form = useForm<PortionForm, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: formatQuantity(item.quantity), unit: item.unit },
  });
  const quantityId = useId();
  const unitId = useId();
  const errorId = useId();

  const [quantityText, unit] = form.watch(['quantity', 'unit']);
  const typed = Number(quantityText);
  const preview = withPortion(
    item,
    Number.isFinite(typed) && typed > 0 ? typed : item.quantity,
    unit,
  );
  const error = form.formState.errors.quantity?.message ?? form.formState.errors.unit?.message;

  return (
    <form
      noValidate
      onSubmit={(event) =>
        void form.handleSubmit(({ quantity, unit: chosenUnit }) =>
          onSave(withPortion(item, quantity, chosenUnit)),
        )(event)
      }
    >
      <p className={styles.preview} aria-live="polite">
        {Math.round(portionNutrition(preview).calories)} kcal · {formatQuantity(preview.quantity)}{' '}
        {preview.unit}
      </p>

      <div className={styles.fields}>
        <label htmlFor={quantityId} className="visually-hidden">
          Quantity
        </label>
        <input
          id={quantityId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={cn(styles.input, styles.quantity)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...form.register('quantity')}
        />
        <label htmlFor={unitId} className="visually-hidden">
          Unit
        </label>
        <select id={unitId} className={cn(styles.input, styles.unit)} {...form.register('unit')}>
          {units.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button type="submit" variant="gradient" fullWidth className={styles.update}>
        Update
      </Button>
    </form>
  );
}

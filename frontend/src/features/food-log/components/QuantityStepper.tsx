import { Icon } from '@/components';
import { cn } from '@/lib/utils/cn';
import { formatQuantity, quantityInGrams, quantityStep } from '../model/foodItem';
import { FOOD_LIMITS } from '../schemas/limits';
import styles from './QuantityStepper.module.css';

export interface QuantityStepperProps {
  foodName: string;
  quantity: number;
  unit: string;
  onChange: (quantity: number) => void;
  /** `large`: the barcode result card (filled 32px icons, 20px value). */
  size?: 'compact' | 'large';
}

function canIncrease(quantity: number, unit: string): boolean {
  return (
    quantity <= FOOD_LIMITS.quantityMax &&
    quantityInGrams(quantity, unit) <= FOOD_LIMITS.portionGramsMax
  );
}

/** − amount + : steps of 10 for g / ml, 1 for other units; never reaches 0. */
export function QuantityStepper({
  foodName,
  quantity,
  unit,
  onChange,
  size = 'compact',
}: QuantityStepperProps) {
  const step = quantityStep(unit);
  const large = size === 'large';
  return (
    <div
      className={cn(styles.stepper, large && styles.large)}
      role="group"
      aria-label={`Amount of ${foodName}`}
    >
      <button
        type="button"
        className={styles.button}
        aria-label={`Less ${foodName}`}
        disabled={quantity <= step}
        onClick={() => onChange(quantity - step)}
      >
        <Icon name={large ? 'removeCircle' : 'removeCircleOutline'} size={large ? 32 : 24} />
      </button>
      <output className={styles.value} aria-live="polite">
        {formatQuantity(quantity)} {unit}
      </output>
      <button
        type="button"
        className={styles.button}
        aria-label={`More ${foodName}`}
        disabled={!canIncrease(quantity + step, unit)}
        onClick={() => onChange(quantity + step)}
      >
        <Icon name={large ? 'addCircle' : 'addCircleOutline'} size={large ? 32 : 24} />
      </button>
    </div>
  );
}

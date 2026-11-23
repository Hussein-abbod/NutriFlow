import { Button, Icon } from '@/components';
import { portionNutrition, type FoodItem } from '../../model/foodItem';
import { QuantityStepper } from '../QuantityStepper';
import styles from './IdentifiedFoodsList.module.css';

export interface IdentifiedFoodsListProps {
  items: readonly FoodItem[];
  onQuantityChange: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onReview: () => void;
}

/** `_FoodItemsList`: each food the AI found with a stepper and kcal, then Review & Confirm. */
export function IdentifiedFoodsList({
  items,
  onQuantityChange,
  onRemove,
  onReview,
}: IdentifiedFoodsListProps) {
  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.key} className={styles.card}>
            <div className={styles.titleRow}>
              <p className={styles.name}>{item.foodName}</p>
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remove ${item.foodName}`}
                onClick={() => onRemove(item.key)}
              >
                <Icon name="deleteOutline" size={20} />
              </button>
            </div>
            {item.brandName && <p className={styles.brand}>{item.brandName}</p>}
            <div className={styles.portionRow}>
              <QuantityStepper
                foodName={item.foodName}
                quantity={item.quantity}
                unit={item.unit}
                onChange={(quantity) => onQuantityChange(item.key, quantity)}
              />
              <span className={styles.calories}>
                {Math.round(portionNutrition(item).calories)} kcal
              </span>
            </div>
          </li>
        ))}
      </ul>
      <Button
        variant="gradient"
        fullWidth
        className={styles.review}
        disabled={items.length === 0}
        onClick={onReview}
      >
        Review &amp; Confirm
      </Button>
    </div>
  );
}

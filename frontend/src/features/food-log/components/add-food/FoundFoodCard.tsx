import { Button } from '@/components';
import { portionNutrition, type FoodItem } from '../../model/foodItem';
import { QuantityStepper } from '../QuantityStepper';
import styles from './FoundFoodCard.module.css';

export interface FoundFoodCardProps {
  item: FoodItem;
  onQuantityChange: (quantity: number) => void;
  onRescan: () => void;
  onConfirm: () => void;
}

/** `_FoundFoodCard`: the scanned product, its amount and kcal, Rescan / Confirm. */
export function FoundFoodCard({ item, onQuantityChange, onRescan, onConfirm }: FoundFoodCardProps) {
  return (
    <section className={styles.card} aria-labelledby="found-food-name">
      <h2 id="found-food-name" className={styles.name}>
        {item.foodName}
      </h2>
      {item.brandName && <p className={styles.brand}>{item.brandName}</p>}
      <div className={styles.stepper}>
        <QuantityStepper
          size="large"
          foodName={item.foodName}
          quantity={item.quantity}
          unit={item.unit}
          onChange={onQuantityChange}
        />
      </div>
      <p className={styles.calories}>{Math.round(portionNutrition(item).calories)} kcal</p>
      <div className={styles.actions}>
        <Button variant="outlined" onClick={onRescan}>
          Rescan
        </Button>
        <Button variant="gradient" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </section>
  );
}

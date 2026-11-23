import { Icon } from '@/components';
import { formatQuantity, portionNutrition, type FoodItem } from '../../model/foodItem';
import styles from './ConfirmItemRow.module.css';

export interface ConfirmItemRowProps {
  item: FoodItem;
  onEdit: () => void;
  onRemove: () => void;
}

/** One food on FoodConfirmScreen: tap the portion pill to edit it, × to drop the food. */
export function ConfirmItemRow({ item, onEdit, onRemove }: ConfirmItemRowProps) {
  const portion = `${formatQuantity(item.quantity)} ${item.unit}`;
  const calories = Math.round(portionNutrition(item).calories);
  return (
    <div className={styles.row}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name="restaurant" size={18} />
      </span>
      <div className={styles.text}>
        <p className={styles.name}>{item.foodName}</p>
        {item.brandName && <p className={styles.brand}>{item.brandName}</p>}
      </div>
      <button type="button" className={styles.portion} onClick={onEdit}>
        <span className="visually-hidden">Edit {item.foodName}: </span>
        <span className={styles.portionText}>
          <span className={styles.amount}>{portion}</span>{' '}
          <span className={styles.kcal}>{calories} kcal</span>
        </span>
        <Icon name="edit" size={14} className={styles.editIcon} />
      </button>
      <button
        type="button"
        className={styles.remove}
        aria-label={`Remove ${item.foodName}`}
        onClick={onRemove}
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}

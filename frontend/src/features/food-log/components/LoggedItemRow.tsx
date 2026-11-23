import { Icon } from '@/components';
import type { FoodLogItemDto } from '@/types/api';
import styles from './LoggedItemRow.module.css';

export interface LoggedItemRowProps {
  item: FoodLogItemDto;
  onRemove: (item: FoodLogItemDto) => void;
}

/** `_FoodItemTile`: name, portion, a kcal pill and a remove (×) button. */
export function LoggedItemRow({ item, onRemove }: LoggedItemRowProps) {
  const portion =
    `${item.quantity === null ? '' : Math.round(item.quantity)} ${item.unit ?? ''}`.trim();
  return (
    <li className={styles.row}>
      <div className={styles.text}>
        <p className={styles.name} title={item.food_name}>
          {item.food_name}
        </p>
        {portion && <p className={styles.portion}>{portion}</p>}
      </div>
      <span className={styles.calories}>
        {Math.round(item.calories ?? 0)}
        <span className="visually-hidden"> kcal</span>
      </span>
      <button
        type="button"
        className={styles.remove}
        aria-label={`Remove ${item.food_name}`}
        onClick={() => onRemove(item)}
      >
        <Icon name="close" size={16} />
      </button>
    </li>
  );
}

import { Icon } from '@/components';
import { formatQuantity, portionNutrition, type FoodItem } from '../../model/foodItem';
import styles from './SearchResultsList.module.css';

export interface SearchResultsListProps {
  results: readonly FoodItem[];
  onAdd: (item: FoodItem) => void;
}

function describe(item: FoodItem): string {
  const calories = `${Math.round(portionNutrition(item).calories)} kcal / ${formatQuantity(item.quantity)} ${item.unit}`;
  return item.brandName ? `${item.brandName} · ${calories}` : calories;
}

/** Result cards of TextFoodScreen: icon, name, "brand · kcal / portion" and an add button. */
export function SearchResultsList({ results, onAdd }: SearchResultsListProps) {
  return (
    <ul className={styles.list} aria-label="Search results">
      {results.map((item) => (
        <li key={item.key} className={styles.card}>
          <span className={styles.badge} aria-hidden="true">
            <Icon name="restaurant" />
          </span>
          <div className={styles.text}>
            <p className={styles.name}>{item.foodName}</p>
            <p className={styles.detail}>{describe(item)}</p>
          </div>
          <button
            type="button"
            className={styles.add}
            aria-label={`Add ${item.foodName}`}
            onClick={() => onAdd(item)}
          >
            <Icon name="add" size={20} />
          </button>
        </li>
      ))}
    </ul>
  );
}

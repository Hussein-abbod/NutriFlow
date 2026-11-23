import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import { cn } from '@/lib/utils/cn';
import type { MealSummaryDto } from '@/types/api';
import styles from './MealCard.module.css';

export interface MealCardProps {
  name: string;
  icon: IconName;
  meal: MealSummaryDto;
}

/** `_MealCard`: primary colour, or coral once the meal goes over its share of the target. */
export function MealCard({ name, icon, meal }: MealCardProps) {
  const isOver = meal.calories > meal.target;
  return (
    <li className={cn(styles.card, isOver && styles.over)}>
      <h3 className={styles.name}>
        <Icon name={icon} size={18} className={styles.icon} />
        {name}
      </h3>
      <div className={styles.values}>
        <p className={styles.calories}>{Math.round(meal.calories)} kcal</p>
        <p className={styles.target}>
          Target: {Math.round(meal.target)}
          {isOver && <span className="visually-hidden"> (over target)</span>}
        </p>
      </div>
    </li>
  );
}

import { useId } from 'react';
import { Icon } from '@/components';
import { cn } from '@/lib/utils/cn';
import type { FoodLogDto, FoodLogItemDto } from '@/types/api';
import type { MealConfig } from '../model/meals';
import { LoggedItemRow } from './LoggedItemRow';
import styles from './MealSection.module.css';

export interface MealSectionProps {
  meal: MealConfig;
  calorieTarget: number;
  logs: readonly FoodLogDto[];
  onAdd: () => void;
  onRemove: (item: FoodLogItemDto) => void;
}

/** `_MealSection`: header with kcal / target, the logged items or a "Log your …" button. */
export function MealSection({ meal, calorieTarget, logs, onAdd, onRemove }: MealSectionProps) {
  const headingId = useId();
  const items = logs.flatMap((log) => log.items);
  const consumed = logs.reduce((sum, log) => sum + (log.total_calories ?? 0), 0);
  const hasItems = items.length > 0;

  return (
    <section className={styles.card} data-meal={meal.type} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h2 id={headingId} className={styles.title}>
          <Icon name={meal.icon} size={22} className={styles.icon} />
          {meal.label}
        </h2>
        <p className={cn(styles.calories, hasItems && styles.caloriesActive)}>
          {Math.round(consumed)} / {Math.round(calorieTarget)} kcal
        </p>
      </div>
      <hr className={styles.divider} />

      {hasItems ? (
        <>
          <ul className={styles.items}>
            {items.map((item) => (
              <LoggedItemRow key={item.id} item={item} onRemove={onRemove} />
            ))}
          </ul>
          <button type="button" className={styles.addFood} onClick={onAdd}>
            <Icon name="addCircle" size={18} />
            Add Food<span className="visually-hidden"> to {meal.label.toLowerCase()}</span>
          </button>
        </>
      ) : (
        <button type="button" className={styles.empty} onClick={onAdd}>
          <Icon name="search" size={20} className={styles.emptyIcon} />
          Log your {meal.label.toLowerCase()}
        </button>
      )}
    </section>
  );
}

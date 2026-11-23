import type { IconName } from '@/components/Icon/icons';
import type { MealSummaryDto, MealType, TodaySummaryDto } from '@/types/api';
import { MealCard } from './MealCard';
import styles from './MealBreakdown.module.css';

const MEALS: readonly { type: MealType; name: string; icon: IconName }[] = [
  { type: 'breakfast', name: 'Breakfast', icon: 'wbSunny' },
  { type: 'lunch', name: 'Lunch', icon: 'restaurant' },
  { type: 'snack', name: 'Snack', icon: 'cookie' },
  { type: 'dinner', name: 'Dinner', icon: 'nightlight' },
];

const EMPTY_MEAL: MealSummaryDto = { calories: 0, target: 0 };

/** `_MealBreakdownCards`: 2 × 2 grid of breakfast, lunch, snack, dinner. */
export function MealBreakdown({ meals }: { meals: TodaySummaryDto['meals'] }) {
  return (
    <ul className={styles.grid}>
      {MEALS.map(({ type, name, icon }) => (
        <MealCard key={type} name={name} icon={icon} meal={meals[type] ?? EMPTY_MEAL} />
      ))}
    </ul>
  );
}

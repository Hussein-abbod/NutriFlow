import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import { useCountUp } from '@/hooks/useCountUp';
import type { PortionNutrition } from '../../model/foodItem';
import styles from './ConfirmSummaryCard.module.css';

const MACROS: readonly { key: 'protein' | 'carbs' | 'fat'; label: string; icon: IconName }[] = [
  { key: 'protein', label: 'Protein', icon: 'fitnessCenter' },
  { key: 'carbs', label: 'Carbs', icon: 'grain' },
  { key: 'fat', label: 'Fat', icon: 'waterDrop' },
];

/** Gradient "Total Nutrition" card: kcal counting up (900 ms) and the three macros. */
export function ConfirmSummaryCard({ totals }: { totals: PortionNutrition }) {
  const calories = useCountUp(totals.calories, 900);
  return (
    <section className={styles.card} aria-labelledby="total-nutrition">
      <h2 id="total-nutrition" className={styles.label}>
        Total Nutrition
      </h2>
      <p className={styles.calories}>
        <span aria-hidden="true">{calories} kcal</span>
        <span className="visually-hidden">{Math.round(totals.calories)} kcal</span>
      </p>
      <dl className={styles.macros}>
        {MACROS.map(({ key, label, icon }) => (
          <div key={key} className={styles.macro}>
            <dt className={styles.macroLabel}>{label}</dt>
            <dd className={styles.macroValue}>{Math.round(totals[key])}g</dd>
            <Icon name={icon} size={16} className={styles.macroIcon} />
          </div>
        ))}
      </dl>
    </section>
  );
}

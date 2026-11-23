import { AnimatedGradientRing } from '@/components';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils/cn';
import type { TodaySummaryDto } from '@/types/api';
import { ratio } from '../utils/progress';
import cardStyles from './DashboardCard.module.css';
import { MacroBar } from './MacroBar';
import styles from './TodaySummaryCard.module.css';

const RING_COLORS = ['var(--color-primary)', 'var(--brand-teal)'] as const;

/** `_TodaySummaryCard`: calorie ring with a counted-up total, then the three macro bars. */
export function TodaySummaryCard({ summary }: { summary: TodaySummaryDto }) {
  const consumed = useCountUp(summary.calories_consumed, 1200);
  const target = Math.round(summary.calories_target);
  return (
    <section className={cn(cardStyles.card, cardStyles.summary)} aria-label="Today's calories">
      <div className={styles.ring}>
        <AnimatedGradientRing
          progress={ratio(summary.calories_consumed, summary.calories_target)}
          size={140}
          strokeWidth={12}
          gradientColors={RING_COLORS}
          trackColor="var(--color-ring-track-soft)"
          label="Calories consumed"
        >
          <p className={styles.consumed}>
            <span aria-hidden="true">{consumed}</span>
            <span className="visually-hidden">
              {Math.round(summary.calories_consumed)} of {target} kcal
            </span>
          </p>
          <p className={styles.target} aria-hidden="true">
            / {target} kcal
          </p>
        </AnimatedGradientRing>
      </div>
      <div className={styles.macros}>
        <MacroBar label="Protein" macro={summary.protein} icon="fitnessCenter" tone="protein" />
        <MacroBar label="Carbs" macro={summary.carbs} icon="grain" tone="carbs" />
        <MacroBar label="Fat" macro={summary.fat} icon="waterDrop" tone="fat" />
      </div>
    </section>
  );
}

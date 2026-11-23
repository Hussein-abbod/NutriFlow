import { Icon } from '@/components';
import styles from './CaloriesRemainingCard.module.css';

const SIZE = 56;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface CaloriesRemainingCardProps {
  consumed: number;
  target: number;
}

/** "Daily Summary Widget": calories left of the target + a small ring with a flame. */
export function CaloriesRemainingCard({ consumed, target }: CaloriesRemainingCardProps) {
  const remaining = Math.max(0, Math.round(target - consumed));
  const progress = target > 0 ? Math.min(1, Math.max(0, consumed / target)) : 0;
  return (
    <section className={styles.card} aria-labelledby="calories-remaining">
      <div>
        <h2 id="calories-remaining" className={styles.label}>
          Calories remaining
        </h2>
        <p className={styles.value}>
          <span className={styles.remaining}>{remaining}</span>
          <span className={styles.target}> / {Math.round(target)}</span>
        </p>
      </div>
      <div
        className={styles.ring}
        role="progressbar"
        aria-label="Calories eaten"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <svg
          className={styles.rings}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          aria-hidden="true"
        >
          <circle
            className={styles.track}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
          />
          <circle
            className={styles.arc}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <Icon name="localFireDepartment" size={22} className={styles.flame} />
      </div>
    </section>
  );
}

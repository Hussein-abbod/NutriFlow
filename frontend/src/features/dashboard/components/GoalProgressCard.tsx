import { Icon } from '@/components';
import { cn } from '@/lib/utils/cn';
import type { GoalProgressDto } from '@/types/api';
import { goalPresentation, weightProgress } from '../utils/progress';
import cardStyles from './DashboardCard.module.css';
import { GoalEndedActions } from './GoalEndedActions';
import styles from './GoalProgressCard.module.css';

/** `_GoalProgressCard`: goal, days left, start → current → target weight and progress bar. */
export function GoalProgressCard({ goal }: { goal: GoalProgressDto }) {
  if (!goal.has_active_goal) {
    return (
      <div className={cn(cardStyles.card, cardStyles.padded, styles.empty)}>
        <Icon name="flag" size={32} className={styles.primary} />
        <p>No active goal found.</p>
      </div>
    );
  }

  const { label, icon } = goalPresentation(goal.goal_type);
  const percent = Math.round(weightProgress(goal) * 100);
  return (
    <div className={cn(cardStyles.card, cardStyles.padded)}>
      <div className={styles.headerRow}>
        <h3 className={styles.goal}>
          <Icon name={icon} size={22} className={styles.primary} />
          {label}
        </h3>
        <span className={styles.daysLeft}>{goal.days_remaining} days left</span>
      </div>

      <div className={styles.weights}>
        <span className={styles.edgeWeight}>
          <span className="visually-hidden">Start </span>
          {Math.round(goal.start_weight)}kg
        </span>
        <span className={styles.currentWeight}>
          <span className="visually-hidden">Current </span>
          {goal.current_weight.toFixed(1)}kg
        </span>
        <span className={styles.edgeWeight}>
          <span className="visually-hidden">Target </span>
          {Math.round(goal.target_weight)}kg
        </span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Weight goal progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>

      {goal.days_remaining === 0 && <GoalEndedActions />}
    </div>
  );
}

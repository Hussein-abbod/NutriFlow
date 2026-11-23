import { cn } from '@/lib/utils/cn';
import styles from './OnboardingStepIndicator.module.css';

export interface OnboardingStepIndicatorProps {
  /** Zero-based index of the current step. */
  current: number;
  total: number;
}

/** The segmented progress bar at the top of onboarding_screen.dart. */
export function OnboardingStepIndicator({ current, total }: OnboardingStepIndicatorProps) {
  return (
    <div
      className={styles.indicator}
      role="progressbar"
      aria-label="Sign-up progress"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-valuetext={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          data-testid="step-segment"
          className={cn(
            styles.segment,
            index <= current && styles.active,
            index === current && styles.current,
          )}
        />
      ))}
    </div>
  );
}

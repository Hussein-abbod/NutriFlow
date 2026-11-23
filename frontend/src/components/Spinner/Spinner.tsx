import { cn } from '@/lib/utils/cn';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  /** Diameter in px (Flutter CircularProgressIndicator default: 36). */
  size?: number;
  strokeWidth?: number;
  /** Any CSS color; defaults to the theme primary. */
  color?: string;
  label?: string;
  className?: string;
}

/** Indeterminate circular progress, like Flutter's CircularProgressIndicator. */
export function Spinner({
  size = 36,
  strokeWidth = 4,
  color,
  label = 'Loading',
  className,
}: SpinnerProps) {
  const radius = (size - strokeWidth) / 2;
  return (
    <span
      role="progressbar"
      aria-label={label}
      className={cn(styles.spinner, className)}
      style={{ width: size, height: size, color }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle
          className={styles.arc}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          pathLength={100}
        />
      </svg>
    </span>
  );
}

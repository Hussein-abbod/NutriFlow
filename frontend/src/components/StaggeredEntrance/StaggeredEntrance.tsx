import type { CSSProperties, ReactNode } from 'react';
import { intervalTiming, staggerTiming } from '@/lib/animation/stagger';
import { cn } from '@/lib/utils/cn';
import styles from './StaggeredEntrance.module.css';

/** `NutriAnimations.stagger(index, total)` timing (auth screens). */
interface StaggerTimingProps {
  total: number;
  step?: never;
  span?: never;
}

/** `Interval(index * step, index * step + span)` timing (onboarding steps, dashboard). */
interface IntervalTimingProps {
  step: number;
  span: number;
  total?: never;
}

export type StaggeredEntranceProps = (StaggerTimingProps | IntervalTimingProps) & {
  index: number;
  /** Length of the Flutter AnimationController driving the whole sequence. */
  controllerMs: number;
  /** Start offset of the slide-up, in % of the item's height (Flutter `Offset(0, 0.15)`). */
  slidePercent?: number;
  className?: string;
  children: ReactNode;
};

/** Fade + slide-up entrance, like the `_buildAnimated` helpers in the Flutter screens. */
export function StaggeredEntrance({
  index,
  controllerMs,
  slidePercent = 15,
  className,
  children,
  ...timing
}: StaggeredEntranceProps) {
  const { delayMs, durationMs } =
    timing.step !== undefined
      ? intervalTiming(index, { step: timing.step, span: timing.span, controllerMs })
      : staggerTiming(index, { total: timing.total, controllerMs });
  const style = {
    '--stagger-delay': `${delayMs}ms`,
    '--stagger-duration': `${durationMs}ms`,
    '--stagger-offset': `${slidePercent}%`,
  } as CSSProperties;
  return (
    <div className={cn(styles.entrance, className)} style={style}>
      {children}
    </div>
  );
}

import type { CSSProperties, ReactNode } from 'react';
import { staggerTiming } from '@/lib/animation/stagger';
import styles from './StaggeredEntrance.module.css';

export interface StaggeredEntranceProps {
  index: number;
  total: number;
  /** Length of the Flutter AnimationController driving the whole sequence. */
  controllerMs: number;
  children: ReactNode;
}

/** Fade + slide-up (Offset(0, 0.15)) entrance, like the `_buildAnimated` helpers in the auth screens. */
export function StaggeredEntrance({
  index,
  total,
  controllerMs,
  children,
}: StaggeredEntranceProps) {
  const { delayMs, durationMs } = staggerTiming(index, { total, controllerMs });
  const style = {
    '--stagger-delay': `${delayMs}ms`,
    '--stagger-duration': `${durationMs}ms`,
  } as CSSProperties;
  return (
    <div className={styles.entrance} style={style}>
      {children}
    </div>
  );
}

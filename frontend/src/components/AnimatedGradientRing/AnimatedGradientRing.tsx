import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './AnimatedGradientRing.module.css';

export interface AnimatedGradientRingProps {
  /** 0 – 1. Values outside the range are clamped. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  gradientColors?: readonly [string, string];
  trackColor?: string;
  durationMs?: number;
  /** Accessible name, e.g. "Calories consumed". */
  label: string;
  children?: ReactNode;
}

const DEFAULT_GRADIENT = ['var(--gradient-ring-start)', 'var(--gradient-ring-end)'] as const;

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/** Circular progress ring with a gradient stroke (widgets/animated_gradient_ring.dart). */
export function AnimatedGradientRing({
  progress,
  size = 120,
  strokeWidth = 10,
  gradientColors = DEFAULT_GRADIENT,
  trackColor = 'var(--color-ring-track)',
  durationMs = 900,
  label,
  children,
}: AnimatedGradientRingProps) {
  const target = clamp01(progress);
  // Start from 0 and animate to the target after mount, like the Flutter controller.
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDisplayed(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const gradientId = `ring-${useId().replace(/:/g, '')}`;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcStyle = {
    strokeDasharray: circumference,
    strokeDashoffset: circumference * (1 - displayed),
    '--ring-duration': `${durationMs}ms`,
  } as CSSProperties;

  return (
    <div
      className={styles.ring}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(target * 100)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="100%" stopColor={gradientColors[1]} />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {target > 0 && (
          <circle
            data-testid="ring-arc"
            className={styles.arc}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={arcStyle}
          />
        )}
      </svg>
      {children && <div className={styles.content}>{children}</div>}
    </div>
  );
}

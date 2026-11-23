import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './GlassCard.module.css';

export type GlassCardTone = 'auto' | 'onGradient';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Inner padding in px (Flutter default EdgeInsets.all(20)). */
  padding?: number;
  /** Corner radius in px (default 20). */
  borderRadius?: number;
  /** Backdrop blur sigma in px (Flutter `blurAmount`, default 12). */
  blurAmount?: number;
  /** White fill opacity (Flutter `opacity`, default 0.12). Can also be set via `--glass-opacity`. */
  opacity?: number;
  /**
   * `auto` follows widgets/glass_card.dart (light theme: white 70% fill).
   * `onGradient` always uses the translucent fill so white content stays readable on
   * dark gradient screens (login / register) in both themes.
   */
  tone?: GlassCardTone;
}

/** Frosted glass card with a gradient hairline border (widgets/glass_card.dart). */
export function GlassCard({
  padding,
  borderRadius,
  blurAmount,
  opacity,
  tone = 'auto',
  className,
  style,
  ...rest
}: GlassCardProps) {
  const overrides: Record<string, string | number> = {};
  if (padding !== undefined) overrides['--glass-padding'] = `${padding}px`;
  if (borderRadius !== undefined) overrides['--glass-radius'] = `${borderRadius}px`;
  if (blurAmount !== undefined) overrides['--glass-blur'] = `${blurAmount}px`;
  if (opacity !== undefined) overrides['--glass-opacity'] = opacity;

  return (
    <div
      className={cn(styles.glass, styles[tone], className)}
      style={{ ...overrides, ...style } as CSSProperties}
      {...rest}
    />
  );
}

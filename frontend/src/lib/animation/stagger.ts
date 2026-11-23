/**
 * Port of NutriAnimations.stagger(index, total, overlap) from mobile/lib/config/animations.dart.
 * Flutter runs one controller of `controllerMs` and gives each item an Interval(start, end);
 * in CSS that becomes an animation delay + duration per item.
 */
export interface StaggerOptions {
  total?: number;
  overlap?: number;
  controllerMs: number;
}

export interface StaggerTiming {
  delayMs: number;
  durationMs: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function staggerTiming(
  index: number,
  { total = 6, overlap = 0.4, controllerMs }: StaggerOptions,
): StaggerTiming {
  const start = clamp01((index / total) * (1 - overlap));
  const end = clamp01(start + overlap);
  return {
    delayMs: Math.round(start * controllerMs),
    durationMs: Math.round((end - start) * controllerMs),
  };
}

export interface IntervalOptions {
  /** Start offset per item, as a fraction of the controller (e.g. 0.12). */
  step: number;
  /** Length of each item's interval, as a fraction of the controller (e.g. 0.5). */
  span: number;
  controllerMs: number;
}

/**
 * The `Interval(index * step, index * step + span)` pattern used by the onboarding steps and
 * the dashboard (`_buildAnimated` in step_basic_info.dart / dashboard_tab.dart).
 */
export function intervalTiming(
  index: number,
  { step, span, controllerMs }: IntervalOptions,
): StaggerTiming {
  const start = clamp01(index * step);
  const end = clamp01(start + span);
  return {
    delayMs: Math.round(start * controllerMs),
    durationMs: Math.round((end - start) * controllerMs),
  };
}

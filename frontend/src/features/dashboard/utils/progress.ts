import type { IconName } from '@/components/Icon/icons';
import type { GoalProgressDto, GoalType } from '@/types/api';

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/** MacroSummary.progress / TodaySummaryModel.caloriesProgress: consumed ÷ target in [0, 1]. */
export function ratio(consumed: number, target: number): number {
  return target > 0 ? clamp01(consumed / target) : 0;
}

/** GoalProgressModel.weightProgress: how far the current weight moved from start to target. */
export function weightProgress(goal: GoalProgressDto): number {
  const {
    has_active_goal: active,
    goal_type: type,
    start_weight: start,
    current_weight: current,
    target_weight: target,
  } = goal;
  if (!active || start === target) return 0;
  if (type === 'lose_weight' && current > start) return 0;
  if (type === 'gain_weight' && current < start) return 0;
  if (type === 'lose_weight' && current <= target) return 1;
  if (type === 'gain_weight' && current >= target) return 1;
  return clamp01(Math.abs(current - start) / Math.abs(target - start));
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** "2026-11-23" → "Mon". Parsed as a local calendar day (not UTC midnight). */
export function weekdayLabel(isoDay: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!match) return '';
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return WEEKDAYS[date.getDay()] ?? '';
}

export interface GoalPresentation {
  label: string;
  icon: IconName;
}

/** Title and icon of `_GoalProgressCard`. */
export function goalPresentation(type: GoalType | ''): GoalPresentation {
  if (type === 'lose_weight') return { label: 'Lose Weight', icon: 'trendingDown' };
  if (type === 'gain_weight') return { label: 'Gain Weight', icon: 'trendingUp' };
  return { label: 'Maintain Weight', icon: 'balance' };
}

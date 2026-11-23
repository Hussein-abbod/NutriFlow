import { describe, expect, it } from 'vitest';
import type { GoalProgressDto } from '@/types/api';
import { goalPresentation, ratio, weekdayLabel, weightProgress } from './progress';

const goal = (overrides: Partial<GoalProgressDto>): GoalProgressDto => ({
  has_active_goal: true,
  goal_type: 'lose_weight',
  start_weight: 80,
  current_weight: 75,
  target_weight: 70,
  days_remaining: 30,
  start_date: '2026-11-01',
  target_date: '2026-12-23',
  ...overrides,
});

describe('ratio', () => {
  it('divides and clamps to [0, 1]', () => {
    expect(ratio(500, 2000)).toBe(0.25);
    expect(ratio(2500, 2000)).toBe(1);
    expect(ratio(-5, 2000)).toBe(0);
  });

  it('is 0 without a target', () => {
    expect(ratio(500, 0)).toBe(0);
  });
});

describe('weightProgress', () => {
  it('measures weight loss progress', () => {
    expect(weightProgress(goal({}))).toBe(0.5);
  });

  it('measures weight gain progress', () => {
    const gain = goal({
      goal_type: 'gain_weight',
      start_weight: 60,
      current_weight: 65,
      target_weight: 70,
    });
    expect(weightProgress(gain)).toBe(0.5);
  });

  it('is 0 when moving the wrong way', () => {
    expect(weightProgress(goal({ current_weight: 82 }))).toBe(0);
    expect(
      weightProgress(
        goal({ goal_type: 'gain_weight', start_weight: 60, current_weight: 58, target_weight: 70 }),
      ),
    ).toBe(0);
  });

  it('is 1 once the target is reached or passed', () => {
    expect(weightProgress(goal({ current_weight: 69 }))).toBe(1);
    expect(
      weightProgress(
        goal({ goal_type: 'gain_weight', start_weight: 60, current_weight: 71, target_weight: 70 }),
      ),
    ).toBe(1);
  });

  it('is 0 for maintain goals and without a goal', () => {
    expect(weightProgress(goal({ goal_type: 'maintain_weight', target_weight: 80 }))).toBe(0);
    expect(weightProgress(goal({ has_active_goal: false }))).toBe(0);
  });
});

describe('weekdayLabel', () => {
  it('names the local calendar day', () => {
    expect(weekdayLabel('2026-11-23')).toBe('Mon');
    expect(weekdayLabel('2026-11-29')).toBe('Sun');
  });

  it('returns an empty label for bad input', () => {
    expect(weekdayLabel('')).toBe('');
    expect(weekdayLabel('23/11/2026')).toBe('');
  });
});

describe('goalPresentation', () => {
  it('maps goal types to the Flutter labels and icons', () => {
    expect(goalPresentation('lose_weight')).toEqual({ label: 'Lose Weight', icon: 'trendingDown' });
    expect(goalPresentation('gain_weight')).toEqual({ label: 'Gain Weight', icon: 'trendingUp' });
    expect(goalPresentation('maintain_weight')).toEqual({
      label: 'Maintain Weight',
      icon: 'balance',
    });
  });
});

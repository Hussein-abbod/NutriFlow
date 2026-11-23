import { describe, expect, it } from 'vitest';
import { buildUser } from '@/test/fixtures';
import { STEP } from '../constants';
import { initialDraftsFor } from './initialDrafts';
import { needsStart, startAfterSignUp, useOnboardingStore } from './onboardingStore';

describe('initialDraftsFor', () => {
  it('uses the Flutter defaults for a new user', () => {
    expect(initialDraftsFor(buildUser())).toEqual({
      basicInfo: { gender: 'male', age: '25', heightCm: '170.0', weightKg: '70.0' },
      activity: { activityLevel: null },
      goal: { goalType: null, targetWeightKg: '', periodWeeks: 12 },
      allergies: { selected: [], none: false, other: '' },
    });
  });

  it('prefills what a returning user already saved', () => {
    const user = buildUser({
      gender: 'female',
      age: 41,
      height_cm: 158,
      weight_kg: 62.4,
      activity_level: 'lightly_active',
      goal_type: 'gain_weight',
      goal_weight_kg: 66,
      goal_period_weeks: 80,
      food_allergies: ['peanuts', 'Kiwi', 'Mango'],
    });
    expect(initialDraftsFor(user)).toEqual({
      basicInfo: { gender: 'female', age: '41', heightCm: '158.0', weightKg: '62.4' },
      activity: { activityLevel: 'lightly_active' },
      goal: { goalType: 'gain_weight', targetWeightKg: '66.0', periodWeeks: 52 },
      allergies: { selected: ['Peanuts'], none: false, other: 'Kiwi, Mango' },
    });
  });
});

describe('useOnboardingStore', () => {
  it('starts at the welcome step and restarts for another user or after completion', () => {
    const alice = buildUser({ id: 1 });
    useOnboardingStore.getState().start(alice);
    const state = useOnboardingStore.getState();
    expect(state.step).toBe(STEP.welcome);
    expect(needsStart(state, 1)).toBe(false);
    expect(needsStart(state, 2)).toBe(true);

    useOnboardingStore.getState().markCompleted();
    expect(needsStart(useOnboardingStore.getState(), 1)).toBe(true);
  });

  it('sends a new sign-up straight to basic info', () => {
    startAfterSignUp(buildUser({ id: 7 }));
    expect(useOnboardingStore.getState()).toMatchObject({ userId: 7, step: STEP.basicInfo });
  });

  it('keeps drafts per step', () => {
    useOnboardingStore.getState().start(buildUser());
    useOnboardingStore.getState().saveDraft('activity', { activityLevel: 'very_active' });
    expect(useOnboardingStore.getState().drafts?.activity).toEqual({
      activityLevel: 'very_active',
    });
  });
});

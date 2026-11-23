import type { UserDto } from '@/types/api';
import { COMMON_ALLERGIES, DEFAULT_BASIC_INFO, DEFAULT_GOAL_PERIOD_WEEKS } from '../constants';
import type { ActivityFormValues } from '../schemas/activitySchema';
import type { AllergiesFormValues } from '../schemas/allergiesSchema';
import type { BasicInfoFormValues } from '../schemas/basicInfoSchema';
import type { GoalFormValues } from '../schemas/goalSchema';
import { GOAL_PERIOD_RANGE_WEEKS } from '../schemas/limits';

/** Unsaved form values of each step (kept while the user moves back and forth). */
export interface OnboardingDrafts {
  basicInfo: BasicInfoFormValues;
  activity: ActivityFormValues;
  goal: GoalFormValues;
  allergies: AllergiesFormValues;
}

const oneDecimal = (value: number) => value.toFixed(1);

const clampWeeks = (weeks: number) =>
  Math.min(GOAL_PERIOD_RANGE_WEEKS.max, Math.max(GOAL_PERIOD_RANGE_WEEKS.min, Math.round(weeks)));

function allergyDraft(saved: readonly string[]): AllergiesFormValues {
  const selected: AllergiesFormValues['selected'] = [];
  const other: string[] = [];
  for (const name of saved) {
    const known = COMMON_ALLERGIES.find(
      (allergy) => allergy.value.toLowerCase() === name.toLowerCase(),
    );
    if (known) selected.push(known.value);
    else other.push(name);
  }
  return { selected, none: false, other: other.join(', ') };
}

/**
 * Flutter starts every step from fixed defaults; here we prefill anything the user already
 * saved (e.g. when they come back after "Reset Goal").
 */
export function initialDraftsFor(user: UserDto): OnboardingDrafts {
  const isWeightGoal = user.goal_type !== null && user.goal_type !== 'maintain_weight';
  return {
    basicInfo: {
      gender: user.gender === 'female' ? 'female' : DEFAULT_BASIC_INFO.gender,
      age: String(user.age ?? DEFAULT_BASIC_INFO.age),
      heightCm: oneDecimal(user.height_cm ?? DEFAULT_BASIC_INFO.heightCm),
      weightKg: oneDecimal(user.weight_kg ?? DEFAULT_BASIC_INFO.weightKg),
    },
    activity: { activityLevel: user.activity_level },
    goal: {
      goalType: user.goal_type,
      targetWeightKg:
        isWeightGoal && user.goal_weight_kg !== null ? oneDecimal(user.goal_weight_kg) : '',
      periodWeeks: clampWeeks(user.goal_period_weeks ?? DEFAULT_GOAL_PERIOD_WEEKS),
    },
    allergies: allergyDraft(user.food_allergies ?? []),
  };
}

import type { IconName } from '@/components/Icon/icons';
import type { ActivityLevel, Gender, GoalType } from '@/types/api';

/**
 * onboarding_screen.dart pages, in order. Step 0 is the sign-up form for guests
 * (`/register`) and the "Welcome back" screen for signed-in users (`/onboarding`).
 */
export const ONBOARDING_STEPS = [
  'welcome',
  'basic-info',
  'activity',
  'goal',
  'allergies',
  'summary',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

/** Index of each step in ONBOARDING_STEPS. */
export const STEP = {
  welcome: 0,
  basicInfo: 1,
  activity: 2,
  goal: 3,
  allergies: 4,
  summary: 5,
} as const;

export type OnboardingStepIndex = (typeof STEP)[keyof typeof STEP];

/** `<form id>` of each step; the shared Next button submits the current one. */
export const stepFormId = (step: OnboardingStepIndex) =>
  `onboarding-${ONBOARDING_STEPS[step]}-form`;

export interface ChoiceOption<TValue extends string> {
  value: TValue;
  label: string;
  icon: IconName;
}

export const GENDER_OPTIONS: readonly ChoiceOption<Gender>[] = [
  { value: 'male', label: 'Male', icon: 'male' },
  { value: 'female', label: 'Female', icon: 'female' },
];

export interface ActivityOption extends ChoiceOption<ActivityLevel> {
  description: string;
}

export const ACTIVITY_OPTIONS: readonly ActivityOption[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Desk job, little to no exercise',
    icon: 'weekend',
  },
  {
    value: 'lightly_active',
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    icon: 'directionsWalk',
  },
  {
    value: 'moderately_active',
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    icon: 'fitnessCenter',
  },
  {
    value: 'very_active',
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    icon: 'directionsRun',
  },
  {
    value: 'extra_active',
    label: 'Extra Active',
    description: 'Physical job + hard exercise',
    icon: 'localFireDepartment',
  },
];

export const GOAL_OPTIONS: readonly ChoiceOption<GoalType>[] = [
  { value: 'lose_weight', label: 'Lose Weight', icon: 'trendingDown' },
  { value: 'maintain_weight', label: 'Maintain', icon: 'balance' },
  { value: 'gain_weight', label: 'Gain Weight', icon: 'trendingUp' },
];

export const COMMON_ALLERGIES = [
  { value: 'Eggs', icon: 'eggOutlined' },
  { value: 'Milk/Dairy', icon: 'localDrinkOutlined' },
  { value: 'Peanuts', icon: 'spaOutlined' },
  { value: 'Tree Nuts', icon: 'forestOutlined' },
  { value: 'Wheat/Gluten', icon: 'grassOutlined' },
  { value: 'Soy', icon: 'grainOutlined' },
  { value: 'Fish', icon: 'setMealOutlined' },
  { value: 'Shellfish', icon: 'waterOutlined' },
  { value: 'Sesame', icon: 'cookieOutlined' },
] as const satisfies readonly { value: string; icon: IconName }[];

export type CommonAllergy = (typeof COMMON_ALLERGIES)[number]['value'];

/** Starting values of step_basic_info.dart / step_goal_selection.dart. */
export const DEFAULT_BASIC_INFO = { age: 25, gender: 'male', heightCm: 170, weightKg: 70 } as const;
export const DEFAULT_GOAL_PERIOD_WEEKS = 12;
/** Suggested change when a lose/gain goal is picked and no target was typed yet. */
export const SUGGESTED_GOAL_CHANGE_KG = 5;

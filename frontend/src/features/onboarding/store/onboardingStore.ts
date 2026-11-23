import { create } from 'zustand';
import type { NutritionTargetsDto, UserDto } from '@/types/api';
import { STEP, type OnboardingStepIndex } from '../constants';
import type { BasicInfo } from '../schemas/basicInfoSchema';
import type { GoalChoice } from '../schemas/goalSchema';
import { initialDraftsFor, type OnboardingDrafts } from './initialDrafts';

/** providers/onboarding_provider.dart, plus the current page of onboarding_screen.dart. */
export interface OnboardingState {
  /** Whose onboarding this is; a different user starts over. */
  userId: number | null;
  /** Set after POST /onboarding/complete so a later "Reset Goal" starts fresh. */
  completed: boolean;
  step: OnboardingStepIndex;
  drafts: OnboardingDrafts | null;
  /** Validated basic info (step 1), sent with the activity level in step 2. */
  basicInfo: BasicInfo | null;
  /** Saved goal and the targets the backend calculated for it (step 3). */
  goal: GoalChoice | null;
  targets: NutritionTargetsDto | null;

  start: (user: UserDto, step?: OnboardingStepIndex) => void;
  goTo: (step: OnboardingStepIndex) => void;
  saveDraft: <K extends keyof OnboardingDrafts>(key: K, values: OnboardingDrafts[K]) => void;
  setBasicInfo: (basicInfo: BasicInfo) => void;
  setGoal: (goal: GoalChoice, targets: NutritionTargetsDto) => void;
  markCompleted: () => void;
}

const emptyProgress = {
  completed: false,
  step: STEP.welcome,
  basicInfo: null,
  goal: null,
  targets: null,
} satisfies Partial<OnboardingState>;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  userId: null,
  drafts: null,
  ...emptyProgress,

  start: (user, step = STEP.welcome) =>
    set({ ...emptyProgress, userId: user.id, step, drafts: initialDraftsFor(user) }),
  goTo: (step) => set({ step }),
  saveDraft: (key, values) =>
    set((state) => (state.drafts ? { drafts: { ...state.drafts, [key]: values } } : {})),
  setBasicInfo: (basicInfo) => set({ basicInfo }),
  setGoal: (goal, targets) => set({ goal, targets }),
  markCompleted: () => set({ completed: true }),
}));

/** Does the store need a fresh start for this user? */
export function needsStart(state: Pick<OnboardingState, 'userId' | 'completed'>, userId: number) {
  return state.userId !== userId || state.completed;
}

/** Called right after sign-up: the new user goes straight to "Basic Information". */
export const startAfterSignUp = (user: UserDto) =>
  useOnboardingStore.getState().start(user, STEP.basicInfo);

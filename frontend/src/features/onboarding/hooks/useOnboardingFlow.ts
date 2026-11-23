import { useIsMutating } from '@tanstack/react-query';
import { showSnackbar } from '@/components';
import { getErrorMessage } from '@/lib/api';
import type { OnboardingGoalRequestDto, UserDto } from '@/types/api';
import {
  onboardingMutationKey,
  useCompleteOnboarding,
  useSaveAllergies,
  useSaveGoal,
  useSaveProfile,
} from '../api/useOnboardingMutations';
import { STEP, type OnboardingStepIndex } from '../constants';
import type { ActivityFormOutput } from '../schemas/activitySchema';
import type { BasicInfo } from '../schemas/basicInfoSchema';
import type { GoalChoice } from '../schemas/goalSchema';
import { useOnboardingStore } from '../store/onboardingStore';

const showError = (error: unknown) => showSnackbar(getErrorMessage(error), 'error');

function toGoalRequest(goal: GoalChoice): OnboardingGoalRequestDto {
  if (goal.targetWeightKg === null || goal.periodWeeks === null) {
    return { goal_type: goal.goalType };
  }
  return {
    goal_type: goal.goalType,
    target_weight_kg: goal.targetWeightKg,
    goal_period_weeks: goal.periodWeeks,
  };
}

/**
 * `_nextPage` / `_previousPage` of onboarding_screen.dart: each step saves its data
 * (API calls from step 2 on) and only then moves forward.
 */
export function useOnboardingFlow(user: UserDto) {
  const step = useOnboardingStore((state) => state.step);
  const basicInfo = useOnboardingStore((state) => state.basicInfo);
  const { goTo, setBasicInfo, setGoal } = useOnboardingStore.getState();
  const busy = useIsMutating({ mutationKey: onboardingMutationKey }) > 0;

  const saveProfile = useSaveProfile();
  const saveGoal = useSaveGoal();
  const saveAllergies = useSaveAllergies();
  const complete = useCompleteOnboarding();

  const back = () => {
    if (!busy && step > STEP.welcome) goTo((step - 1) as OnboardingStepIndex);
  };

  const submitBasicInfo = (info: BasicInfo) => {
    setBasicInfo(info);
    goTo(STEP.activity);
  };

  const submitActivity = ({ activityLevel }: ActivityFormOutput) => {
    if (busy) return;
    if (!basicInfo) {
      goTo(STEP.basicInfo);
      return;
    }
    saveProfile.mutate(
      {
        full_name: user.full_name ?? 'User',
        age: basicInfo.age,
        gender: basicInfo.gender,
        height_cm: basicInfo.heightCm,
        weight_kg: basicInfo.weightKg,
        activity_level: activityLevel,
      },
      { onSuccess: () => goTo(STEP.goal), onError: showError },
    );
  };

  const submitGoal = (goal: GoalChoice) => {
    if (busy) return;
    saveGoal.mutate(toGoalRequest(goal), {
      onSuccess: (response) => {
        if (!response.is_feasible || !response.targets) {
          showSnackbar(response.message, 'error');
          return;
        }
        setGoal(goal, response.targets);
        goTo(STEP.allergies);
      },
      onError: showError,
    });
  };

  const submitAllergies = (allergies: string[]) => {
    if (busy) return;
    saveAllergies.mutate(
      { food_allergies: allergies },
      { onSuccess: () => goTo(STEP.summary), onError: showError },
    );
  };

  /** Success updates the cached user; the route guard then leaves onboarding. */
  const finish = () => {
    if (!busy) complete.mutate(undefined, { onError: showError });
  };

  return {
    step,
    busy,
    back,
    start: () => goTo(STEP.basicInfo),
    submitBasicInfo,
    submitActivity,
    submitGoal,
    submitAllergies,
    finish,
  };
}

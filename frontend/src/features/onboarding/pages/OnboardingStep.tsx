import type { UserDto } from '@/types/api';
import { STEP, type OnboardingStepIndex } from '../constants';
import { ActivityLevelStep } from '../components/steps/ActivityLevelStep';
import { AllergiesStep } from '../components/steps/AllergiesStep';
import { BasicInfoStep } from '../components/steps/BasicInfoStep';
import { GoalStep } from '../components/steps/GoalStep';
import { SummaryStep } from '../components/steps/SummaryStep';
import { WelcomeBackStep } from '../components/steps/WelcomeBackStep';
import type { useOnboardingFlow } from '../hooks/useOnboardingFlow';
import { useOnboardingStore } from '../store/onboardingStore';

export interface OnboardingStepProps {
  step: OnboardingStepIndex;
  user: UserDto;
  flow: ReturnType<typeof useOnboardingFlow>;
}

/** Picks the component of one onboarding page and wires it to the store and the flow. */
export function OnboardingStep({ step, user, flow }: OnboardingStepProps) {
  const basicInfo = useOnboardingStore((state) => state.basicInfo);
  const goal = useOnboardingStore((state) => state.goal);
  const targets = useOnboardingStore((state) => state.targets);
  const saveDraft = useOnboardingStore((state) => state.saveDraft);
  // Drafts only seed a step's form when it mounts, so they are read once, not subscribed to.
  const drafts = useOnboardingStore.getState().drafts;
  if (!drafts) return null;

  switch (step) {
    case STEP.welcome:
      return <WelcomeBackStep name={user.full_name ?? 'User'} onContinue={flow.start} />;
    case STEP.basicInfo:
      return (
        <BasicInfoStep
          defaultValues={drafts.basicInfo}
          onDraftChange={(values) => saveDraft('basicInfo', values)}
          onSubmit={flow.submitBasicInfo}
        />
      );
    case STEP.activity:
      return (
        <ActivityLevelStep
          defaultValues={drafts.activity}
          onDraftChange={(values) => saveDraft('activity', values)}
          onSubmit={flow.submitActivity}
        />
      );
    case STEP.goal:
      return (
        <GoalStep
          currentWeightKg={basicInfo?.weightKg ?? user.weight_kg ?? 0}
          defaultValues={drafts.goal}
          onDraftChange={(values) => saveDraft('goal', values)}
          onSubmit={flow.submitGoal}
        />
      );
    case STEP.allergies:
      return (
        <AllergiesStep
          defaultValues={drafts.allergies}
          onDraftChange={(values) => saveDraft('allergies', values)}
          onSubmit={flow.submitAllergies}
        />
      );
    case STEP.summary:
      return (
        <SummaryStep
          targets={targets}
          periodWeeks={goal?.periodWeeks ?? null}
          onConfirm={flow.finish}
        />
      );
  }
}

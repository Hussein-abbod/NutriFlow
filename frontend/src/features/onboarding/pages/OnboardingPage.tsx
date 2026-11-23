import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth';
import type { UserDto } from '@/types/api';
import { ONBOARDING_STEP_COUNT, ONBOARDING_STEPS, STEP, stepFormId } from '../constants';
import { OnboardingNav } from '../components/OnboardingNav';
import { OnboardingStepIndicator } from '../components/OnboardingStepIndicator';
import { StepBackground } from '../components/StepBackground';
import { StepViewport } from '../components/StepViewport';
import { useOnboardingFlow } from '../hooks/useOnboardingFlow';
import { useStepTransition } from '../hooks/useStepTransition';
import { needsStart, useOnboardingStore } from '../store/onboardingStore';
import { OnboardingStep } from './OnboardingStep';
import styles from './OnboardingPage.module.css';

/** onboarding_screen.dart for a signed-in user whose profile is not complete yet. */
export function OnboardingPage() {
  const { data: user } = useCurrentUser();
  const ready = useOnboardingStore((state) => user !== undefined && !needsStart(state, user.id));

  useEffect(() => {
    if (user && needsStart(useOnboardingStore.getState(), user.id)) {
      useOnboardingStore.getState().start(user);
    }
  }, [user]);

  if (!user || !ready) return <StepBackground step={STEP.welcome} />;
  return <OnboardingFlow user={user} />;
}

function OnboardingFlow({ user }: { user: UserDto }) {
  const flow = useOnboardingFlow(user);
  const { step } = flow;
  const transition = useStepTransition(step);

  return (
    <main className={styles.page} data-step={ONBOARDING_STEPS[step]}>
      <StepBackground step={step} />
      <OnboardingStepIndicator current={step} total={ONBOARDING_STEP_COUNT} />
      <StepViewport
        transition={transition}
        renderStep={(index) => <OnboardingStep step={index} user={user} flow={flow} />}
      />
      {step > STEP.welcome && (
        <OnboardingNav
          formId={stepFormId(step)}
          isLastStep={step === STEP.summary}
          busy={flow.busy}
          locked={transition.leaving !== null}
          onBack={flow.back}
        />
      )}
    </main>
  );
}

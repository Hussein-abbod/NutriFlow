import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { OnboardingStepIndex } from '../constants';

/** PageView.animateToPage duration (onboarding_screen.dart). */
export const STEP_TRANSITION_MS = 500;

export interface StepTransition {
  current: OnboardingStepIndex;
  /** The step sliding out, or `null` when no slide is running. */
  leaving: OnboardingStepIndex | null;
  direction: 'forward' | 'back';
}

/** Tracks the page slide between two steps (none when the user prefers reduced motion). */
export function useStepTransition(step: OnboardingStepIndex): StepTransition {
  const reducedMotion = usePrefersReducedMotion();
  const [view, setView] = useState<StepTransition>({
    current: step,
    leaving: null,
    direction: 'forward',
  });
  if (view.current !== step) {
    setView({
      current: step,
      leaving: reducedMotion ? null : view.current,
      direction: step > view.current ? 'forward' : 'back',
    });
  }

  const { current, leaving } = view;
  useEffect(() => {
    if (leaving === null) return;
    const timer = setTimeout(
      () => setView((latest) => ({ ...latest, leaving: null })),
      STEP_TRANSITION_MS,
    );
    return () => clearTimeout(timer);
  }, [current, leaving]);

  return view;
}

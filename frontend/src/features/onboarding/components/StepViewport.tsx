import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { ONBOARDING_STEPS, type OnboardingStepIndex } from '../constants';
import type { StepTransition } from '../hooks/useStepTransition';
import styles from './StepViewport.module.css';

export interface StepViewportProps {
  transition: StepTransition;
  renderStep: (step: OnboardingStepIndex) => ReactNode;
}

/**
 * Horizontal page slide between steps. The old step stays mounted (inert) while it slides
 * out; the new step slides in and its heading receives focus.
 */
export function StepViewport({ transition, renderStep }: StepViewportProps) {
  const { current, leaving, direction } = transition;
  const viewportRef = useRef<HTMLDivElement>(null);
  const isFirstStep = useRef(true);

  // Move focus to the new step's heading on every step change (not on the first render).
  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false;
      return;
    }
    viewportRef.current
      ?.querySelector<HTMLElement>(`[data-step="${ONBOARDING_STEPS[current]}"] h1`)
      ?.focus({ preventScroll: true });
  }, [current]);

  const slots = leaving === null ? [current] : [leaving, current];

  return (
    <div ref={viewportRef} className={styles.viewport}>
      {slots.map((index) => {
        const isLeaving = index === leaving;
        const isEntering = !isLeaving && leaving !== null;
        return (
          <section
            key={ONBOARDING_STEPS[index]}
            data-step={ONBOARDING_STEPS[index]}
            aria-hidden={isLeaving || undefined}
            ref={(element) => element?.toggleAttribute('inert', isLeaving)}
            className={cn(
              styles.slot,
              isLeaving && styles[`leave-${direction}`],
              isEntering && styles[`enter-${direction}`],
            )}
          >
            {renderStep(index)}
          </section>
        );
      })}
    </div>
  );
}

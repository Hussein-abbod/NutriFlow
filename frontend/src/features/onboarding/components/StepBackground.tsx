import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ONBOARDING_STEPS, type OnboardingStepIndex } from '../constants';
import styles from './StepBackground.module.css';

/**
 * The per-step gradient of onboarding_screen.dart. Flutter animates the gradient colours
 * (AnimatedContainer, 600ms easeInOut); here the new gradient fades in over the previous one.
 */
export function StepBackground({ step }: { step: OnboardingStepIndex }) {
  const [layers, setLayers] = useState({ current: step, previous: step });
  if (layers.current !== step) setLayers({ current: step, previous: layers.current });

  return (
    <div className={styles.background} aria-hidden="true">
      <div className={cn(styles.layer, styles[ONBOARDING_STEPS[layers.previous]])} />
      <div
        key={layers.current}
        data-testid="step-background"
        data-step={ONBOARDING_STEPS[layers.current]}
        className={cn(styles.layer, styles.entering, styles[ONBOARDING_STEPS[layers.current]])}
      />
    </div>
  );
}

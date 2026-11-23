import type { MouseEvent } from 'react';
import { Button, Icon } from '@/components';
import styles from './OnboardingNav.module.css';

export interface OnboardingNavProps {
  /** `<form id>` of the current step; Next submits it. */
  formId: string;
  isLastStep: boolean;
  busy: boolean;
  /**
   * True while the page slide runs. The 2nd click of a double-click is then ignored, so it
   * can't submit the step that is sliding in (single clicks and keyboard still work).
   */
  locked: boolean;
  onBack: () => void;
}

/** Bottom row of onboarding_screen.dart: Back (text) and Next / Confirm & Finish (white). */
export function OnboardingNav({ formId, isLastStep, busy, locked, onBack }: OnboardingNavProps) {
  const isRepeatClick = (event: MouseEvent<HTMLButtonElement>) => locked && event.detail > 1;
  return (
    <nav className={styles.nav} aria-label="Onboarding">
      <Button
        variant="text"
        className={styles.back}
        leadingIcon={<Icon name="arrowBackIos" size={16} />}
        onClick={(event) => {
          if (!isRepeatClick(event)) onBack();
        }}
        disabled={busy}
      >
        Back
      </Button>
      <Button
        type="submit"
        form={formId}
        variant="light"
        className={styles.next}
        loading={busy}
        loadingLabel="Saving"
        onClick={(event) => {
          if (isRepeatClick(event)) event.preventDefault();
        }}
      >
        {isLastStep ? 'Confirm & Finish' : 'Next'}
      </Button>
    </nav>
  );
}

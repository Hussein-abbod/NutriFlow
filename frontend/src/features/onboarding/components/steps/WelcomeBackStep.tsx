import type { FormEvent } from 'react';
import { Button, Icon } from '@/components';
import { stepFormId, STEP } from '../../constants';
import styles from './WelcomeBackStep.module.css';

export interface WelcomeBackStepProps {
  name: string;
  onContinue: () => void;
}

/** step_welcome.dart for a signed-in user: "Welcome back, <name>!" + Continue. */
export function WelcomeBackStep({ name, onContinue }: WelcomeBackStepProps) {
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    onContinue();
  };
  return (
    <form id={stepFormId(STEP.welcome)} className={styles.welcome} onSubmit={onSubmit} noValidate>
      <div className={styles.badge}>
        <Icon name="wavingHand" size={48} />
      </div>
      <h1 className={styles.title} tabIndex={-1}>
        Welcome back,
        <br />
        {name}!
      </h1>
      <p className={styles.subtitle}>Let&apos;s finish setting up your profile.</p>
      <Button type="submit" variant="light" className={styles.continue}>
        Continue
      </Button>
    </form>
  );
}

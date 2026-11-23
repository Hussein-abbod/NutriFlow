import { zodResolver } from '@hookform/resolvers/zod';
import type { CSSProperties } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { Icon, showSnackbar } from '@/components';
import { cn } from '@/lib/utils/cn';
import { ACTIVITY_OPTIONS, STEP, stepFormId } from '../../constants';
import { useDraftSync } from '../../hooks/useDraftSync';
import {
  activitySchema,
  type ActivityFormOutput,
  type ActivityFormValues,
} from '../../schemas/activitySchema';
import { ChoiceTile } from '../ChoiceTile';
import { StepHeader } from '../StepHeader';
import styles from './ActivityLevelStep.module.css';
import stepStyles from './Step.module.css';

export interface ActivityLevelStepProps {
  defaultValues: ActivityFormValues;
  onDraftChange: (values: ActivityFormValues) => void;
  onSubmit: (values: ActivityFormOutput) => void;
}

/** Flutter shows "Please select an activity level" in a snackbar, not inline. */
const reportMissingLevel = (errors: FieldErrors<ActivityFormValues>) => {
  if (errors.activityLevel?.message) showSnackbar(errors.activityLevel.message, 'error');
};

/** step_activity_level.dart: five levels, one must be picked. */
export function ActivityLevelStep({
  defaultValues,
  onDraftChange,
  onSubmit,
}: ActivityLevelStepProps) {
  const form = useForm<ActivityFormValues, unknown, ActivityFormOutput>({
    resolver: zodResolver(activitySchema),
    defaultValues,
  });
  const { register, watch, handleSubmit } = form;
  useDraftSync(form, onDraftChange);
  const selectedLevel = watch('activityLevel');

  return (
    <form
      id={stepFormId(STEP.activity)}
      className={stepStyles.step}
      onSubmit={handleSubmit(onSubmit, reportMissingLevel)}
      noValidate
      aria-label="Activity level"
    >
      <StepHeader
        icon="fitnessCenter"
        title="Activity Level"
        subtitle="How active are you on an average week?"
      />
      <fieldset className={cn(stepStyles.fieldset, stepStyles.afterHeader)}>
        <legend className="visually-hidden">Activity level</legend>
        <div className={styles.list}>
          {ACTIVITY_OPTIONS.map((option, index) => {
            const selected = selectedLevel === option.value;
            return (
              <div
                key={option.value}
                className={styles.rise}
                style={{ '--rise-duration': `${400 + index * 100}ms` } as CSSProperties}
              >
                <ChoiceTile
                  type="radio"
                  layout="row"
                  value={option.value}
                  selected={selected}
                  aria-labelledby={`activity-${option.value}-title`}
                  aria-describedby={`activity-${option.value}-description`}
                  {...register('activityLevel')}
                >
                  <span className={cn(styles.iconBubble, selected && styles.iconBubbleSelected)}>
                    <Icon name={option.icon} size={22} />
                  </span>
                  <span className={styles.text}>
                    <span
                      id={`activity-${option.value}-title`}
                      className={cn(styles.title, selected && styles.titleSelected)}
                    >
                      {option.label}
                    </span>
                    <span id={`activity-${option.value}-description`} className={styles.subtitle}>
                      {option.description}
                    </span>
                  </span>
                  <span className={cn(styles.radio, selected && styles.radioSelected)}>
                    {selected && <Icon name="check" size={16} />}
                  </span>
                </ChoiceTile>
              </div>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}

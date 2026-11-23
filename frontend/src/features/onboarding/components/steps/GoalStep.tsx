import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, type ChangeEvent } from 'react';
import { useController, useForm, type FieldErrors } from 'react-hook-form';
import { GlassCard, Icon, showSnackbar } from '@/components';
import { cn } from '@/lib/utils/cn';
import type { GoalType } from '@/types/api';
import { GOAL_OPTIONS, STEP, stepFormId, SUGGESTED_GOAL_CHANGE_KG } from '../../constants';
import { useDraftSync } from '../../hooks/useDraftSync';
import { createGoalSchema, type GoalChoice, type GoalFormValues } from '../../schemas/goalSchema';
import { GOAL_PERIOD_RANGE_WEEKS, WEIGHT_RANGE_KG } from '../../schemas/limits';
import { parseNumber } from '@/lib/forms/numberField';
import { ChoiceTile } from '../ChoiceTile';
import { GlassSlider } from '../GlassSlider';
import { MeasureField } from '../MeasureField';
import cardStyles from '../OnboardingCard.module.css';
import { StepHeader } from '../StepHeader';
import styles from './GoalStep.module.css';
import stepStyles from './Step.module.css';

export interface GoalStepProps {
  /** From the basic-info step; lose/gain targets must be on the right side of it. */
  currentWeightKg: number;
  defaultValues: GoalFormValues;
  onDraftChange: (values: GoalFormValues) => void;
  onSubmit: (goal: GoalChoice) => void;
}

/** Flutter shows "Please select a goal" in a snackbar; field errors stay inline. */
const reportMissingGoal = (errors: FieldErrors<GoalFormValues>) => {
  if (errors.goalType?.message) showSnackbar(errors.goalType.message, 'error');
};

/** A starting target 5 kg away from the current weight, kept inside the allowed range. */
function suggestedTarget(
  goalType: Exclude<GoalType, 'maintain_weight'>,
  currentWeightKg: number,
): string {
  const change = goalType === 'lose_weight' ? -SUGGESTED_GOAL_CHANGE_KG : SUGGESTED_GOAL_CHANGE_KG;
  const target = Math.min(
    WEIGHT_RANGE_KG.max,
    Math.max(WEIGHT_RANGE_KG.min, currentWeightKg + change),
  );
  return target.toFixed(1);
}

/** step_goal_selection.dart: lose / maintain / gain, then target weight and period. */
export function GoalStep({
  currentWeightKg,
  defaultValues,
  onDraftChange,
  onSubmit,
}: GoalStepProps) {
  const schema = useMemo(() => createGoalSchema(currentWeightKg), [currentWeightKg]);
  const form = useForm<GoalFormValues, unknown, GoalChoice>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const {
    register,
    control,
    watch,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;
  useDraftSync(form, onDraftChange);
  const target = useController({ control, name: 'targetWeightKg' });
  const period = useController({ control, name: 'periodWeeks' });
  const goalType = watch('goalType');
  const needsTarget = goalType !== null && goalType !== 'maintain_weight';

  /** Keep a typed target unless it no longer fits the newly picked direction. */
  const onGoalTypeChange = (next: string) => {
    if (next !== 'lose_weight' && next !== 'gain_weight') return;
    const target = parseNumber(getValues('targetWeightKg'));
    const fits = next === 'lose_weight' ? target < currentWeightKg : target > currentWeightKg;
    if (!Number.isFinite(target) || !fits) {
      setValue('targetWeightKg', suggestedTarget(next, currentWeightKg));
    }
  };
  // One registration shared by the three radios (RHF keeps a single onChange per field).
  const goalTypeField = register('goalType', {
    onChange: (event: ChangeEvent<HTMLInputElement>) => onGoalTypeChange(event.target.value),
  });

  return (
    <form
      id={stepFormId(STEP.goal)}
      className={stepStyles.step}
      onSubmit={handleSubmit(onSubmit, reportMissingGoal)}
      noValidate
      aria-label="Your goal"
    >
      <StepHeader
        icon="flagOutlined"
        title="Your Goal"
        subtitle="What would you like to achieve?"
      />

      <fieldset className={cn(stepStyles.fieldset, stepStyles.afterHeader)}>
        <legend className="visually-hidden">Goal</legend>
        <div className={styles.goals}>
          {GOAL_OPTIONS.map((option) => {
            const selected = goalType === option.value;
            return (
              <ChoiceTile
                key={option.value}
                type="radio"
                layout="tile"
                value={option.value}
                selected={selected}
                {...goalTypeField}
              >
                <Icon name={option.icon} size={28} />
                <span className={cn(styles.goalTitle, selected && stepStyles.selectedText)}>
                  {option.label}
                </span>
              </ChoiceTile>
            );
          })}
        </div>
      </fieldset>

      {needsTarget && (
        <div className={styles.details}>
          <GlassCard padding={20} opacity={0.1} blurAmount={12} tone="onGradient">
            <label htmlFor="onboarding-target-weight" className={cardStyles.label}>
              Target Weight
            </label>
            <MeasureField
              id="onboarding-target-weight"
              className={cardStyles.fieldGapLarge}
              valueSize="large"
              suffix="kg"
              inputMode="decimal"
              error={errors.targetWeightKg?.message}
              ref={target.field.ref}
              name={target.field.name}
              value={target.field.value}
              onChange={(event) => target.field.onChange(event.target.value)}
              onBlur={target.field.onBlur}
            />
          </GlassCard>

          <GlassCard padding={20} opacity={0.1} blurAmount={12} tone="onGradient">
            <div className={cardStyles.labelRow}>
              <label htmlFor="onboarding-goal-period" className={cardStyles.label}>
                Goal Period
              </label>
              <span className={styles.periodPill} aria-hidden="true">
                {period.field.value} weeks
              </span>
            </div>
            <GlassSlider
              id="onboarding-goal-period"
              ref={period.field.ref}
              name={period.field.name}
              className={styles.periodSlider}
              min={GOAL_PERIOD_RANGE_WEEKS.min}
              max={GOAL_PERIOD_RANGE_WEEKS.max}
              step={1}
              value={period.field.value}
              onChange={(event) => period.field.onChange(Number(event.target.value))}
              onBlur={period.field.onBlur}
              aria-valuetext={`${period.field.value} weeks`}
            />
          </GlassCard>
        </div>
      )}
    </form>
  );
}

import type { FormEvent } from 'react';
import { GlassCard, Icon, Spinner } from '@/components';
import { useCountUp } from '@/hooks/useCountUp';
import type { NutritionTargetsDto } from '@/types/api';
import { STEP, stepFormId } from '../../constants';
import { MacroTargetCard } from '../MacroTargetCard';
import { StepHeader } from '../StepHeader';
import stepStyles from './Step.module.css';
import styles from './SummaryStep.module.css';

export interface SummaryStepProps {
  targets: NutritionTargetsDto | null;
  /** Goal period for lose/gain goals; `null` hides the timeline card (maintain). */
  periodWeeks: number | null;
  onConfirm: () => void;
}

/** step_summary.dart: the calculated daily targets, then "Confirm & Finish". */
export function SummaryStep({ targets, periodWeeks, onConfirm }: SummaryStepProps) {
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm();
  };
  return (
    <form
      id={stepFormId(STEP.summary)}
      className={stepStyles.step}
      onSubmit={onSubmit}
      noValidate
      aria-label="Your plan"
    >
      {targets ? (
        <PlanSummary targets={targets} periodWeeks={periodWeeks} />
      ) : (
        <div className={styles.loading}>
          <Spinner color="var(--color-white)" label="Loading your plan" />
        </div>
      )}
    </form>
  );
}

function PlanSummary({
  targets,
  periodWeeks,
}: {
  targets: NutritionTargetsDto;
  periodWeeks: number | null;
}) {
  const calories = useCountUp(targets.daily_calories, 1200);
  return (
    <>
      <StepHeader
        icon="celebration"
        size="large"
        title="Your Plan is Ready!"
        subtitle="Based on your profile and goals, here are your daily targets"
      />

      <GlassCard
        className={styles.calories}
        padding={28}
        opacity={0.15}
        blurAmount={16}
        tone="onGradient"
      >
        <p className={styles.caloriesLabel}>Daily Calories</p>
        <p className={styles.caloriesValue}>
          <span aria-hidden="true">{calories}</span>
          <span className="visually-hidden">{Math.round(targets.daily_calories)} kcal</span>
        </p>
        <p className={styles.caloriesUnit} aria-hidden="true">
          kcal
        </p>
      </GlassCard>

      <div className={styles.macros}>
        <MacroTargetCard
          title="Protein"
          grams={targets.daily_protein}
          icon="fitnessCenter"
          tone="protein"
        />
        <MacroTargetCard title="Carbs" grams={targets.daily_carbs} icon="grain" tone="carbs" />
        <MacroTargetCard title="Fat" grams={targets.daily_fat} icon="waterDrop" tone="fat" />
      </div>

      {periodWeeks !== null && (
        <GlassCard
          className={styles.timeline}
          padding={20}
          opacity={0.1}
          blurAmount={12}
          tone="onGradient"
        >
          <span className={styles.timelineBadge}>
            <Icon name="calendarToday" size={20} />
          </span>
          <div>
            <p className={styles.timelineLabel}>Timeline</p>
            <p className={styles.timelineValue}>{periodWeeks} weeks to reach your goal</p>
          </div>
        </GlassCard>
      )}
    </>
  );
}

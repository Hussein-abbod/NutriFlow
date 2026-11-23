import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { GlassCard, Icon, StaggeredEntrance } from '@/components';
import { cn } from '@/lib/utils/cn';
import { GENDER_OPTIONS, STEP, stepFormId } from '../../constants';
import { useDraftSync } from '../../hooks/useDraftSync';
import {
  basicInfoSchema,
  type BasicInfo,
  type BasicInfoFormValues,
} from '../../schemas/basicInfoSchema';
import { HEIGHT_SLIDER_CM, WEIGHT_SLIDER_KG } from '../../schemas/limits';
import { ChoiceTile } from '../ChoiceTile';
import { MeasureField } from '../MeasureField';
import { MeasureSliderCard } from '../MeasureSliderCard';
import { StepHeader } from '../StepHeader';
import cardStyles from '../OnboardingCard.module.css';
import styles from './Step.module.css';

export interface BasicInfoStepProps {
  defaultValues: BasicInfoFormValues;
  onDraftChange: (values: BasicInfoFormValues) => void;
  onSubmit: (basicInfo: BasicInfo) => void;
}

/** Interval(index * 0.12, + 0.5) over an 800ms controller, slide Offset(0, 0.12). */
const ENTRANCE = { step: 0.12, span: 0.5, controllerMs: 800, slidePercent: 12 } as const;

/** step_basic_info.dart: gender, age, height and weight. */
export function BasicInfoStep({ defaultValues, onDraftChange, onSubmit }: BasicInfoStepProps) {
  const form = useForm<BasicInfoFormValues, unknown, BasicInfo>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues,
  });
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = form;
  useDraftSync(form, onDraftChange);
  const height = useController({ control, name: 'heightCm' });
  const weight = useController({ control, name: 'weightKg' });
  const gender = watch('gender');

  return (
    <form
      id={stepFormId(STEP.basicInfo)}
      className={styles.step}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Basic information"
    >
      <StaggeredEntrance index={0} {...ENTRANCE}>
        <StepHeader
          icon="personOutline"
          title="Basic Information"
          subtitle="Tell us about yourself"
        />
      </StaggeredEntrance>

      <StaggeredEntrance index={1} {...ENTRANCE} className={styles.afterHeader}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.groupLabel}>Gender</legend>
          <div className={styles.twoColumns}>
            {GENDER_OPTIONS.map((option) => {
              const selected = gender === option.value;
              return (
                <ChoiceTile
                  key={option.value}
                  type="radio"
                  layout="tile"
                  value={option.value}
                  selected={selected}
                  {...register('gender')}
                >
                  <Icon name={option.icon} size={36} />
                  <span className={cn(styles.choiceTitle, selected && styles.selectedText)}>
                    {option.label}
                  </span>
                </ChoiceTile>
              );
            })}
          </div>
        </fieldset>
      </StaggeredEntrance>

      <StaggeredEntrance index={2} {...ENTRANCE} className={styles.gapLarge}>
        <GlassCard padding={20} opacity={0.1} blurAmount={12} tone="onGradient">
          <label htmlFor="onboarding-age" className={cardStyles.label}>
            Age
          </label>
          <MeasureField
            id="onboarding-age"
            className={cardStyles.fieldGap}
            valueSize="large"
            suffix="years"
            inputMode="numeric"
            error={errors.age?.message}
            {...register('age')}
          />
        </GlassCard>
      </StaggeredEntrance>

      <StaggeredEntrance index={3} {...ENTRANCE} className={styles.gap}>
        <MeasureSliderCard
          id="onboarding-height"
          name={height.field.name}
          label="Height"
          unit="cm"
          sliderRange={HEIGHT_SLIDER_CM}
          value={height.field.value}
          onChange={height.field.onChange}
          onBlur={height.field.onBlur}
          inputRef={height.field.ref}
          error={errors.heightCm?.message}
        />
      </StaggeredEntrance>

      <StaggeredEntrance index={4} {...ENTRANCE} className={styles.gap}>
        <MeasureSliderCard
          id="onboarding-weight"
          name={weight.field.name}
          label="Weight"
          unit="kg"
          sliderRange={WEIGHT_SLIDER_KG}
          value={weight.field.value}
          onChange={weight.field.onChange}
          onBlur={weight.field.onBlur}
          inputRef={weight.field.ref}
          error={errors.weightKg?.message}
        />
      </StaggeredEntrance>
    </form>
  );
}

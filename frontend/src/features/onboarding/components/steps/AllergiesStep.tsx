import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { Icon, TextField } from '@/components';
import { cn } from '@/lib/utils/cn';
import { COMMON_ALLERGIES, STEP, stepFormId, type CommonAllergy } from '../../constants';
import { useDraftSync } from '../../hooks/useDraftSync';
import { allergiesSchema, type AllergiesFormValues } from '../../schemas/allergiesSchema';
import { ChoiceTile } from '../ChoiceTile';
import { StepHeader } from '../StepHeader';
import styles from './AllergiesStep.module.css';
import stepStyles from './Step.module.css';

export interface AllergiesStepProps {
  defaultValues: AllergiesFormValues;
  onDraftChange: (values: AllergiesFormValues) => void;
  /** The final list for POST /onboarding/allergies (empty for "None"). */
  onSubmit: (allergies: string[]) => void;
}

/** step_allergies.dart: common allergy chips, "None", and an optional free-text field. */
export function AllergiesStep({ defaultValues, onDraftChange, onSubmit }: AllergiesStepProps) {
  const form = useForm<AllergiesFormValues, unknown, string[]>({
    resolver: zodResolver(allergiesSchema),
    defaultValues,
  });
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;
  useDraftSync(form, onDraftChange);
  const selected = useController({ control, name: 'selected' });
  const none = useController({ control, name: 'none' });
  const isNone = none.field.value;

  const toggleAllergy = (allergy: CommonAllergy) => {
    const current = selected.field.value;
    selected.field.onChange(
      current.includes(allergy)
        ? current.filter((name) => name !== allergy)
        : [...current, allergy],
    );
  };

  const toggleNone = () => {
    if (!isNone) {
      setValue('selected', []);
      setValue('other', '');
    }
    none.field.onChange(!isNone);
  };

  return (
    <form
      id={stepFormId(STEP.allergies)}
      className={stepStyles.step}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Food allergies"
    >
      <StepHeader
        icon="healthAndSafetyOutlined"
        title="Food Allergies"
        subtitle="Select any food allergies or intolerances"
      />

      <fieldset className={cn(stepStyles.fieldset, stepStyles.afterHeader)}>
        <legend className="visually-hidden">Common allergies</legend>
        <div className={styles.chips}>
          {COMMON_ALLERGIES.map((allergy) => {
            const checked = selected.field.value.includes(allergy.value);
            return (
              <ChoiceTile
                key={allergy.value}
                type="checkbox"
                layout="chip"
                name={selected.field.name}
                value={allergy.value}
                checked={checked}
                selected={checked}
                disabled={isNone}
                onChange={() => toggleAllergy(allergy.value)}
              >
                <Icon name={allergy.icon} size={18} />
                <span className={cn(styles.chipLabel, checked && stepStyles.selectedText)}>
                  {allergy.value}
                </span>
                {checked && <Icon name="checkCircle" size={16} />}
              </ChoiceTile>
            );
          })}
        </div>
      </fieldset>

      <ChoiceTile
        className={styles.none}
        type="checkbox"
        layout="toggle"
        name={none.field.name}
        checked={isNone}
        selected={isNone}
        onChange={toggleNone}
        onBlur={none.field.onBlur}
      >
        <Icon name="checkCircleOutline" size={18} />
        <span className={cn(styles.chipLabel, isNone && stepStyles.selectedText)}>None</span>
      </ChoiceTile>

      {!isNone && (
        <TextField
          className={styles.other}
          variant="glass"
          label="Other allergies (optional)"
          helperText="e.g. Strawberries, kiwi (separate with commas)"
          autoComplete="off"
          error={errors.other?.message}
          {...register('other')}
        />
      )}
    </form>
  );
}

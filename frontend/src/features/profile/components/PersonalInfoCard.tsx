import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components';
import type { PersonalInfo, PersonalInfoForm } from '../schemas/personalInfoSchema';
import { ProfileField } from './ProfileField';
import { SectionCard } from './SectionCard';
import styles from './PersonalInfoCard.module.css';

export const PERSONAL_INFO_FORM_ID = 'profile-personal-info';

export interface PersonalInfoCardProps {
  form: UseFormReturn<PersonalInfoForm, unknown, PersonalInfo>;
  editing: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

/** "Personal Information": name, age, height and weight (read-only until Edit). */
export function PersonalInfoCard({
  form,
  editing,
  saving,
  onSave,
  onCancel,
}: PersonalInfoCardProps) {
  const {
    register,
    formState: { errors },
  } = form;
  const readOnly = !editing || saving;
  return (
    <SectionCard title="Personal Information" icon="personOutline">
      <form
        id={PERSONAL_INFO_FORM_ID}
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <ProfileField
          label="Full Name"
          autoComplete="name"
          readOnly={readOnly}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <div className={styles.row}>
          <ProfileField
            label="Age"
            inputMode="numeric"
            readOnly={readOnly}
            error={errors.age?.message}
            {...register('age')}
          />
          <ProfileField
            label="Height (cm)"
            inputMode="decimal"
            readOnly={readOnly}
            error={errors.heightCm?.message}
            {...register('heightCm')}
          />
        </div>
        <div className={styles.row}>
          <ProfileField
            label="Weight (kg)"
            inputMode="decimal"
            readOnly={readOnly}
            error={errors.weightKg?.message}
            {...register('weightKg')}
          />
        </div>
        {editing && (
          <div className={styles.actions}>
            <Button variant="text" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} loadingLabel="Saving profile">
              Save changes
            </Button>
          </div>
        )}
      </form>
    </SectionCard>
  );
}

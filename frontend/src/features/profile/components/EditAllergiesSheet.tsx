import { BottomSheet, Icon, showSnackbar, TextField } from '@/components';
import { allergiesFormValuesFrom, COMMON_ALLERGIES, useAllergiesForm } from '@/features/onboarding';
import { getErrorMessage } from '@/lib/api';
import { useUpdateAllergies } from '../api/useProfileMutations';
import { SheetForm } from './SheetForm';
import styles from './EditAllergiesSheet.module.css';

export interface EditAllergiesSheetProps {
  open: boolean;
  allergies: readonly string[];
  onClose: () => void;
}

/** `_editAllergiesDialog`: the common allergies as filter chips, "None", and any others. */
export function EditAllergiesSheet({ open, allergies, onClose }: EditAllergiesSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} label="Edit Allergies">
      {/* Remounted on every open, so the form starts from the saved list. */}
      {open && <AllergiesForm allergies={allergies} onDone={onClose} />}
    </BottomSheet>
  );
}

function AllergiesForm({
  allergies,
  onDone,
}: {
  allergies: readonly string[];
  onDone: () => void;
}) {
  const updateAllergies = useUpdateAllergies();
  const { form, isNone, isSelected, toggleAllergy, toggleNone } = useAllergiesForm({
    ...allergiesFormValuesFrom(allergies),
    none: allergies.length === 0,
  });
  const errors = form.formState.errors;

  const save = form.handleSubmit((list) =>
    updateAllergies.mutate(list, {
      onSuccess: () => {
        showSnackbar('Allergies updated');
        onDone();
      },
      onError: (error) => showSnackbar(getErrorMessage(error), 'error'),
    }),
  );

  return (
    <SheetForm
      title="Edit Allergies"
      onSubmit={(event) => void save(event)}
      onCancel={onDone}
      saving={updateAllergies.isPending}
      savingLabel="Saving allergies"
    >
      <fieldset className={styles.chips}>
        <legend className="visually-hidden">Common allergies</legend>
        {COMMON_ALLERGIES.map(({ value }) => (
          <Chip
            key={value}
            label={value}
            checked={isSelected(value)}
            disabled={isNone}
            onChange={() => toggleAllergy(value)}
          />
        ))}
        <Chip label="None" checked={isNone} onChange={toggleNone} />
      </fieldset>
      {!isNone && (
        <TextField
          label="Other allergies (optional)"
          helperText="Separate with commas, e.g. Strawberries, kiwi"
          autoComplete="off"
          error={errors.other?.message}
          {...form.register('other')}
        />
      )}
    </SheetForm>
  );
}

interface ChipProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

/** Material FilterChip: a checkbox that shows a tick when selected. */
function Chip({ label, checked, disabled, onChange }: ChipProps) {
  return (
    <label className={styles.chip} data-checked={checked || undefined}>
      <input
        type="checkbox"
        className="visually-hidden"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      {checked && <Icon name="check" size={18} />}
      {label}
    </label>
  );
}

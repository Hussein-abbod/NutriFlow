import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import type { CommonAllergy } from '../constants';
import { allergiesSchema, type AllergiesFormValues } from '../schemas/allergiesSchema';

/**
 * The allergies form (onboarding step and profile sheet): common chips, "None" (clears and
 * locks the chips) and free text. Submitting outputs the list for the API.
 */
export function useAllergiesForm(defaultValues: AllergiesFormValues) {
  const form = useForm<AllergiesFormValues, unknown, string[]>({
    resolver: zodResolver(allergiesSchema),
    defaultValues,
  });
  const selected = useController({ control: form.control, name: 'selected' });
  const none = useController({ control: form.control, name: 'none' });
  const isNone = none.field.value;

  const isSelected = (allergy: CommonAllergy) => selected.field.value.includes(allergy);

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
      form.setValue('selected', []);
      form.setValue('other', '');
    }
    none.field.onChange(!isNone);
  };

  return {
    form,
    isNone,
    isSelected,
    toggleAllergy,
    toggleNone,
    selectedName: selected.field.name,
    noneField: none.field,
  };
}

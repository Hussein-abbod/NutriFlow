import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { showSnackbar } from '@/components';
import { reportFormError } from '@/lib/forms/reportFormError';
import type { UserDto } from '@/types/api';
import { useUpdateProfile } from '../api/useProfileMutations';
import {
  personalInfoFromUser,
  personalInfoSchema,
  type PersonalInfo,
  type PersonalInfoForm,
} from '../schemas/personalInfoSchema';

const BACKEND_FIELDS = {
  full_name: 'fullName',
  age: 'age',
  height_cm: 'heightCm',
  weight_kg: 'weightKg',
} as const;

/** `_isEditing` / `_saveProfile` of profile_tab.dart. */
export function usePersonalInfoForm(user: UserDto) {
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const form = useForm<PersonalInfoForm, unknown, PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalInfoFromUser(user),
  });
  const { reset } = form;

  // Outside edit mode the fields always show the saved user (also after Cancel or a refetch).
  useEffect(() => {
    if (!editing) reset(personalInfoFromUser(user));
  }, [editing, user, reset]);

  const save = form.handleSubmit((values) =>
    updateProfile.mutate(
      {
        full_name: values.fullName,
        age: values.age,
        height_cm: values.heightCm,
        weight_kg: values.weightKg,
      },
      {
        onSuccess: () => {
          setEditing(false);
          showSnackbar('Profile updated successfully');
        },
        onError: (error) => reportFormError(error, form.setError, BACKEND_FIELDS),
      },
    ),
  );

  const startEditing = () => {
    setEditing(true);
    // After React re-renders the fields as editable.
    setTimeout(() => form.setFocus('fullName'), 0);
  };

  const cancel = () => setEditing(false);

  return {
    form,
    editing,
    saving: updateProfile.isPending,
    editOrSave: () => (editing ? void save() : startEditing()),
    save,
    cancel,
  };
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { BottomSheet, PasswordField, showSnackbar } from '@/components';
import { PASSWORD_RULES_HINT } from '@/features/auth';
import { ApiError } from '@/lib/api';
import { reportFormError } from '@/lib/forms/reportFormError';
import { useChangePassword } from '../api/useProfileMutations';
import {
  changePasswordSchema,
  type ChangePasswordForm,
  type ChangePasswordValues,
} from '../schemas/changePasswordSchema';
import { SheetForm } from './SheetForm';

const EMPTY: ChangePasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

export interface ChangePasswordSheetProps {
  open: boolean;
  onClose: () => void;
}

/** Change Password (Flutter only showed the dialog; this one calls PUT /users/password). */
export function ChangePasswordSheet({ open, onClose }: ChangePasswordSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} label="Change Password">
      {open && <ChangePasswordForm onDone={onClose} />}
    </BottomSheet>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordForm, unknown, ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  const save = handleSubmit(({ currentPassword, newPassword }) =>
    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          showSnackbar('Password changed. Other devices have been signed out.');
          onDone();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 400) {
            setError('currentPassword', { type: 'server', message: error.message });
            return;
          }
          reportFormError(error, setError, {
            current_password: 'currentPassword',
            new_password: 'newPassword',
          });
        },
      },
    ),
  );

  return (
    <SheetForm
      title="Change Password"
      onSubmit={(event) => void save(event)}
      onCancel={onDone}
      saving={changePassword.isPending}
      savingLabel="Changing password"
    >
      <PasswordField
        label="Current Password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <PasswordField
        label="New Password"
        autoComplete="new-password"
        helperText={PASSWORD_RULES_HINT}
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <PasswordField
        label="Confirm New Password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
    </SheetForm>
  );
}

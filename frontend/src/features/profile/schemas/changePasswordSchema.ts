import { z } from 'zod';
import { newPasswordField } from '@/features/auth';

/** backend: schemas.common.ExistingPassword */
const CURRENT_PASSWORD_MAX_LENGTH = 128;

/** Change password (PUT /users/password): current password + a new one, typed twice. */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Enter your current password')
      .max(CURRENT_PASSWORD_MAX_LENGTH, 'Password is too long'),
    newPassword: newPasswordField,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'Choose a password different from the current one',
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type ChangePasswordForm = z.input<typeof changePasswordSchema>;
export type ChangePasswordValues = z.output<typeof changePasswordSchema>;

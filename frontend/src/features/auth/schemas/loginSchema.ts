import { z } from 'zod';
import { EMAIL_MAX_LENGTH, LOGIN_PASSWORD_MAX_LENGTH } from './fieldRules';

const INVALID_EMAIL = 'Please enter a valid email';

/** login_screen.dart validators + backend UserLogin limits. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, INVALID_EMAIL)
    .max(EMAIL_MAX_LENGTH, INVALID_EMAIL)
    .pipe(z.email(INVALID_EMAIL)),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .max(LOGIN_PASSWORD_MAX_LENGTH, 'Password is too long'),
});

export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginFormOutput = z.output<typeof loginSchema>;

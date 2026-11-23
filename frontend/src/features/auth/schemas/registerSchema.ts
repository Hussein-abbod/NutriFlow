import { z } from 'zod';
import {
  EMAIL_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  utf8ByteLength,
} from './fieldRules';

/** step_welcome.dart validators + backend UserCreate limits. */
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Required')
      .max(FULL_NAME_MAX_LENGTH, `Max ${FULL_NAME_MAX_LENGTH} characters`),
    email: z
      .string()
      .trim()
      .min(1, 'Required')
      .max(EMAIL_MAX_LENGTH, 'Invalid email')
      .pipe(z.email('Invalid email')),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Min ${PASSWORD_MIN_LENGTH} characters`)
      .max(PASSWORD_MAX_LENGTH, `Max ${PASSWORD_MAX_LENGTH} characters`)
      .refine((value) => utf8ByteLength(value) <= PASSWORD_MAX_LENGTH, 'Password is too long'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterFormOutput = z.output<typeof registerSchema>;

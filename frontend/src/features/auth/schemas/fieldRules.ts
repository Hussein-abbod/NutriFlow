import { z } from 'zod';

/** Limits shared with the backend (backend/app/schemas/common.py). */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt uses at most 72 bytes
export const LOGIN_PASSWORD_MAX_LENGTH = 128;
export const FULL_NAME_MAX_LENGTH = 255;
export const EMAIL_MAX_LENGTH = 254;

export const utf8ByteLength = (value: string) => new TextEncoder().encode(value).length;

export const PASSWORD_RULES_HINT = 'At least 8 characters, with a letter and a number';

/**
 * A password the user chooses (sign-up, password change). Same rules as the backend's
 * `NewPassword`: 8–72 characters, at most 72 UTF-8 bytes (bcrypt), a letter and a number,
 * no space at either end.
 */
export const newPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Min ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Max ${PASSWORD_MAX_LENGTH} characters`)
  .refine((value) => utf8ByteLength(value) <= PASSWORD_MAX_LENGTH, 'Password is too long')
  .refine(
    (value) => /\p{L}/u.test(value) && /\p{N}/u.test(value),
    'Use at least one letter and one number',
  )
  .refine((value) => value.trim() === value, 'Remove the space at the start or end');

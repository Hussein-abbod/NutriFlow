import { z } from 'zod';

interface NumberFieldOptions {
  min: number;
  max: number;
  /** One friendly message for empty, non-numeric and out-of-range input. */
  message: string;
  integer?: boolean;
}

/** A text input that must hold a number in `[min, max]`; outputs the number. */
export function numberField({ min, max, message, integer = false }: NumberFieldOptions) {
  const number = z.number({ error: message }).min(min, message).max(max, message);
  return z
    .string()
    .trim()
    .min(1, message)
    .pipe(z.coerce.number<string>({ error: message }).pipe(integer ? number.int(message) : number));
}

/** Parse a numeric text field without validating it (NaN when it is not a number). */
export const parseNumber = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

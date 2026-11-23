import { z } from 'zod';
import { COMMON_ALLERGIES, type CommonAllergy } from '../constants';
import { MAX_ALLERGIES, MAX_ALLERGY_LENGTH, MAX_OTHER_ALLERGIES_INPUT } from './limits';

// A non-empty tuple for z.enum; COMMON_ALLERGIES is a non-empty literal list.
const COMMON_VALUES = COMMON_ALLERGIES.map((allergy) => allergy.value) as [
  CommonAllergy,
  ...CommonAllergy[],
];

/** "Strawberries, kiwi ,, Kiwi" → ["Strawberries", "kiwi"] (trimmed, no empties, no duplicates). */
export function splitAllergies(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of text.split(',')) {
    const name = part.trim().replace(/\s+/g, ' ');
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      result.push(name);
    }
  }
  return result;
}

/**
 * step_allergies.dart: common chips, "None", and free text for anything else.
 * Outputs the list sent to POST /onboarding/allergies ("None" → empty list).
 */
export const allergiesSchema = z
  .object({
    selected: z.array(z.enum(COMMON_VALUES)),
    none: z.boolean(),
    other: z.string().max(MAX_OTHER_ALLERGIES_INPUT, `Max ${MAX_OTHER_ALLERGIES_INPUT} characters`),
  })
  .transform(({ selected, none, other }, ctx): string[] => {
    if (none) return [];
    const custom = splitAllergies(other);
    if (custom.some((name) => name.length > MAX_ALLERGY_LENGTH)) {
      ctx.addIssue({
        code: 'custom',
        path: ['other'],
        message: `Each allergy can be at most ${MAX_ALLERGY_LENGTH} characters`,
      });
      return z.NEVER;
    }
    const known = new Set(selected.map((name) => name.toLowerCase()));
    const all = [...selected, ...custom.filter((name) => !known.has(name.toLowerCase()))];
    if (all.length > MAX_ALLERGIES) {
      ctx.addIssue({
        code: 'custom',
        path: ['other'],
        message: `You can list up to ${MAX_ALLERGIES} allergies`,
      });
      return z.NEVER;
    }
    return all;
  });

export type AllergiesFormValues = z.input<typeof allergiesSchema>;

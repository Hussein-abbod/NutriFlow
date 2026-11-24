import { z } from 'zod';
import { FULL_NAME_MAX_LENGTH } from '@/features/auth';
import { AGE_RANGE, HEIGHT_RANGE_CM, WEIGHT_RANGE_KG } from '@/features/onboarding';
import { numberField } from '@/lib/forms/numberField';
import type { UserDto } from '@/types/api';

/** "Personal Information" of profile_tab.dart, with the backend's ranges (PUT /users/profile). */
export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(FULL_NAME_MAX_LENGTH, `Max ${FULL_NAME_MAX_LENGTH} characters`),
  age: numberField({
    ...AGE_RANGE,
    integer: true,
    message: `Enter a valid age (${AGE_RANGE.min}-${AGE_RANGE.max})`,
  }),
  heightCm: numberField({
    ...HEIGHT_RANGE_CM,
    message: `Enter ${HEIGHT_RANGE_CM.min}-${HEIGHT_RANGE_CM.max} cm`,
  }),
  weightKg: numberField({
    ...WEIGHT_RANGE_KG,
    message: `Enter ${WEIGHT_RANGE_KG.min}-${WEIGHT_RANGE_KG.max} kg`,
  }),
});

export type PersonalInfoForm = z.input<typeof personalInfoSchema>;
export type PersonalInfo = z.output<typeof personalInfoSchema>;

const asText = (value: number | null) => (value === null ? '' : String(value));

export function personalInfoFromUser(user: UserDto): PersonalInfoForm {
  return {
    fullName: user.full_name ?? '',
    age: asText(user.age),
    heightCm: asText(user.height_cm),
    weightKg: asText(user.weight_kg),
  };
}

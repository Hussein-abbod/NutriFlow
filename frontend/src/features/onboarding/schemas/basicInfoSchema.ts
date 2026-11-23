import { z } from 'zod';
import { AGE_RANGE, HEIGHT_RANGE_CM, WEIGHT_RANGE_KG } from './limits';
import { numberField } from './numberField';

/** step_basic_info.dart: gender, age, height, weight. */
export const basicInfoSchema = z.object({
  gender: z.enum(['male', 'female'], { error: 'Please select your gender' }),
  age: numberField({
    ...AGE_RANGE,
    integer: true,
    message: `Enter a valid age (${AGE_RANGE.min}-${AGE_RANGE.max})`,
  }),
  heightCm: numberField({
    ...HEIGHT_RANGE_CM,
    message: `Enter a height between ${HEIGHT_RANGE_CM.min} and ${HEIGHT_RANGE_CM.max} cm`,
  }),
  weightKg: numberField({
    ...WEIGHT_RANGE_KG,
    message: `Enter a weight between ${WEIGHT_RANGE_KG.min} and ${WEIGHT_RANGE_KG.max} kg`,
  }),
});

export type BasicInfoFormValues = z.input<typeof basicInfoSchema>;
export type BasicInfo = z.output<typeof basicInfoSchema>;

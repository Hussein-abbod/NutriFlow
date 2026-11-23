import { z } from 'zod';
import type { ActivityLevel } from '@/types/api';

const ACTIVITY_LEVELS = [
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extra_active',
] as const satisfies readonly ActivityLevel[];

const activityLevel = z.enum(ACTIVITY_LEVELS, { error: 'Please select an activity level' });

/** step_activity_level.dart: exactly one level must be picked. */
export const activitySchema = z.object({
  activityLevel: activityLevel.nullable().pipe(activityLevel),
});

export type ActivityFormValues = z.input<typeof activitySchema>;
export type ActivityFormOutput = z.output<typeof activitySchema>;

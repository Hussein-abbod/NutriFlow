import { z } from 'zod';
import type { GoalType } from '@/types/api';
import { GOAL_PERIOD_RANGE_WEEKS, WEIGHT_RANGE_KG } from './limits';
import { numberField } from './numberField';

const GOAL_TYPES = [
  'lose_weight',
  'maintain_weight',
  'gain_weight',
] as const satisfies readonly GoalType[];

const goalType = z.enum(GOAL_TYPES, { error: 'Please select a goal' });

const TARGET_MESSAGE = `Enter a target weight between ${WEIGHT_RANGE_KG.min} and ${WEIGHT_RANGE_KG.max} kg`;
const PERIOD_MESSAGE = `Choose between ${GOAL_PERIOD_RANGE_WEEKS.min} and ${GOAL_PERIOD_RANGE_WEEKS.max} weeks`;

const targetWeight = numberField({ ...WEIGHT_RANGE_KG, message: TARGET_MESSAGE });

export const formatKg = (kg: number) => `${Number(kg.toFixed(1))} kg`;

export interface GoalChoice {
  goalType: GoalType;
  /** `null` for maintain goals. */
  targetWeightKg: number | null;
  periodWeeks: number | null;
}

/**
 * step_goal_selection.dart. Lose/gain goals need a target on the right side of the current
 * weight (the backend checks the same rule) and a period from the slider.
 */
export function createGoalSchema(currentWeightKg: number) {
  return z
    .object({
      goalType: goalType.nullable().pipe(goalType),
      targetWeightKg: z.string(),
      periodWeeks: z
        .number({ error: PERIOD_MESSAGE })
        .int(PERIOD_MESSAGE)
        .min(GOAL_PERIOD_RANGE_WEEKS.min, PERIOD_MESSAGE)
        .max(GOAL_PERIOD_RANGE_WEEKS.max, PERIOD_MESSAGE),
    })
    .transform((values, ctx): GoalChoice => {
      if (values.goalType === 'maintain_weight') {
        return { goalType: values.goalType, targetWeightKg: null, periodWeeks: null };
      }
      const target = targetWeight.safeParse(values.targetWeightKg);
      if (!target.success) {
        ctx.addIssue({ code: 'custom', path: ['targetWeightKg'], message: TARGET_MESSAGE });
        return z.NEVER;
      }
      const losing = values.goalType === 'lose_weight';
      const wrongDirection = losing
        ? target.data >= currentWeightKg
        : target.data <= currentWeightKg;
      if (wrongDirection) {
        const side = losing ? 'below' : 'above';
        ctx.addIssue({
          code: 'custom',
          path: ['targetWeightKg'],
          message: `Must be ${side} your current weight (${formatKg(currentWeightKg)})`,
        });
        return z.NEVER;
      }
      return {
        goalType: values.goalType,
        targetWeightKg: target.data,
        periodWeeks: values.periodWeeks,
      };
    });
}

export type GoalFormValues = z.input<ReturnType<typeof createGoalSchema>>;

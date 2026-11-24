import { z } from 'zod';

/** backend: schemas.coach.MESSAGE_MAX_LENGTH */
export const COACH_MESSAGE_MAX_LENGTH = 2000;

export const coachMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Type a message first.')
    .max(
      COACH_MESSAGE_MAX_LENGTH,
      `Messages can be at most ${COACH_MESSAGE_MAX_LENGTH} characters.`,
    ),
});

export type CoachMessageForm = z.input<typeof coachMessageSchema>;
export type CoachMessageValues = z.output<typeof coachMessageSchema>;

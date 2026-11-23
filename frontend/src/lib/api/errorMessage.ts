import { ApiError } from './ApiError';

export const UNKNOWN_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/** A message that is safe to show the user (only ApiError messages come from our backend). */
export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : UNKNOWN_ERROR_MESSAGE;
}

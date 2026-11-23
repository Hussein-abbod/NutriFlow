import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';
import { getErrorMessage, UNKNOWN_ERROR_MESSAGE } from './errorMessage';

describe('getErrorMessage', () => {
  it('uses the backend message of an ApiError', () => {
    const error = new ApiError('No active goal found', { status: 404, kind: 'http' });
    expect(getErrorMessage(error)).toBe('No active goal found');
  });

  it('never shows the text of unexpected errors', () => {
    expect(getErrorMessage(new TypeError('x is undefined'))).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(getErrorMessage('boom')).toBe(UNKNOWN_ERROR_MESSAGE);
  });
});

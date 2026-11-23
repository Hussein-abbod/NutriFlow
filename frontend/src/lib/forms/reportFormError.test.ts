import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSnackbarStore } from '@/components/Snackbar/snackbarStore';
import { ApiError } from '@/lib/api/ApiError';
import { reportFormError } from './reportFormError';

interface Values {
  email: string;
  fullName: string;
}

describe('reportFormError', () => {
  afterEach(() => useSnackbarStore.getState().dismiss());

  it('puts backend field errors on the mapped form fields', () => {
    const setError = vi.fn();
    const error = new ApiError('bad', {
      status: 422,
      kind: 'http',
      fieldErrors: { full_name: 'Too long', unknown: 'x' },
    });
    reportFormError<Values>(error, setError, { full_name: 'fullName', email: 'email' });
    expect(setError).toHaveBeenCalledWith('fullName', { type: 'server', message: 'Too long' });
    expect(useSnackbarStore.getState().current).toBeNull();
  });

  it('shows other API errors in an error snackbar', () => {
    const setError = vi.fn();
    reportFormError<Values>(
      new ApiError('Invalid email or password.', { status: 401, kind: 'http' }),
      setError,
      {},
    );
    expect(setError).not.toHaveBeenCalled();
    expect(useSnackbarStore.getState().current).toMatchObject({
      message: 'Invalid email or password.',
      tone: 'error',
    });
  });

  it('uses a generic message for unexpected errors', () => {
    reportFormError<Values>(new Error('boom'), vi.fn(), {});
    expect(useSnackbarStore.getState().current?.message).toBe(
      'Something went wrong. Please try again.',
    );
  });
});

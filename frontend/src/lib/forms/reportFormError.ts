import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { showSnackbar } from '@/components/Snackbar/snackbarStore';
import { ApiError } from '@/lib/api/ApiError';

const UNKNOWN_ERROR = 'Something went wrong. Please try again.';

/**
 * Show a failed form submission to the user: backend field errors (422) go inline on the
 * matching inputs; everything else becomes an error snackbar (as in the Flutter app).
 * `fieldMap` maps backend field names to form field names.
 */
export function reportFormError<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  fieldMap: Partial<Record<string, Path<TValues>>>,
): void {
  if (error instanceof ApiError) {
    let appliedInline = false;
    for (const [backendField, message] of Object.entries(error.fieldErrors)) {
      const formField = fieldMap[backendField];
      if (formField) {
        setError(formField, { type: 'server', message });
        appliedInline = true;
      }
    }
    if (!appliedInline) showSnackbar(error.message, 'error');
    return;
  }
  showSnackbar(UNKNOWN_ERROR, 'error');
}

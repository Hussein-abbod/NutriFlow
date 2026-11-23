import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { SnackbarHost } from '@/components';

/** Render an onboarding step with the shared Next button (it submits the step's form by id). */
export function renderStep(step: ReactElement, formId: string) {
  return render(
    <>
      {step}
      <button type="submit" form={formId}>
        Next
      </button>
      <SnackbarHost />
    </>,
  );
}

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingNav } from './OnboardingNav';

function setup(locked: boolean) {
  const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
  const onBack = vi.fn();
  render(
    <>
      <form id="step-form" onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)} />
      <OnboardingNav
        formId="step-form"
        isLastStep={false}
        busy={false}
        locked={locked}
        onBack={onBack}
      />
    </>,
  );
  return { onSubmit, onBack };
}

describe('OnboardingNav', () => {
  it('submits the current step form and goes back', async () => {
    const { onSubmit, onBack } = setup(false);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('ignores the second click of a double-click while the page slides', async () => {
    const { onSubmit, onBack } = setup(true);
    await userEvent.dblClick(screen.getByRole('button', { name: 'Next' }));
    await userEvent.dblClick(screen.getByRole('button', { name: 'Back' }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('still accepts a single click while the page slides', async () => {
    const { onSubmit } = setup(true);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('labels the last step "Confirm & Finish"', () => {
    render(<OnboardingNav formId="f" isLastStep busy={false} locked={false} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Confirm & Finish' })).toBeInTheDocument();
  });
});

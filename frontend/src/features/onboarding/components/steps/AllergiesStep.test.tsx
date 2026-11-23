import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderStep } from '@/test/renderStep';
import { STEP, stepFormId } from '../../constants';
import { AllergiesStep } from './AllergiesStep';

function setup() {
  const onSubmit = vi.fn();
  renderStep(
    <AllergiesStep
      defaultValues={{ selected: [], none: false, other: '' }}
      onDraftChange={vi.fn()}
      onSubmit={onSubmit}
    />,
    stepFormId(STEP.allergies),
  );
  return { onSubmit, user: userEvent.setup() };
}

describe('AllergiesStep', () => {
  it('submits an empty list when nothing is picked (allergies are optional)', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([], expect.anything()));
  });

  it('combines chips and the free-text field', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('checkbox', { name: 'Peanuts' }));
    await user.click(screen.getByRole('checkbox', { name: 'Fish' }));
    await user.click(screen.getByRole('checkbox', { name: 'Fish' }));
    await user.type(screen.getByLabelText('Other allergies (optional)'), 'Kiwi, Mango');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(['Peanuts', 'Kiwi', 'Mango'], expect.anything()),
    );
  });

  it('"None" clears and disables the chips and hides the text field', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('checkbox', { name: 'Eggs' }));
    await user.click(screen.getByRole('checkbox', { name: 'None' }));

    expect(screen.getByRole('checkbox', { name: 'Eggs' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Eggs' })).toBeDisabled();
    expect(screen.queryByLabelText('Other allergies (optional)')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([], expect.anything()));
  });

  it('shows an inline error for an overlong allergy', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByLabelText('Other allergies (optional)'));
    await user.paste('x'.repeat(101));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('Each allergy can be at most 100 characters'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

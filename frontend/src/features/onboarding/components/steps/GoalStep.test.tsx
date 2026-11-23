import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderStep } from '@/test/renderStep';
import { STEP, stepFormId } from '../../constants';
import type { GoalFormValues } from '../../schemas/goalSchema';
import { GoalStep } from './GoalStep';

const emptyGoal: GoalFormValues = { goalType: null, targetWeightKg: '', periodWeeks: 12 };

function setup(defaultValues: GoalFormValues = emptyGoal) {
  const onSubmit = vi.fn();
  renderStep(
    <GoalStep
      currentWeightKg={70}
      defaultValues={defaultValues}
      onDraftChange={vi.fn()}
      onSubmit={onSubmit}
    />,
    stepFormId(STEP.goal),
  );
  return { onSubmit, user: userEvent.setup() };
}

describe('GoalStep', () => {
  it('asks for a goal in a snackbar', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please select a goal');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('needs no target or period for maintain', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Maintain' }));
    expect(screen.queryByLabelText('Target Weight')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { goalType: 'maintain_weight', targetWeightKg: null, periodWeeks: null },
        expect.anything(),
      ),
    );
  });

  it('suggests a target 5 kg away and submits target + period', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Lose Weight' }));
    expect(screen.getByLabelText('Target Weight')).toHaveValue('65.0');
    fireEvent.change(screen.getByRole('slider', { name: 'Goal Period' }), {
      target: { value: '20' },
    });
    expect(screen.getByText('20 weeks')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { goalType: 'lose_weight', targetWeightKg: 65, periodWeeks: 20 },
        expect.anything(),
      ),
    );
  });

  it('flips the suggestion when switching direction, but keeps a typed target that fits', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Lose Weight' }));
    await user.click(screen.getByRole('radio', { name: 'Gain Weight' }));
    expect(screen.getByLabelText('Target Weight')).toHaveValue('75.0');

    await user.clear(screen.getByLabelText('Target Weight'));
    await user.type(screen.getByLabelText('Target Weight'), '80');
    await user.click(screen.getByRole('radio', { name: 'Maintain' }));
    await user.click(screen.getByRole('radio', { name: 'Gain Weight' }));
    expect(screen.getByLabelText('Target Weight')).toHaveValue('80');
  });

  it('rejects a target on the wrong side of the current weight', async () => {
    const { onSubmit, user } = setup({
      goalType: 'lose_weight',
      targetWeightKg: '72',
      periodWeeks: 12,
    });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText('Must be below your current weight (70 kg)'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

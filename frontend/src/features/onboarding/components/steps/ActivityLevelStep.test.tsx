import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderStep } from '@/test/renderStep';
import { STEP, stepFormId } from '../../constants';
import { ActivityLevelStep } from './ActivityLevelStep';

function setup(activityLevel: 'sedentary' | null = null) {
  const onSubmit = vi.fn();
  renderStep(
    <ActivityLevelStep
      defaultValues={{ activityLevel }}
      onDraftChange={vi.fn()}
      onSubmit={onSubmit}
    />,
    stepFormId(STEP.activity),
  );
  return { onSubmit, user: userEvent.setup() };
}

describe('ActivityLevelStep', () => {
  it('lists the five levels with their descriptions', () => {
    setup();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByRole('radio', { name: 'Moderately Active' })).toHaveAccessibleDescription(
      'Moderate exercise 3-5 days/week',
    );
  });

  it('asks for a level in a snackbar when none is picked', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please select an activity level');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the picked level', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Very Active' }));
    expect(screen.getByRole('radio', { name: 'Very Active' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ activityLevel: 'very_active' }, expect.anything()),
    );
  });

  it('restores a saved draft', () => {
    setup('sedentary');
    expect(screen.getByRole('radio', { name: 'Sedentary' })).toBeChecked();
  });
});

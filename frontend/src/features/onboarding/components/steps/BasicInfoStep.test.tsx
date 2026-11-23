import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderStep } from '@/test/renderStep';
import { STEP, stepFormId } from '../../constants';
import { BasicInfoStep } from './BasicInfoStep';

const defaults = { gender: 'male', age: '25', heightCm: '170.0', weightKg: '70.0' } as const;

function setup(onSubmit = vi.fn(), onDraftChange = vi.fn()) {
  renderStep(
    <BasicInfoStep defaultValues={defaults} onDraftChange={onDraftChange} onSubmit={onSubmit} />,
    stepFormId(STEP.basicInfo),
  );
  return { onSubmit, onDraftChange, user: userEvent.setup() };
}

describe('BasicInfoStep', () => {
  it('shows the Flutter layout with the default values', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Basic Information' })).toBeInTheDocument();
    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Male' })).toBeChecked();
    expect(screen.getByLabelText('Age')).toHaveValue('25');
    expect(screen.getByText('170.0 cm')).toBeInTheDocument();
    expect(screen.getByText('70.0 kg')).toBeInTheDocument();
  });

  it('submits the parsed values', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Female' }));
    await user.clear(screen.getByLabelText('Age'));
    await user.type(screen.getByLabelText('Age'), '31');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { gender: 'female', age: 31, heightCm: 170, weightKg: 70 },
        expect.anything(),
      ),
    );
  });

  it('shows inline errors and does not continue', async () => {
    const { onSubmit, user } = setup();
    await user.clear(screen.getByLabelText('Age'));
    await user.type(screen.getByLabelText('Age'), '8');
    await user.clear(screen.getByLabelText('Height'));
    await user.type(screen.getByLabelText('Weight'), 'x');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Enter a valid age (10-100)')).toBeInTheDocument();
    expect(screen.getByText('Enter a height between 50 and 300 cm')).toBeInTheDocument();
    expect(screen.getByText('Enter a weight between 20 and 500 kg')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the slider and the text field in sync', async () => {
    const { user } = setup();
    fireEvent.change(screen.getByRole('slider', { name: 'Height slider' }), {
      target: { value: '182.3' },
    });
    expect(screen.getByLabelText('Height')).toHaveValue('182.3');
    expect(screen.getByText('182.3 cm')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Weight'));
    await user.type(screen.getByLabelText('Weight'), '260');
    // Beyond the slider range: the slider stays at its max, the readout shows the typed value.
    expect(screen.getByRole('slider', { name: 'Weight slider' })).toHaveValue('200');
    expect(screen.getByText('260.0 kg')).toBeInTheDocument();
  });

  it('reports every change as a draft', async () => {
    const { onDraftChange, user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Female' }));
    expect(onDraftChange).toHaveBeenLastCalledWith({ ...defaults, gender: 'female' });
  });
});

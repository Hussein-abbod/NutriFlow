import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderStep } from '@/test/renderStep';
import { STEP, stepFormId } from '../../constants';
import { SummaryStep } from './SummaryStep';
import { WelcomeBackStep } from './WelcomeBackStep';

const targets = {
  daily_calories: 1651.39,
  daily_protein: 140,
  daily_carbs: 169.64,
  daily_fat: 45.87,
};

describe('SummaryStep', () => {
  it('shows the rounded daily targets and the timeline', () => {
    renderStep(
      <SummaryStep targets={targets} periodWeeks={10} onConfirm={vi.fn()} />,
      stepFormId(STEP.summary),
    );
    expect(screen.getByRole('heading', { name: 'Your Plan is Ready!' })).toBeInTheDocument();
    expect(screen.getByText('1651 kcal')).toBeInTheDocument();
    expect(screen.getByText('140 grams of protein')).toBeInTheDocument();
    expect(screen.getByText('170 grams of carbs')).toBeInTheDocument();
    expect(screen.getByText('46 grams of fat')).toBeInTheDocument();
    expect(screen.getByText('10 weeks to reach your goal')).toBeInTheDocument();
  });

  it('hides the timeline for maintain goals', () => {
    renderStep(
      <SummaryStep targets={targets} periodWeeks={null} onConfirm={vi.fn()} />,
      stepFormId(STEP.summary),
    );
    expect(screen.queryByText(/weeks to reach your goal/)).not.toBeInTheDocument();
  });

  it('shows a spinner until targets exist and confirms on submit', async () => {
    const onConfirm = vi.fn();
    renderStep(
      <SummaryStep targets={null} periodWeeks={null} onConfirm={onConfirm} />,
      stepFormId(STEP.summary),
    );
    expect(screen.getByRole('progressbar', { name: 'Loading your plan' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe('WelcomeBackStep', () => {
  it('greets the user and continues', async () => {
    const onContinue = vi.fn();
    renderStep(<WelcomeBackStep name="Alice" onContinue={onContinue} />, stepFormId(STEP.welcome));
    expect(screen.getByRole('heading', { name: 'Welcome back, Alice!' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});

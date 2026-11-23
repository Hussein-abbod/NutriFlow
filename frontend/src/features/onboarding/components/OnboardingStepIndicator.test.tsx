import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';

describe('OnboardingStepIndicator', () => {
  it('marks completed and current segments', () => {
    render(<OnboardingStepIndicator current={1} total={6} />);
    const segments = screen.getAllByTestId('step-segment');
    expect(segments).toHaveLength(6);
    expect(segments[0]).toHaveClass('active');
    expect(segments[1]).toHaveClass('active', 'current');
    expect(segments[2]).not.toHaveClass('active');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Step 2 of 6');
  });
});

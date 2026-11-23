import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnimatedGradientRing } from './AnimatedGradientRing';

describe('AnimatedGradientRing', () => {
  it('exposes progress to assistive tech and renders children', () => {
    render(
      <AnimatedGradientRing progress={0.365} label="Calories consumed">
        <span>1003</span>
      </AnimatedGradientRing>,
    );
    const ring = screen.getByRole('progressbar', { name: 'Calories consumed' });
    expect(ring).toHaveAttribute('aria-valuenow', '37');
    expect(screen.getByText('1003')).toBeInTheDocument();
  });

  it('animates the arc from empty to the target', async () => {
    render(<AnimatedGradientRing progress={0.5} size={120} strokeWidth={10} label="Progress" />);
    const arc = screen.getByTestId('ring-arc');
    const circumference = 2 * Math.PI * 55;
    await waitFor(() =>
      expect(parseFloat(arc.style.strokeDashoffset)).toBeCloseTo(circumference * 0.5, 3),
    );
  });

  it('clamps out-of-range values and hides the arc at zero', () => {
    const { rerender } = render(<AnimatedGradientRing progress={1.7} label="Progress" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    rerender(<AnimatedGradientRing progress={-1} label="Progress" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.queryByTestId('ring-arc')).not.toBeInTheDocument();
  });
});

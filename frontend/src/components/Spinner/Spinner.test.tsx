import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders an accessible progress indicator', () => {
    render(<Spinner />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
  });

  it('applies size, color and a custom label', () => {
    render(<Spinner size={22} strokeWidth={2.5} color="white" label="Signing in" />);
    const spinner = screen.getByRole('progressbar', { name: 'Signing in' });
    expect(spinner).toHaveStyle({ width: '22px', height: '22px', color: 'rgb(255, 255, 255)' });
  });
});

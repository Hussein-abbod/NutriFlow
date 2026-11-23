import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
  it('is hidden from assistive tech when decorative', () => {
    const { container } = render(<Icon name="eco" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes an accessible name when labelled', () => {
    render(<Icon name="errorOutline" label="Error" size={48} />);
    const icon = screen.getByRole('img', { name: 'Error' });
    expect(icon).toHaveAttribute('width', '48');
  });
});

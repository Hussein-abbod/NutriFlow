import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('associates the label with the input and forwards the ref', async () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField label="Email" icon="emailOutlined" type="email" ref={ref} />);
    const input = screen.getByLabelText('Email');
    expect(ref.current).toBe(input);
    await userEvent.type(input, 'a@b.co');
    expect(input).toHaveValue('a@b.co');
  });

  it('shows an inline error linked through aria-describedby', () => {
    render(<TextField label="Email" error="Please enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Please enter a valid email');
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email');
  });

  it('renders the end adornment and glass variant', () => {
    const { container } = render(
      <TextField
        label="Password"
        variant="glass"
        endAdornment={<button type="button">Show</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('glass');
    expect(screen.getByLabelText('Password')).not.toHaveAttribute('aria-invalid');
  });
});

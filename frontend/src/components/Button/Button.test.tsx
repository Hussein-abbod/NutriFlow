import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders a non-submitting button by default and handles clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Login</Button>);
    const button = screen.getByRole('button', { name: 'Login' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows a spinner, sets aria-busy and blocks clicks while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Signing in" onClick={onClick}>
        Login
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Signing in' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant and full-width classes', () => {
    render(
      <Button variant="gradient" fullWidth type="submit">
        Go
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveClass('gradient', 'fullWidth');
    expect(button).toHaveAttribute('type', 'submit');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('announces the message and retries', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Failed to load dashboard" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load dashboard');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('hides the retry button when no handler is given', () => {
    render(<ErrorState message="Oops" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

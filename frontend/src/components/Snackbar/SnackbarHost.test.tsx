import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SNACKBAR_DURATION_MS, SnackbarHost } from './SnackbarHost';
import { showSnackbar, useSnackbarStore } from './snackbarStore';

describe('SnackbarHost', () => {
  afterEach(() => {
    vi.useRealTimers();
    act(() => useSnackbarStore.getState().dismiss());
  });

  it('shows error messages as alerts', () => {
    render(<SnackbarHost />);
    act(() => showSnackbar('Invalid email or password.', 'error'));
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('shows neutral messages as status and auto-dismisses after 4 s', () => {
    vi.useFakeTimers();
    render(<SnackbarHost />);
    act(() => showSnackbar('Saved'));
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    act(() => vi.advanceTimersByTime(SNACKBAR_DURATION_MS));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('replaces the current message with the newest one', () => {
    render(<SnackbarHost />);
    act(() => showSnackbar('First'));
    act(() => showSnackbar('Second'));
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

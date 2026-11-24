import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePwaStore } from '@/lib/platform/pwa';
import { UpdateToast } from './UpdateToast';

afterEach(() => usePwaStore.setState({ updateAvailable: false, applyUpdate: () => undefined }));

describe('UpdateToast', () => {
  it('appears when a new version is waiting and reloads into it', async () => {
    const applyUpdate = vi.fn();
    render(<UpdateToast />);
    expect(screen.queryByText(/new version/)).not.toBeInTheDocument();

    act(() => usePwaStore.setState({ updateAvailable: true, applyUpdate }));
    expect(screen.getByText('A new version of NutriFlow is ready.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });

  it('can be put off until later', async () => {
    usePwaStore.setState({ updateAvailable: true });
    render(<UpdateToast />);
    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByText(/new version/)).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

function Harness({ onConfirm = vi.fn() }: { onConfirm?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Remove item?"
        actions={
          <>
            <button type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" onClick={onConfirm}>
              Remove
            </button>
          </>
        }
      >
        Remove Rice?
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('is a labelled modal that traps focus and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);

    const dialog = screen.getByRole('alertdialog', { name: 'Remove item?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Remove Rice?');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('runs the actions', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

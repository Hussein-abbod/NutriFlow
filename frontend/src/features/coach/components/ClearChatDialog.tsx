import { Button, Dialog } from '@/components';

export interface ClearChatDialogProps {
  open: boolean;
  clearing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmation before "New Chat" deletes the conversation (Flutter cleared without asking). */
export function ClearChatDialog({ open, clearing, onCancel, onConfirm }: ClearChatDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={clearing ? () => undefined : onCancel}
      title="Start a new chat?"
      actions={
        <>
          <Button variant="text" onClick={onCancel} disabled={clearing}>
            Cancel
          </Button>
          <Button
            variant="text"
            loading={clearing}
            loadingLabel="Clearing chat"
            onClick={onConfirm}
          >
            Clear chat
          </Button>
        </>
      }
    >
      This deletes your conversation with Coach AI. Your food log and goals stay as they are.
    </Dialog>
  );
}

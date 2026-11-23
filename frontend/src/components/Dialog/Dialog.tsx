import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  /** Buttons in the bottom-right row (Flutter `AlertDialog.actions`). */
  actions: ReactNode;
}

/** Material AlertDialog: centred card over a scrim; Escape and a scrim tap close it. */
export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useFocusTrap(dialogRef, open);

  if (!open) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? bodyId : undefined}
        tabIndex={-1}
        className={styles.dialog}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children && (
          <div id={bodyId} className={styles.body}>
            {children}
          </div>
        )}
        <div className={styles.actions}>{actions}</div>
      </div>
    </div>,
    document.body,
  );
}

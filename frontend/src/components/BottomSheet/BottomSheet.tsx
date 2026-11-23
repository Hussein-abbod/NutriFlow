import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { cn } from '@/lib/utils/cn';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  children: ReactNode;
  className?: string;
}

const EXIT_DURATION_MS = 200;

/** Modal bottom sheet (showModalBottomSheet + the 28px rounded sheet used across the app). */
export function BottomSheet({ open, onClose, label, children, className }: BottomSheetProps) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useFocusTrap(sheetRef, open && mounted);

  if (!mounted) return null;

  return createPortal(
    <div className={cn(styles.root, closing && styles.closing)}>
      {/* Scrim tap closes like a Flutter modal barrier; keyboard users close with Escape. */}
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(styles.sheet, className)}
      >
        <div className={styles.handle} aria-hidden="true" />
        {children}
      </div>
    </div>,
    document.body,
  );
}

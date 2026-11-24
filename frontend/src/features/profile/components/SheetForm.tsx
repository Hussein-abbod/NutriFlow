import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components';
import styles from './SheetForm.module.css';

export interface SheetFormProps {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  saving: boolean;
  savingLabel: string;
  children: ReactNode;
}

/** A form inside a bottom sheet: title, fields, then Cancel / Save (Flutter AlertDialog). */
export function SheetForm({
  title,
  onSubmit,
  onCancel,
  saving,
  savingLabel,
  children,
}: SheetFormProps) {
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h2 className={styles.title}>{title}</h2>
      {children}
      <div className={styles.actions}>
        <Button variant="text" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingLabel={savingLabel}>
          Save
        </Button>
      </div>
    </form>
  );
}

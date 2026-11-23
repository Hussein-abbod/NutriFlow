import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button, TextField } from '@/components';
import { barcodeSchema, type BarcodeForm } from '../../schemas/foodLogSchemas';
import styles from './ManualBarcodeForm.module.css';

export interface ManualBarcodeFormProps {
  onSubmit: (barcode: string) => void;
  onCancel?: () => void;
  busy: boolean;
}

/** Fallback when the camera can't be used: type the digits under the barcode. */
export function ManualBarcodeForm({ onSubmit, onCancel, busy }: ManualBarcodeFormProps) {
  const form = useForm<BarcodeForm, unknown, z.output<typeof barcodeSchema>>({
    resolver: zodResolver(barcodeSchema),
    defaultValues: { barcode: '' },
  });

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => void form.handleSubmit(({ barcode }) => onSubmit(barcode))(event)}
    >
      <TextField
        label="Barcode number"
        icon="keyboard"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="search"
        maxLength={20}
        helperText="The 8 to 14 digits printed under the barcode"
        error={form.formState.errors.barcode?.message}
        {...form.register('barcode')}
      />
      <div className={styles.actions}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="gradient" loading={busy} loadingLabel="Looking up barcode">
          Look up
        </Button>
      </div>
    </form>
  );
}

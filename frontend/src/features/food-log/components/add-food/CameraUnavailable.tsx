import { Button, Icon } from '@/components';
import type { BarcodeScanErrorKind } from '@/lib/platform/barcode';
import { ManualBarcodeForm } from './ManualBarcodeForm';
import styles from './CameraUnavailable.module.css';

const MESSAGES: Record<BarcodeScanErrorKind, { title: string; text: string }> = {
  'permission-denied': {
    title: 'Camera access is blocked',
    text: 'Allow camera access for this site in your browser settings, or type the barcode number instead.',
  },
  'no-camera': {
    title: 'No camera found',
    text: "We couldn't start a camera on this device. Type the barcode number instead.",
  },
  unsupported: {
    title: 'Camera not available',
    text: 'Scanning needs a secure (HTTPS) page and a browser with camera support. Type the barcode number instead.',
  },
  unknown: {
    title: "Couldn't start the camera",
    text: 'Try again, or type the barcode number instead.',
  },
};

export interface CameraUnavailableProps {
  kind: BarcodeScanErrorKind;
  onRetry: () => void;
  onLookUp: (barcode: string) => void;
  busy: boolean;
}

/** Shown instead of the camera: why it can't scan, a retry and manual barcode entry. */
export function CameraUnavailable({ kind, onRetry, onLookUp, busy }: CameraUnavailableProps) {
  const { title, text } = MESSAGES[kind];
  return (
    <section className={styles.card} aria-labelledby="camera-unavailable">
      <Icon name="videocamOff" size={40} className={styles.icon} />
      <h2 id="camera-unavailable" className={styles.title}>
        {title}
      </h2>
      <p className={styles.text}>{text}</p>
      {kind !== 'unsupported' && (
        <Button variant="text" className={styles.retry} onClick={onRetry}>
          Try camera again
        </Button>
      )}
      <div className={styles.form}>
        <ManualBarcodeForm onSubmit={onLookUp} busy={busy} />
      </div>
    </section>
  );
}

import { useRef, useState } from 'react';
import { Icon, Spinner } from '@/components';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils/cn';
import { useBarcodeCamera } from '../../hooks/useBarcodeCamera';
import { useBarcodeScan } from '../../hooks/useBarcodeScan';
import type { FoodItem } from '../../model/foodItem';
import { ErrorBanner } from '../ErrorBanner';
import { CameraUnavailable } from './CameraUnavailable';
import { FoundFoodCard } from './FoundFoodCard';
import { ManualBarcodeForm } from './ManualBarcodeForm';
import styles from './BarcodeScannerPanel.module.css';

/** add_food_sheet.dart `BarcodeScannerScreen`, plus web fallbacks when there is no camera. */
export function BarcodeScannerPanel({ onConfirm }: { onConfirm: (item: FoodItem) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { lookup, found, lookUp, onDetected, rescan, setQuantity } = useBarcodeScan();
  const camera = useBarcodeCamera(videoRef, found === null, onDetected);
  const [manualOpen, setManualOpen] = useState(false);
  const failure = camera.status === 'failed' ? camera.failure : null;
  const showCamera = !found && !failure;

  return (
    <div className={styles.panel}>
      <video
        ref={videoRef}
        className={cn(styles.video, !showCamera && styles.hidden)}
        muted
        playsInline
        aria-label="Camera preview"
      />

      {showCamera && camera.status === 'starting' && (
        <div className={styles.center}>
          <Spinner color="var(--color-white)" label="Starting camera" />
        </div>
      )}
      {showCamera && camera.status === 'scanning' && !lookup.isPending && (
        <p className={styles.hint}>Point the camera at a barcode</p>
      )}
      {lookup.isPending && (
        <div className={styles.center}>
          <Spinner color="var(--color-white)" label="Looking up barcode" />
        </div>
      )}
      {failure && !found && (
        <CameraUnavailable
          kind={failure}
          onRetry={camera.restart}
          onLookUp={lookUp}
          busy={lookup.isPending}
        />
      )}

      <div className={styles.bottom}>
        {lookup.isError && !found && (
          <ErrorBanner
            className={styles.error}
            message={getErrorMessage(lookup.error)}
            onRetry={rescan}
          />
        )}
        {found ? (
          <FoundFoodCard
            item={found}
            onQuantityChange={setQuantity}
            onRescan={rescan}
            onConfirm={() => onConfirm(found)}
          />
        ) : (
          showCamera &&
          (manualOpen ? (
            <div className={styles.manualCard}>
              <ManualBarcodeForm
                onSubmit={lookUp}
                onCancel={() => setManualOpen(false)}
                busy={lookup.isPending}
              />
            </div>
          ) : (
            <button
              type="button"
              className={styles.manualButton}
              onClick={() => setManualOpen(true)}
            >
              <Icon name="keyboard" size={20} />
              Enter barcode manually
            </button>
          ))
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  BarcodeScanError,
  barcodeScanner,
  type BarcodeScanErrorKind,
  type BarcodeScanSession,
} from '@/lib/platform/barcode';

export type CameraStatus = 'idle' | 'starting' | 'scanning' | 'failed';

export interface BarcodeCamera {
  status: CameraStatus;
  /** Why the camera could not start (set while `status` is `failed`). */
  failure: BarcodeScanErrorKind | null;
  restart: () => void;
}

/**
 * Runs the platform barcode scanner in `videoRef` while `active` (Flutter MobileScanner).
 * The camera is released when `active` turns false or the component unmounts.
 */
export function useBarcodeCamera(
  videoRef: RefObject<HTMLVideoElement | null>,
  active: boolean,
  onDetected: (code: string) => void,
): BarcodeCamera {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [failure, setFailure] = useState<BarcodeScanErrorKind | null>(null);
  const [attempt, setAttempt] = useState(0);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) {
      setStatus('idle');
      return;
    }
    let cancelled = false;
    let session: BarcodeScanSession | null = null;
    setStatus('starting');
    setFailure(null);
    barcodeScanner
      .start(video, (code) => onDetectedRef.current(code))
      .then((started) => {
        if (cancelled) started.stop();
        else {
          session = started;
          setStatus('scanning');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFailure(error instanceof BarcodeScanError ? error.kind : 'unknown');
        setStatus('failed');
      });
    return () => {
      cancelled = true;
      session?.stop();
    };
  }, [videoRef, active, attempt]);

  return { status, failure, restart: () => setAttempt((count) => count + 1) };
}

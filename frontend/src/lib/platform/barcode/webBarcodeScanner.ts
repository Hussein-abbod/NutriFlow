import type { DecodeHintType as HintType } from '@zxing/library';
import { BarcodeScanError, type BarcodeScanner, type BarcodeScanErrorKind } from './types';

const PERMISSION_ERRORS = new Set(['NotAllowedError', 'PermissionDeniedError', 'SecurityError']);
const NO_CAMERA_ERRORS = new Set([
  'NotFoundError',
  'NotSupportedError', // e.g. Chromium without any video capture device
  'DevicesNotFoundError',
  'OverconstrainedError',
  'NotReadableError',
  'TrackStartError',
]);

/** Map a getUserMedia / zxing failure to something the UI can explain. */
export function toBarcodeScanError(error: unknown): BarcodeScanError {
  if (error instanceof BarcodeScanError) return error;
  const name = error instanceof Error ? error.name : '';
  let kind: BarcodeScanErrorKind = 'unknown';
  if (PERMISSION_ERRORS.has(name)) kind = 'permission-denied';
  else if (NO_CAMERA_ERRORS.has(name)) kind = 'no-camera';
  return new BarcodeScanError(kind, error instanceof Error ? error.message : undefined);
}

/** Retail barcodes only: faster and fewer false reads than trying every format. */
async function createReader() {
  // Loaded on demand so the ~400 kB decoder is only downloaded when the scanner opens.
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);
  const hints = new Map<HintType, unknown>([
    [
      DecodeHintType.POSSIBLE_FORMATS,
      [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E],
    ],
  ]);
  return new BrowserMultiFormatReader(hints, { delayBetweenScanSuccess: 1000 });
}

export const webBarcodeScanner: BarcodeScanner = {
  async start(video, onDetected) {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new BarcodeScanError('unsupported');
    }
    try {
      const reader = await createReader();
      const controls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        video,
        (result) => {
          if (result) onDetected(result.getText());
        },
      );
      let stopped = false;
      return {
        stop: () => {
          if (stopped) return;
          stopped = true;
          controls.stop();
        },
      };
    } catch (error) {
      throw toBarcodeScanError(error);
    }
  },
};

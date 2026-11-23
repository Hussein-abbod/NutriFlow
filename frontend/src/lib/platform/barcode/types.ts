/**
 * Barcode scanning behind a small interface: the web build uses the camera in the page
 * (zxing); a Capacitor build can swap in the native ML Kit scanner without touching the UI.
 */

export type BarcodeScanErrorKind =
  /** The user (or a browser policy) blocked the camera. */
  | 'permission-denied'
  /** The device has no camera, or it is in use by another app. */
  | 'no-camera'
  /** No camera API here, e.g. a plain-HTTP page or an old browser. */
  | 'unsupported'
  | 'unknown';

export class BarcodeScanError extends Error {
  readonly kind: BarcodeScanErrorKind;

  constructor(kind: BarcodeScanErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'BarcodeScanError';
    this.kind = kind;
  }
}

export interface BarcodeScanSession {
  /** Stops scanning and releases the camera. Safe to call twice. */
  stop: () => void;
}

export interface BarcodeScanner {
  /**
   * Shows the rear camera in `video` and calls `onDetected` with every barcode it reads
   * (digits of an EAN / UPC code). Rejects with a {@link BarcodeScanError}.
   */
  start: (
    video: HTMLVideoElement,
    onDetected: (code: string) => void,
  ) => Promise<BarcodeScanSession>;
}

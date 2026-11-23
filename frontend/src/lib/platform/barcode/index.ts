import type { BarcodeScanner } from './types';
import { webBarcodeScanner } from './webBarcodeScanner';

export { BarcodeScanError } from './types';
export type { BarcodeScanErrorKind, BarcodeScanner, BarcodeScanSession } from './types';

/** The scanner for this platform (web today; the Capacitor build replaces it). */
export const barcodeScanner: BarcodeScanner = webBarcodeScanner;

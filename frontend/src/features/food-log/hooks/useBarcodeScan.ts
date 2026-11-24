import { useRef, useState } from 'react';
import { useLookupBarcode } from '../api/useFoodLogQueries';
import { withPortion, type FoodItem } from '../model/foodItem';
import { FOOD_LIMITS } from '../schemas/limits';

/**
 * BarcodeScannerScreen state: one lookup per detected code (Flutter `_scanned`), the food
 * found and its amount. Camera reads that are not retail barcodes are ignored.
 */
export function useBarcodeScan() {
  const lookup = useLookupBarcode();
  const [found, setFound] = useState<FoodItem | null>(null);
  // Camera reads are ignored from the first read until Retry / Rescan (Flutter `_scanned`).
  // Set synchronously so a second read in the same frame cannot start another lookup, and
  // kept after a failed lookup: the camera still sees the same code every second.
  const scannedRef = useRef(false);

  const runLookup = (barcode: string) =>
    lookup.mutate(barcode, { onSuccess: (item) => setFound(item) });

  const onDetected = (code: string) => {
    if (scannedRef.current || !FOOD_LIMITS.barcodePattern.test(code)) return;
    scannedRef.current = true;
    runLookup(code);
  };

  /** Typed by the user: always allowed unless a lookup is already running. */
  const lookUp = (barcode: string) => {
    if (lookup.isPending) return;
    scannedRef.current = true;
    runLookup(barcode);
  };

  const rescan = () => {
    scannedRef.current = false;
    lookup.reset();
    setFound(null);
  };

  const setQuantity = (quantity: number) =>
    setFound((current) => (current ? withPortion(current, quantity) : current));

  return { lookup, found, lookUp, onDetected, rescan, setQuantity };
}

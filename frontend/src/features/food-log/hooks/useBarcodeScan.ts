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
  // Set synchronously so a second read in the same frame cannot start another lookup.
  const busyRef = useRef(false);

  const lookUp = (barcode: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    lookup.mutate(barcode, {
      onSuccess: (item) => setFound(item),
      onError: () => {
        busyRef.current = false;
      },
    });
  };

  const onDetected = (code: string) => {
    if (FOOD_LIMITS.barcodePattern.test(code)) lookUp(code);
  };

  const rescan = () => {
    busyRef.current = false;
    lookup.reset();
    setFound(null);
  };

  const setQuantity = (quantity: number) =>
    setFound((current) => (current ? withPortion(current, quantity) : current));

  return { lookup, found, lookUp, onDetected, rescan, setQuantity };
}

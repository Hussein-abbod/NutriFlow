/**
 * Food-log limits. Mirror backend/app/schemas/food_log.py and
 * backend/app/utils/image_validation.py; keep both in sync.
 */
export const FOOD_LIMITS = {
  textQueryMax: 500,
  /** EAN-8 / UPC-E (8), UPC-A (12), EAN-13 (13) and GTIN-14 (14). */
  barcodePattern: /^\d{8,14}$/,
  /** Smallest amount (portions keep 2 decimals; the backend requires > 0). */
  quantityMin: 0.01,
  quantityMax: 10_000,
  /** Largest portion in grams; keeps every scaled nutrient inside the backend ranges. */
  portionGramsMax: 10_000,
  maxItemsPerLog: 50,
} as const;

export const IMAGE_LIMITS = {
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  /** Size of the photo the user picks; it is compressed well below the upload limit. */
  maxSourceBytes: 20 * 1024 * 1024,
  /** Backend upload limit (MAX_IMAGE_BYTES). */
  maxUploadBytes: 5 * 1024 * 1024,
  /** Flutter `pickImage(maxWidth: 1024, imageQuality: 80)`. */
  maxDimension: 1024,
  jpegQuality: 0.8,
} as const;

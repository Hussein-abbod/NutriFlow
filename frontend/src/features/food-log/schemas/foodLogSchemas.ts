import { z } from 'zod';
import { isIsoDay } from '../model/dates';
import { quantityInGrams } from '../model/foodItem';
import { MEAL_TYPES } from '../model/meals';
import { FOOD_LIMITS, IMAGE_LIMITS } from './limits';

/** Search Food: the text box above the results. */
export const textSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Type a food to search for.')
    .max(FOOD_LIMITS.textQueryMax, `Keep it under ${FOOD_LIMITS.textQueryMax} characters.`),
});
export type TextSearchForm = z.input<typeof textSearchSchema>;

/** Manual barcode entry; spaces and dashes people type from the label are ignored. */
export const barcodeSchema = z.object({
  barcode: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ''))
    .pipe(
      z.string().regex(FOOD_LIMITS.barcodePattern, 'Enter the 8 to 14 digits under the barcode.'),
    ),
});
export type BarcodeForm = z.input<typeof barcodeSchema>;

const QUANTITY_MESSAGE = `Enter an amount from ${FOOD_LIMITS.quantityMin} to ${FOOD_LIMITS.quantityMax}.`;

/** Edit sheet: quantity + unit (one of the units offered for the food). */
export function portionSchema(units: readonly string[]) {
  return z
    .object({
      quantity: z
        .string()
        .trim()
        .min(1, QUANTITY_MESSAGE)
        .pipe(
          z.coerce
            .number<string>({ error: QUANTITY_MESSAGE })
            // Portions are stored with 2 decimals, so anything below 0.01 would become 0.
            .min(FOOD_LIMITS.quantityMin, QUANTITY_MESSAGE)
            .max(FOOD_LIMITS.quantityMax, QUANTITY_MESSAGE),
        ),
      unit: z.string().refine((unit) => units.includes(unit), 'Choose a unit from the list.'),
    })
    .refine(
      ({ quantity, unit }) => quantityInGrams(quantity, unit) <= FOOD_LIMITS.portionGramsMax,
      {
        message: `That portion is too large (max ${FOOD_LIMITS.portionGramsMax / 1000} kg).`,
        path: ['quantity'],
      },
    );
}
export type PortionForm = z.input<ReturnType<typeof portionSchema>>;

const MAX_SOURCE_MB = IMAGE_LIMITS.maxSourceBytes / (1024 * 1024);
const acceptedTypes: readonly string[] = IMAGE_LIMITS.acceptedTypes;

/** A photo picked from the camera or the gallery, checked before it is read. */
export const imageFileSchema = z
  .instanceof(File, { message: 'Choose a photo of your meal.' })
  .refine((file) => acceptedTypes.includes(file.type), 'Choose a JPEG, PNG or WebP image.')
  .refine((file) => file.size > 0, 'This file is empty.')
  .refine(
    (file) => file.size <= IMAGE_LIMITS.maxSourceBytes,
    `This photo is too large (max ${MAX_SOURCE_MB} MB).`,
  );

/** `?meal=…&date=…` of the add-food pages (anything else sends the user back to the log). */
export const addFoodParamsSchema = z.object({
  meal: z.enum(MEAL_TYPES),
  date: z.string().refine(isIsoDay),
});

const nutrient = z.number().finite().min(0);

const foodItemSchema = z.object({
  key: z.string().min(1),
  fdcId: z.number().int().nullable(),
  foodName: z.string().min(1).max(255),
  brandName: z.string().max(255).nullable(),
  quantity: z.number().min(FOOD_LIMITS.quantityMin).max(FOOD_LIMITS.quantityMax),
  unit: z.string().min(1).max(50),
  per100g: z.object({
    calories: nutrient,
    protein: nutrient,
    carbs: nutrient,
    fat: nutrient,
    fiber: nutrient,
    sugar: nutrient,
    sodium: nutrient,
  }),
});

/** Router state handed to the confirm page (history state, so it is validated on read). */
export const confirmStateSchema = z.object({
  items: z.array(foodItemSchema).min(1).max(FOOD_LIMITS.maxItemsPerLog),
  method: z.enum(['text', 'barcode', 'image']),
  /** History entries back to the food log (2 when opened from it, 0 after a deep link). */
  returnSteps: z.number().int().min(0).max(2),
});
export type ConfirmState = z.infer<typeof confirmStateSchema>;

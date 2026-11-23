import type { FoodItemResultDto, FoodItemSubmitDto } from '@/types/api';

/** Nutrients per 100 g, as returned by the backend lookups. */
export interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

/** A food being logged (models/food_item_model.dart): per-100 g values + the chosen portion. */
export interface FoodItem {
  /** Client-only key; the same food can be added twice. */
  key: string;
  fdcId: number | null;
  foodName: string;
  brandName: string | null;
  quantity: number;
  unit: string;
  per100g: Nutrients;
}

export interface PortionNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

let nextKey = 0;
const newKey = () => `food-${Date.now().toString(36)}-${(nextKey++).toString(36)}`;

export function fromFoodResult(result: FoodItemResultDto): FoodItem {
  return {
    key: newKey(),
    fdcId: result.fdc_id,
    foodName: result.food_name || 'Unknown',
    brandName: result.brand_name,
    quantity: result.serving_size ?? 100,
    unit: result.serving_unit ?? 'g',
    per100g: {
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      fiber: result.fiber,
      sugar: result.sugar,
      sodium: result.sodium,
    },
  };
}

/** A second copy of a food (e.g. added twice from the search results). */
export const duplicateItem = (item: FoodItem): FoodItem => ({ ...item, key: newKey() });

const GRAMS_PER_UNIT: Readonly<Record<string, number>> = {
  g: 1,
  gram: 1,
  grams: 1,
  grm: 1,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  unz: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
  kg: 1000,
  ml: 1, // rough estimate for liquids
  mlt: 1,
  'fl oz': 29.5735,
  'small egg': 40,
  'medium egg': 50,
  'large egg': 60,
  egg: 60,
  eggs: 60,
  bowl: 250,
  slice: 30,
  slices: 30,
  piece: 80,
  pieces: 80,
  small: 80,
  medium: 130,
  large: 200,
};

/** FoodItemModel._quantityInGrams: unknown units count as grams (safest assumption). */
export function quantityInGrams(quantity: number, unit: string): number {
  const normalized = unit.toLowerCase().trim();
  const exact = GRAMS_PER_UNIT[normalized];
  if (exact !== undefined) return quantity * exact;
  if (normalized.includes('cup')) return quantity * 240;
  if (normalized.includes('tbsp') || normalized.includes('tablespoon')) return quantity * 15;
  if (normalized.includes('tsp') || normalized.includes('teaspoon')) return quantity * 5;
  return quantity;
}

/** Flutter `_r`: one decimal. */
const roundOne = (value: number) => Math.round(value * 10) / 10;

function scaled(item: FoodItem, nutrient: keyof Nutrients): number {
  return roundOne((item.per100g[nutrient] * quantityInGrams(item.quantity, item.unit)) / 100);
}

export function portionNutrition(item: FoodItem): PortionNutrition {
  return {
    calories: scaled(item, 'calories'),
    protein: scaled(item, 'protein'),
    carbs: scaled(item, 'carbs'),
    fat: scaled(item, 'fat'),
  };
}

export function totalNutrition(items: readonly FoodItem[]): PortionNutrition {
  return items.map(portionNutrition).reduce(
    (total, portion) => ({
      calories: total.calories + portion.calories,
      protein: total.protein + portion.protein,
      carbs: total.carbs + portion.carbs,
      fat: total.fat + portion.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

const includesAny = (text: string, words: readonly string[]) =>
  words.some((word) => text.includes(word));

/** FoodItemModel.availableUnits, plus the item's current unit if it is not listed. */
export function availableUnits(item: Pick<FoodItem, 'foodName' | 'unit'>): string[] {
  const name = item.foodName.toLowerCase();
  let units: string[];
  if (name.includes('egg')) units = ['large egg', 'medium egg', 'small egg', 'g', 'oz'];
  else if (includesAny(name, ['milk', 'juice', 'water', 'oil', 'sauce']))
    units = ['cup', 'fl oz', 'ml', 'tbsp', 'tsp'];
  else if (includesAny(name, ['rice', 'oat', 'cereal', 'pasta']))
    units = ['cup', 'bowl', 'g', 'oz'];
  else if (includesAny(name, ['bread', 'toast', 'cake', 'pizza'])) units = ['slice', 'g', 'oz'];
  else if (includesAny(name, ['meat', 'chicken', 'beef', 'fish', 'steak']))
    units = ['g', 'oz', 'lb', 'piece'];
  else
    units = [
      'g',
      'oz',
      'lb',
      'ml',
      'cup',
      'tbsp',
      'tsp',
      'piece',
      'small',
      'medium',
      'large',
      'slice',
    ];
  return units.includes(item.unit) ? units : [...units, item.unit];
}

/** Stepper step: 10 for grams / millilitres, 1 for every other unit. */
export function quantityStep(unit: string): number {
  const normalized = unit.toLowerCase();
  return normalized === 'g' || normalized === 'ml' ? 10 : 1;
}

export const withPortion = (item: FoodItem, quantity: number, unit = item.unit): FoodItem => ({
  ...item,
  quantity: Math.round(quantity * 100) / 100,
  unit,
});

/** `1` → "1", `1.5` → "1.5", float noise like `38.349999` → "38.35". */
export function formatQuantity(quantity: number): string {
  return String(Math.round(quantity * 100) / 100);
}

export function toSubmitItem(item: FoodItem): FoodItemSubmitDto {
  const portion = portionNutrition(item);
  return {
    food_name: item.foodName,
    brand_name: item.brandName,
    quantity: item.quantity,
    unit: item.unit,
    ...portion,
    fiber: scaled(item, 'fiber'),
    sodium: scaled(item, 'sodium'),
    sugar: scaled(item, 'sugar'),
    ...(item.fdcId !== null && { nutritionix_food_id: String(item.fdcId) }),
  };
}

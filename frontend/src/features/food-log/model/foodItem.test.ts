import { describe, expect, it } from 'vitest';
import { buildFoodResult } from '@/test/fixtures';
import {
  availableUnits,
  duplicateItem,
  formatQuantity,
  fromFoodResult,
  portionNutrition,
  quantityInGrams,
  quantityStep,
  toSubmitItem,
  totalNutrition,
  withPortion,
} from './foodItem';

const rice = () => fromFoodResult(buildFoodResult());

describe('fromFoodResult', () => {
  it('keeps per-100 g values and uses the serving as the starting portion', () => {
    const item = fromFoodResult(buildFoodResult({ serving_size: 85, serving_unit: 'g' }));
    expect(item).toMatchObject({ fdcId: 169757, quantity: 85, unit: 'g' });
    expect(item.per100g.calories).toBe(130);
  });

  it('falls back to 100 g and gives every food its own key', () => {
    const result = buildFoodResult({ serving_size: null, serving_unit: null });
    const first = fromFoodResult(result);
    expect(first).toMatchObject({ quantity: 100, unit: 'g' });
    expect(fromFoodResult(result).key).not.toBe(first.key);
    expect(duplicateItem(first).key).not.toBe(first.key);
  });
});

describe('quantityInGrams (FoodItemModel._quantityInGrams)', () => {
  it.each([
    [100, 'g', 100],
    [2, 'oz', 56.699],
    [1, 'lb', 453.592],
    [0.5, 'kg', 500],
    [250, 'ml', 250],
    [1, 'fl oz', 29.5735],
    [2, 'cup', 480],
    [1, 'cups', 240],
    [3, 'tbsp', 45],
    [2, 'teaspoon', 10],
    [2, 'large egg', 120],
    [1, 'small egg', 40],
    [2, 'slice', 60],
    [1, 'bowl', 250],
    [1, 'piece', 80],
    [1, 'medium', 130],
    [30, 'handful', 30],
    [10, ' G ', 10],
  ])('%s %s = %s g', (quantity, unit, grams) => {
    expect(quantityInGrams(quantity, unit)).toBeCloseTo(grams, 3);
  });
});

describe('portions', () => {
  it('scales per-100 g values to the portion, rounded to one decimal', () => {
    expect(portionNutrition(withPortion(rice(), 200))).toEqual({
      calories: 260,
      protein: 5.4,
      carbs: 56.4,
      fat: 0.6,
    });
    expect(portionNutrition(withPortion(rice(), 1, 'cup')).calories).toBe(312);
  });

  it('sums several foods', () => {
    const totals = totalNutrition([withPortion(rice(), 100), withPortion(rice(), 50)]);
    expect(totals.calories).toBe(195);
  });

  it('builds the submit payload with scaled nutrients and the USDA id', () => {
    expect(toSubmitItem(withPortion(rice(), 150))).toEqual({
      food_name: 'Rice, white, long-grain, cooked',
      brand_name: null,
      quantity: 150,
      unit: 'g',
      calories: 195,
      protein: 4.1,
      carbs: 42.3,
      fat: 0.5,
      fiber: 0.6,
      sodium: 1.5,
      sugar: 0.2,
      nutritionix_food_id: '169757',
    });
    const unknown = fromFoodResult(buildFoodResult({ fdc_id: null }));
    expect(toSubmitItem(unknown)).not.toHaveProperty('nutritionix_food_id');
  });
});

describe('units', () => {
  it.each([
    ['Egg, whole, raw', ['large egg', 'medium egg', 'small egg', 'g', 'oz']],
    ['Milk, whole', ['cup', 'fl oz', 'ml', 'tbsp', 'tsp', 'g']],
    ['Rice, cooked', ['cup', 'bowl', 'g', 'oz']],
    ['Bread, white', ['slice', 'g', 'oz']],
    ['Chicken breast', ['g', 'oz', 'lb', 'piece']],
  ])('offers the Flutter units for %s (plus the current unit)', (foodName, units) => {
    expect(availableUnits({ foodName, unit: 'g' })).toEqual(units);
  });

  it('falls back to the full unit list', () => {
    expect(availableUnits({ foodName: 'Apple', unit: 'g' })).toHaveLength(12);
  });

  it('steps grams and millilitres by 10, everything else by 1', () => {
    expect(quantityStep('g')).toBe(10);
    expect(quantityStep('ML')).toBe(10);
    expect(quantityStep('cup')).toBe(1);
  });

  it('formats quantities without float noise', () => {
    expect(formatQuantity(100)).toBe('100');
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(28.35 + 10)).toBe('38.35');
  });
});

import { describe, expect, it } from 'vitest';
import { buildFoodResult } from '@/test/fixtures';
import { fromFoodResult } from '../model/foodItem';
import {
  addFoodParamsSchema,
  barcodeSchema,
  confirmStateSchema,
  imageFileSchema,
  portionSchema,
  textSearchSchema,
} from './foodLogSchemas';

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('textSearchSchema', () => {
  it('trims the query', () => {
    expect(textSearchSchema.parse({ query: '  rice ' })).toEqual({ query: 'rice' });
  });

  it('rejects empty and over-long queries', () => {
    expect(firstError(textSearchSchema.safeParse({ query: '   ' }))).toBe(
      'Type a food to search for.',
    );
    expect(firstError(textSearchSchema.safeParse({ query: 'x'.repeat(501) }))).toBe(
      'Keep it under 500 characters.',
    );
  });
});

describe('barcodeSchema', () => {
  it.each(['012345678905', '4006381333931', '12345670', '00012345678905'])('accepts %s', (code) => {
    expect(barcodeSchema.parse({ barcode: code }).barcode).toBe(code);
  });

  it('ignores spaces and dashes typed from the label', () => {
    expect(barcodeSchema.parse({ barcode: ' 0 12345-67890 5 ' })).toEqual({
      barcode: '012345678905',
    });
  });

  it.each(['', '1234567', '123456789012345', '01234567890a', '<script>'])('rejects %j', (code) => {
    expect(firstError(barcodeSchema.safeParse({ barcode: code }))).toBe(
      'Enter the 8 to 14 digits under the barcode.',
    );
  });
});

describe('portionSchema', () => {
  const schema = portionSchema(['g', 'oz', 'cup', 'lb']);

  it('turns the typed amount into a number', () => {
    expect(schema.parse({ quantity: ' 1.5 ', unit: 'cup' })).toEqual({
      quantity: 1.5,
      unit: 'cup',
    });
  });

  it.each(['', '0', '-5', 'abc', '10001'])('rejects the amount %j', (quantity) => {
    expect(firstError(schema.safeParse({ quantity, unit: 'g' }))).toBe(
      'Enter an amount above 0 and up to 10000.',
    );
  });

  it('caps the portion at 10 kg whatever the unit', () => {
    expect(schema.safeParse({ quantity: '22', unit: 'lb' }).success).toBe(true);
    expect(firstError(schema.safeParse({ quantity: '23', unit: 'lb' }))).toBe(
      'That portion is too large (max 10 kg).',
    );
  });

  it('only accepts the offered units', () => {
    expect(firstError(schema.safeParse({ quantity: '1', unit: 'bucket' }))).toBe(
      'Choose a unit from the list.',
    );
  });
});

describe('imageFileSchema', () => {
  const file = (type: string, size: number) => new File([new Uint8Array(size)], 'meal', { type });

  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s', (type) => {
    expect(imageFileSchema.safeParse(file(type, 10)).success).toBe(true);
  });

  it.each([
    ['image/gif', 10, 'Choose a JPEG, PNG or WebP image.'],
    ['image/svg+xml', 10, 'Choose a JPEG, PNG or WebP image.'],
    ['application/pdf', 10, 'Choose a JPEG, PNG or WebP image.'],
    ['image/png', 0, 'This file is empty.'],
    ['image/jpeg', 20 * 1024 * 1024 + 1, 'This photo is too large (max 20 MB).'],
  ])('rejects %s of %i bytes', (type, size, message) => {
    expect(firstError(imageFileSchema.safeParse(file(type, size)))).toBe(message);
  });
});

describe('route data', () => {
  it('accepts only known meals and real days in the URL', () => {
    expect(addFoodParamsSchema.safeParse({ meal: 'lunch', date: '2026-11-24' }).success).toBe(true);
    expect(addFoodParamsSchema.safeParse({ meal: 'brunch', date: '2026-11-24' }).success).toBe(
      false,
    );
    expect(addFoodParamsSchema.safeParse({ meal: 'lunch', date: '2026-02-31' }).success).toBe(
      false,
    );
  });

  it('validates the foods handed to the confirm screen', () => {
    const item = fromFoodResult(buildFoodResult());
    expect(
      confirmStateSchema.safeParse({ items: [item], method: 'text', returnSteps: 2 }).success,
    ).toBe(true);
    expect(
      confirmStateSchema.safeParse({ items: [], method: 'text', returnSteps: 0 }).success,
    ).toBe(false);
    expect(
      confirmStateSchema.safeParse({
        items: [{ ...item, quantity: -1 }],
        method: 'text',
        returnSteps: 0,
      }).success,
    ).toBe(false);
    expect(confirmStateSchema.safeParse(null).success).toBe(false);
  });
});

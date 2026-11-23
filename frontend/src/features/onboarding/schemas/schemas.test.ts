import { describe, expect, it } from 'vitest';
import { activitySchema } from './activitySchema';
import { allergiesSchema, splitAllergies } from './allergiesSchema';
import { basicInfoSchema } from './basicInfoSchema';
import { createGoalSchema } from './goalSchema';

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('basicInfoSchema', () => {
  const valid = { gender: 'female', age: '30', heightCm: '165.5', weightKg: '70' } as const;

  it('parses numbers out of the text fields', () => {
    expect(basicInfoSchema.parse(valid)).toEqual({
      gender: 'female',
      age: 30,
      heightCm: 165.5,
      weightKg: 70,
    });
  });

  it.each([
    ['age', '9', 'Enter a valid age (10-100)'],
    ['age', '101', 'Enter a valid age (10-100)'],
    ['age', '30.5', 'Enter a valid age (10-100)'],
    ['age', '', 'Enter a valid age (10-100)'],
    ['heightCm', '49', 'Enter a height between 50 and 300 cm'],
    ['heightCm', 'tall', 'Enter a height between 50 and 300 cm'],
    ['heightCm', '301', 'Enter a height between 50 and 300 cm'],
    ['weightKg', '19.9', 'Enter a weight between 20 and 500 kg'],
    ['weightKg', '501', 'Enter a weight between 20 and 500 kg'],
  ])('rejects %s = %j', (field, value, message) => {
    expect(firstMessage(basicInfoSchema.safeParse({ ...valid, [field]: value }))).toBe(message);
  });

  it('accepts the range limits', () => {
    const limits = { gender: 'male', age: '100', heightCm: '50', weightKg: '500' } as const;
    expect(basicInfoSchema.safeParse(limits).success).toBe(true);
  });
});

describe('activitySchema', () => {
  it('requires a level', () => {
    expect(firstMessage(activitySchema.safeParse({ activityLevel: null }))).toBe(
      'Please select an activity level',
    );
    expect(activitySchema.parse({ activityLevel: 'very_active' })).toEqual({
      activityLevel: 'very_active',
    });
  });
});

describe('createGoalSchema', () => {
  const schema = createGoalSchema(70);

  it('requires a goal', () => {
    const result = schema.safeParse({ goalType: null, targetWeightKg: '', periodWeeks: 12 });
    expect(firstMessage(result)).toBe('Please select a goal');
  });

  it('ignores target and period for maintain', () => {
    expect(
      schema.parse({ goalType: 'maintain_weight', targetWeightKg: 'junk', periodWeeks: 12 }),
    ).toEqual({ goalType: 'maintain_weight', targetWeightKg: null, periodWeeks: null });
  });

  it('parses lose and gain goals', () => {
    expect(
      schema.parse({ goalType: 'lose_weight', targetWeightKg: '65', periodWeeks: 10 }),
    ).toEqual({
      goalType: 'lose_weight',
      targetWeightKg: 65,
      periodWeeks: 10,
    });
    expect(
      schema.parse({ goalType: 'gain_weight', targetWeightKg: '74.5', periodWeeks: 8 }),
    ).toEqual({ goalType: 'gain_weight', targetWeightKg: 74.5, periodWeeks: 8 });
  });

  it.each([
    ['lose_weight', '70', 'Must be below your current weight (70 kg)'],
    ['lose_weight', '80', 'Must be below your current weight (70 kg)'],
    ['gain_weight', '65', 'Must be above your current weight (70 kg)'],
    ['gain_weight', '', 'Enter a target weight between 20 and 500 kg'],
    ['lose_weight', '10', 'Enter a target weight between 20 and 500 kg'],
  ])('rejects %s with target %j', (goalType, target, message) => {
    const result = schema.safeParse({ goalType, targetWeightKg: target, periodWeeks: 10 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ['targetWeightKg'], message });
  });

  it('keeps the period on the slider range', () => {
    const result = schema.safeParse({
      goalType: 'lose_weight',
      targetWeightKg: '65',
      periodWeeks: 53,
    });
    expect(firstMessage(result)).toBe('Choose between 1 and 52 weeks');
  });
});

describe('allergiesSchema', () => {
  it('combines chips and free text, without duplicates', () => {
    expect(
      allergiesSchema.parse({
        selected: ['Peanuts', 'Soy'],
        none: false,
        other: ' Strawberries,  kiwi ,, KIWI, peanuts ',
      }),
    ).toEqual(['Peanuts', 'Soy', 'Strawberries', 'kiwi']);
  });

  it('sends an empty list for "None"', () => {
    expect(allergiesSchema.parse({ selected: ['Fish'], none: true, other: 'Kiwi' })).toEqual([]);
  });

  it('limits the length of each allergy and the total count', () => {
    const tooLong = allergiesSchema.safeParse({
      selected: [],
      none: false,
      other: 'a'.repeat(101),
    });
    expect(tooLong.error?.issues[0]).toMatchObject({
      path: ['other'],
      message: 'Each allergy can be at most 100 characters',
    });

    const many = Array.from({ length: 31 }, (_, index) => `food${index}`).join(',');
    const tooMany = allergiesSchema.safeParse({ selected: [], none: false, other: many });
    expect(firstMessage(tooMany)).toBe('You can list up to 30 allergies');
  });

  it('splits free text on commas and collapses spaces', () => {
    expect(splitAllergies('  red   meat , , Kiwi ')).toEqual(['red meat', 'Kiwi']);
    expect(splitAllergies('')).toEqual([]);
  });
});

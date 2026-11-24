import { describe, expect, it } from 'vitest';
import { buildUser } from '@/test/fixtures';
import { changePasswordSchema } from './changePasswordSchema';
import { personalInfoFromUser, personalInfoSchema } from './personalInfoSchema';

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('personalInfoSchema', () => {
  const valid = { fullName: ' Dana Flow ', age: '30', heightCm: '165.5', weightKg: '70' };

  it('trims the name and turns the numbers into numbers', () => {
    expect(personalInfoSchema.parse(valid)).toEqual({
      fullName: 'Dana Flow',
      age: 30,
      heightCm: 165.5,
      weightKg: 70,
    });
  });

  it.each([
    [{ fullName: '  ' }, 'Required'],
    [{ fullName: 'x'.repeat(256) }, 'Max 255 characters'],
    [{ age: '9' }, 'Enter a valid age (10-100)'],
    [{ age: '30.5' }, 'Enter a valid age (10-100)'],
    [{ heightCm: '49' }, 'Enter 50-300 cm'],
    [{ weightKg: '501' }, 'Enter 20-500 kg'],
    [{ weightKg: 'abc' }, 'Enter 20-500 kg'],
  ])('rejects %j', (override, message) => {
    expect(firstError(personalInfoSchema.safeParse({ ...valid, ...override }))).toBe(message);
  });

  it('fills the form from the user (empty for missing values)', () => {
    expect(
      personalInfoFromUser(
        buildUser({ full_name: null, age: 30, height_cm: 170, weight_kg: null }),
      ),
    ).toEqual({ fullName: '', age: '30', heightCm: '170', weightKg: '' });
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'Str0ngPass!',
    newPassword: 'BrandNew123',
    confirmPassword: 'BrandNew123',
  };

  it('accepts a strong, new, confirmed password', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    [{ currentPassword: '' }, 'Enter your current password'],
    [{ newPassword: 'short1', confirmPassword: 'short1' }, 'Min 8 characters'],
    [
      { newPassword: 'onlyletters', confirmPassword: 'onlyletters' },
      'Use at least one letter and one number',
    ],
    [
      { newPassword: 'Str0ngPass!', confirmPassword: 'Str0ngPass!' },
      'Choose a password different from the current one',
    ],
    [{ confirmPassword: 'BrandNew124' }, 'Passwords do not match'],
  ])('rejects %j', (override, message) => {
    expect(firstError(changePasswordSchema.safeParse({ ...valid, ...override }))).toBe(message);
  });
});

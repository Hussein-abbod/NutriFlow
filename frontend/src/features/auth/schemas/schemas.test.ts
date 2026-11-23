import { describe, expect, it } from 'vitest';
import { loginSchema } from './loginSchema';
import { registerSchema } from './registerSchema';

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('loginSchema', () => {
  it('accepts valid credentials and trims the email', () => {
    const result = loginSchema.parse({ email: '  a@example.com ', password: 'x' });
    expect(result.email).toBe('a@example.com');
  });

  it.each([
    [{ email: '', password: 'x' }, 'Please enter a valid email'],
    [{ email: 'no-at-sign', password: 'x' }, 'Please enter a valid email'],
    [{ email: 'a@example.com', password: '' }, 'Please enter your password'],
    [{ email: 'a@example.com', password: 'x'.repeat(129) }, 'Password is too long'],
  ])('rejects %o', (input, message) => {
    expect(firstError(loginSchema.safeParse(input))).toBe(message);
  });
});

describe('registerSchema', () => {
  const valid = {
    fullName: ' Alice ',
    email: 'alice@example.com',
    password: 'Str0ngPass!',
    confirmPassword: 'Str0ngPass!',
  };

  it('accepts a valid form and trims the name', () => {
    expect(registerSchema.parse(valid).fullName).toBe('Alice');
  });

  it.each([
    [{ fullName: '   ' }, 'Required'],
    [{ fullName: 'x'.repeat(256) }, 'Max 255 characters'],
    [{ email: '' }, 'Required'],
    [{ email: 'alice' }, 'Invalid email'],
    [{ password: 'short', confirmPassword: 'short' }, 'Min 8 characters'],
    [{ password: 'x'.repeat(73), confirmPassword: 'x'.repeat(73) }, 'Max 72 characters'],
    [{ password: 'é'.repeat(40), confirmPassword: 'é'.repeat(40) }, 'Password is too long'],
    [{ confirmPassword: 'different' }, 'Passwords do not match'],
  ])('rejects %o', (override, message) => {
    expect(firstError(registerSchema.safeParse({ ...valid, ...override }))).toBe(message);
  });
});

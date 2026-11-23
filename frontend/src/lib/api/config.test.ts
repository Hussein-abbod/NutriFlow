import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './config';

describe('resolveApiBaseUrl', () => {
  it('normalises a valid URL and strips trailing slashes', () => {
    expect(resolveApiBaseUrl(' https://api.nutriflow.app/ ')).toBe('https://api.nutriflow.app');
    expect(resolveApiBaseUrl('http://localhost:8000')).toBe('http://localhost:8000');
  });

  it.each([undefined, '', '   '])('throws when unset (%s)', (value) => {
    expect(() => resolveApiBaseUrl(value)).toThrow(/VITE_API_BASE_URL is not set/);
  });

  it('rejects invalid URLs and other protocols', () => {
    expect(() => resolveApiBaseUrl('not a url')).toThrow(/not a valid URL/);
    expect(() => resolveApiBaseUrl('ftp://example.com')).toThrow(/http or https/);
  });
});

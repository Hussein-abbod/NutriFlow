import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initTheme, resolveTheme, useThemeStore } from './themeStore';

let systemDark = false;
const listeners: Array<() => void> = [];

beforeEach(() => {
  systemDark = false;
  listeners.length = 0;
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query === '(prefers-color-scheme: dark)' && systemDark,
        media: query,
        addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
});

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  useThemeStore.setState({ preference: 'system' });
});

describe('theme', () => {
  it('follows the system by default, also when it changes', () => {
    systemDark = true;
    initTheme();
    expect(useThemeStore.getState().preference).toBe('system');
    expect(document.documentElement.dataset.theme).toBe('dark');

    systemDark = false;
    listeners.forEach((listener) => listener());
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('applies and remembers a chosen theme, ignoring the system', () => {
    initTheme();
    useThemeStore.getState().setPreference('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('nutriflow.theme')).toBe('dark');

    systemDark = true;
    useThemeStore.getState().setPreference('light');
    listeners.forEach((listener) => listener());
    expect(document.documentElement.dataset.theme).toBe('light');

    useThemeStore.setState({ preference: 'system' });
    initTheme();
    expect(useThemeStore.getState().preference).toBe('light');
  });

  it('forgets the choice when going back to the system setting', () => {
    useThemeStore.getState().setPreference('dark');
    useThemeStore.getState().setPreference('system');
    expect(window.localStorage.getItem('nutriflow.theme')).toBeNull();
  });

  it('ignores unknown stored values', () => {
    window.localStorage.setItem('nutriflow.theme', 'neon');
    initTheme();
    expect(useThemeStore.getState().preference).toBe('system');
    expect(resolveTheme('system')).toBe('light');
  });

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    initTheme();
    useThemeStore.getState().setPreference('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

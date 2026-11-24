import { create } from 'zustand';

/** Flutter follows the system (`ThemeMode.system`); Profile lets the user override it. */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'nutriflow.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** A display preference only (never anything sensitive), so localStorage is fine. */
function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return PREFERENCES.find((preference) => preference === stored) ?? 'system';
  } catch {
    return 'system'; // storage blocked (private mode, settings)
  }
}

function storePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Not remembered across visits; the choice still applies now.
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

/** tokens.css switches every colour on `<html data-theme>`. */
function applyTheme(preference: ThemePreference) {
  document.documentElement.dataset.theme = resolveTheme(preference);
}

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  setPreference: (preference) => {
    storePreference(preference);
    applyTheme(preference);
    set({ preference });
  },
}));

/** Run once before the first render: apply the saved choice and follow system changes. */
export function initTheme() {
  const preference = readStoredPreference();
  useThemeStore.setState({ preference });
  applyTheme(preference);
  window.matchMedia(DARK_QUERY).addEventListener('change', () => {
    applyTheme(useThemeStore.getState().preference);
  });
}

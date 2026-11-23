import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useSnackbarStore } from '@/components/Snackbar/snackbarStore';
import { useSessionStore } from '@/features/auth/store/sessionStore';
import { useAdviceStore } from '@/features/food-log/store/adviceStore';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { tokenStore } from '@/lib/api';
import { server } from './server';

// jsdom gaps. Reduced motion is "on" so JS animations (count-ups, chart bars) settle at once.
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion: reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
});
window.scrollTo = () => {};
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  tokenStore.clear();
  useSessionStore.setState({ status: 'unknown' });
  useSnackbarStore.setState({ current: null });
  useOnboardingStore.setState({ userId: null, drafts: null, completed: false });
  useAdviceStore.setState({ lastSubmittedLog: null });
});
afterAll(() => server.close());

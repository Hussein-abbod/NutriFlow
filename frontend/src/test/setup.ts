import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useSnackbarStore } from '@/components/Snackbar/snackbarStore';
import { useSessionStore } from '@/features/auth/store/sessionStore';
import { tokenStore } from '@/lib/api';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  tokenStore.clear();
  useSessionStore.setState({ status: 'unknown' });
  useSnackbarStore.setState({ current: null });
});
afterAll(() => server.close());

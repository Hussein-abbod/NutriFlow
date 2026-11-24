import { create } from 'zustand';
import type { SessionStatus } from '../types';

interface SessionState {
  status: SessionStatus;
  setAuthenticated: () => void;
  setAnonymous: () => void;
  setUnreachable: () => void;
  /** Try restoring the session again (back to the splash). */
  retryRestore: () => void;
}

/** Global session flag. The user object itself is server state (TanStack Query). */
export const useSessionStore = create<SessionState>((set) => ({
  status: 'unknown',
  setAuthenticated: () => set({ status: 'authenticated' }),
  setAnonymous: () => set({ status: 'anonymous' }),
  setUnreachable: () => set({ status: 'unreachable' }),
  retryRestore: () => set({ status: 'unknown' }),
}));

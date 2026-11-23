import { create } from 'zustand';
import type { SessionStatus } from '../types';

interface SessionState {
  status: SessionStatus;
  setAuthenticated: () => void;
  setAnonymous: () => void;
}

/** Global session flag. The user object itself is server state (TanStack Query). */
export const useSessionStore = create<SessionState>((set) => ({
  status: 'unknown',
  setAuthenticated: () => set({ status: 'authenticated' }),
  setAnonymous: () => set({ status: 'anonymous' }),
}));

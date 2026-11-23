import { create } from 'zustand';

export type SnackbarTone = 'default' | 'error';

/** Flutter SnackBar default duration. */
export const SNACKBAR_DURATION_MS = 4000;

export interface SnackbarMessage {
  id: number;
  message: string;
  tone: SnackbarTone;
  durationMs: number;
}

interface SnackbarState {
  current: SnackbarMessage | null;
  show: (message: string, tone?: SnackbarTone, durationMs?: number) => void;
  dismiss: () => void;
}

let nextId = 1;

/** One snackbar at a time, newest replaces the old one (ScaffoldMessenger behaviour). */
export const useSnackbarStore = create<SnackbarState>((set) => ({
  current: null,
  show: (message, tone = 'default', durationMs = SNACKBAR_DURATION_MS) =>
    set({ current: { id: nextId++, message, tone, durationMs } }),
  dismiss: () => set({ current: null }),
}));

export const showSnackbar = (message: string, tone?: SnackbarTone, durationMs?: number) =>
  useSnackbarStore.getState().show(message, tone, durationMs);

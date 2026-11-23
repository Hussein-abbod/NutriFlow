import { create } from 'zustand';

export type SnackbarTone = 'default' | 'error';

export interface SnackbarMessage {
  id: number;
  message: string;
  tone: SnackbarTone;
}

interface SnackbarState {
  current: SnackbarMessage | null;
  show: (message: string, tone?: SnackbarTone) => void;
  dismiss: () => void;
}

let nextId = 1;

/** One snackbar at a time, newest replaces the old one (ScaffoldMessenger behaviour). */
export const useSnackbarStore = create<SnackbarState>((set) => ({
  current: null,
  show: (message, tone = 'default') => set({ current: { id: nextId++, message, tone } }),
  dismiss: () => set({ current: null }),
}));

export const showSnackbar = (message: string, tone?: SnackbarTone) =>
  useSnackbarStore.getState().show(message, tone);

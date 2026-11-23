import { create } from 'zustand';
import type { FoodLogDto } from '@/types/api';

interface AdviceState {
  /** The meal just logged; the food log shows its AI advice once, then clears it. */
  lastSubmittedLog: FoodLogDto | null;
  setLastSubmittedLog: (log: FoodLogDto) => void;
  clearAdvice: () => void;
}

/** FoodLogProvider.lastAdvice / lastSubmittedLog / clearAdvice(). */
export const useAdviceStore = create<AdviceState>((set) => ({
  lastSubmittedLog: null,
  setLastSubmittedLog: (log) => set({ lastSubmittedLog: log }),
  clearAdvice: () => set({ lastSubmittedLog: null }),
}));

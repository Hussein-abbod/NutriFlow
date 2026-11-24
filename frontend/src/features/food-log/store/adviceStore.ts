import { create } from 'zustand';
import { useSessionStore } from '@/features/auth';
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

// Logout and session expiry both end the session: never show one user's meal to the next.
useSessionStore.subscribe((session) => {
  if (session.status === 'anonymous') useAdviceStore.getState().clearAdvice();
});

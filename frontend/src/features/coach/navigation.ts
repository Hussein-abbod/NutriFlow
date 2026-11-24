/** The meal whose AI advice the user wants to talk about ("Discuss with Coach AI"). */
export interface CoachContext {
  foodLogId: number;
  /** Shown in the chat right away, before the coach answers. */
  advice: string;
}

/**
 * Router state for opening the coach tab about a meal (Flutter
 * `HomeScreen.switchTab(2, coachContext)`).
 */
export interface CoachContextState {
  coachContext: CoachContext;
}

/** History state is untyped (and survives reloads), so check it before use. */
export function readCoachContext(state: unknown): CoachContext | null {
  if (typeof state !== 'object' || state === null || !('coachContext' in state)) return null;
  const context: unknown = state.coachContext;
  if (typeof context !== 'object' || context === null) return null;
  if (!('foodLogId' in context) || !('advice' in context)) return null;
  const { foodLogId, advice } = context;
  if (typeof foodLogId !== 'number' || !Number.isInteger(foodLogId) || foodLogId < 1) return null;
  if (typeof advice !== 'string' || advice.length === 0) return null;
  return { foodLogId, advice };
}

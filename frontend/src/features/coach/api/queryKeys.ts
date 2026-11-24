export const coachKeys = {
  all: ['coach'] as const,
  history: () => [...coachKeys.all, 'history'] as const,
};

export const foodLogKeys = {
  all: ['food-log'] as const,
  day: (isoDay: string) => [...foodLogKeys.all, 'day', isoDay] as const,
};

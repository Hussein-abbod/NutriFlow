export const dashboardKeys = {
  all: ['dashboard'] as const,
  today: () => [...dashboardKeys.all, 'today'] as const,
  weekly: () => [...dashboardKeys.all, 'weekly'] as const,
  goalProgress: () => [...dashboardKeys.all, 'goal-progress'] as const,
};

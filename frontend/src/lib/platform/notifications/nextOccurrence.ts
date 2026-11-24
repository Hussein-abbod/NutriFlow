/** The next time it is `hour:minute` locally, strictly after `now` (today or tomorrow). */
export function nextOccurrence(now: Date, hour: number, minute: number): Date {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

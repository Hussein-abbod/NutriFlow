/** Local calendar days as `YYYY-MM-DD` (the backend's `log_date`). */

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

export function toIsoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A local Date for an ISO day, or null if the text is not a real calendar day. */
export function parseIsoDay(value: string): Date | null {
  const match = ISO_DAY.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const isRealDay =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDay ? date : null;
}

export const isIsoDay = (value: string) => parseIsoDay(value) !== null;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** food_log_tab.dart: 3 days before today, today and 3 days after. */
export const DAY_STRIP_OFFSETS = [-3, -2, -1, 0, 1, 2, 3] as const;

export function dayStrip(today: Date): string[] {
  return DAY_STRIP_OFFSETS.map((offset) => toIsoDay(addDays(today, offset)));
}

const weekdayShort = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long' });

export interface DayLabel {
  weekday: string;
  dayOfMonth: number;
  /** Month name for screen readers, e.g. "November". */
  month: string;
}

export function dayLabel(isoDay: string): DayLabel {
  const date = parseIsoDay(isoDay) ?? new Date(Number.NaN);
  return {
    weekday: weekdayShort.format(date),
    dayOfMonth: date.getDate(),
    month: monthLong.format(date),
  };
}

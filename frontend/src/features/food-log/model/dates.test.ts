import { describe, expect, it } from 'vitest';
import { addDays, dayLabel, dayStrip, isIsoDay, parseIsoDay, toIsoDay } from './dates';

describe('ISO days', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toIsoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('parses only real calendar days', () => {
    expect(parseIsoDay('2026-11-24')).toEqual(new Date(2026, 10, 24));
    expect(isIsoDay('2026-02-30')).toBe(false);
    expect(isIsoDay('2026-13-01')).toBe(false);
    expect(isIsoDay('24-11-2026')).toBe(false);
    expect(isIsoDay('2026-11-24T00:00')).toBe(false);
  });

  it('adds days across month ends', () => {
    expect(toIsoDay(addDays(new Date(2026, 10, 29), 3))).toBe('2026-12-02');
  });
});

describe('dayStrip', () => {
  it('lists three days back, today and three days ahead', () => {
    expect(dayStrip(new Date(2026, 10, 24))).toEqual([
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
    ]);
  });

  it('labels a day for the strip and for screen readers', () => {
    expect(dayLabel('2026-11-24')).toEqual({
      weekday: 'Tue',
      dayOfMonth: 24,
      month: 'November',
    });
  });
});

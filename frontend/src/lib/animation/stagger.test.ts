import { describe, expect, it } from 'vitest';
import { staggerTiming } from './stagger';

describe('staggerTiming', () => {
  it('matches the Flutter login entrance (3 items, 1000ms controller)', () => {
    const timings = [0, 1, 2].map((index) =>
      staggerTiming(index, { total: 3, controllerMs: 1000 }),
    );
    expect(timings).toEqual([
      { delayMs: 0, durationMs: 400 },
      { delayMs: 200, durationMs: 400 },
      { delayMs: 400, durationMs: 400 },
    ]);
  });

  it('uses the Flutter defaults (total 6, overlap 0.4)', () => {
    expect(staggerTiming(3, { controllerMs: 1000 })).toEqual({ delayMs: 300, durationMs: 400 });
  });

  it('clamps the interval to the controller length', () => {
    expect(staggerTiming(10, { total: 3, controllerMs: 1000 })).toEqual({
      delayMs: 1000,
      durationMs: 0,
    });
  });
});

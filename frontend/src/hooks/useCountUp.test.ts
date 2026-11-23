import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from './useCountUp';

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

describe('useCountUp', () => {
  let now = 0;
  let pending: FrameRequestCallback[] = [];
  const runFrame = (atMs: number) => {
    now = atMs;
    const callbacks = pending;
    pending = [];
    act(() => callbacks.forEach((callback) => callback(now)));
  };

  beforeEach(() => {
    pending = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      pending.push(callback);
      return pending.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => vi.unstubAllGlobals());

  it('counts up from 0 to the target with ease-out', () => {
    mockReducedMotion(false);
    const { result } = renderHook(() => useCountUp(1000, 1000));
    expect(result.current).toBe(0);

    runFrame(0);
    expect(result.current).toBe(0);
    runFrame(500);
    expect(result.current).toBe(875); // 1 - 0.5³
    runFrame(1000);
    expect(result.current).toBe(1000);
    expect(pending).toHaveLength(0);
  });

  it('animates from the current value when the target changes', () => {
    mockReducedMotion(false);
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 100), {
      initialProps: { target: 200 },
    });
    runFrame(0);
    runFrame(100);
    expect(result.current).toBe(200);

    rerender({ target: 300 });
    runFrame(200);
    expect(result.current).toBe(200);
    runFrame(300);
    expect(result.current).toBe(300);
  });

  it('jumps straight to the target when reduced motion is requested', () => {
    mockReducedMotion(true);
    const { result } = renderHook(() => useCountUp(1651.4, 1200));
    expect(result.current).toBe(1651);
  });

  it('treats non-finite targets as 0', () => {
    mockReducedMotion(true);
    const { result } = renderHook(() => useCountUp(Number.NaN, 1200));
    expect(result.current).toBe(0);
  });
});

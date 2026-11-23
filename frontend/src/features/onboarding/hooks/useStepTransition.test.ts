import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OnboardingStepIndex } from '../constants';
import { STEP_TRANSITION_MS, useStepTransition } from './useStepTransition';

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useStepTransition', () => {
  it('keeps the old step while the slide runs, then drops it', () => {
    vi.useFakeTimers();
    mockReducedMotion(false);
    const { result, rerender } = renderHook(({ step }) => useStepTransition(step), {
      initialProps: { step: 1 as OnboardingStepIndex },
    });
    rerender({ step: 2 });
    expect(result.current).toEqual({ current: 2, leaving: 1, direction: 'forward' });

    act(() => vi.advanceTimersByTime(STEP_TRANSITION_MS));
    expect(result.current.leaving).toBeNull();

    rerender({ step: 1 });
    expect(result.current).toMatchObject({ current: 1, leaving: 2, direction: 'back' });
  });

  it('switches instantly with reduced motion', () => {
    mockReducedMotion(true);
    const { result, rerender } = renderHook(({ step }) => useStepTransition(step), {
      initialProps: { step: 1 as OnboardingStepIndex },
    });
    rerender({ step: 2 });
    expect(result.current).toEqual({ current: 2, leaving: null, direction: 'forward' });
  });
});

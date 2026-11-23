import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** Curves.easeOutCubic */
const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

/**
 * Animated integer that counts from its previous value to `target`
 * (Flutter `TweenAnimationBuilder<int>` with `IntTween(begin: 0, end: target)`).
 */
export function useCountUp(target: number, durationMs: number): number {
  const reducedMotion = usePrefersReducedMotion();
  const end = Number.isFinite(target) ? Math.round(target) : 0;
  const [value, setValue] = useState(reducedMotion ? end : 0);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const start = valueRef.current;
    if (reducedMotion || durationMs <= 0 || start === end) {
      setValue(end);
      return;
    }
    let frame = 0;
    let startedAt: number | null = null;
    const tick = (now: number) => {
      startedAt ??= now;
      const progress = Math.min(1, (now - startedAt) / durationMs);
      setValue(Math.round(start + (end - start) * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, durationMs, reducedMotion]);

  return value;
}

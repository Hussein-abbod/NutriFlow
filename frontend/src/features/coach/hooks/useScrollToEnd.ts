import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * `_scrollToBottom`: keeps a scroll container at its end whenever `trigger` changes (a new
 * message, the typing indicator). Returns the ref for the container.
 */
export function useScrollToEnd<T extends HTMLElement>(trigger: unknown) {
  const containerRef = useRef<T>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [trigger, reducedMotion]);

  return containerRef;
}

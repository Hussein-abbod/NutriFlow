import { useLayoutEffect, useRef } from 'react';

/**
 * Publishes an element's rendered height as a CSS custom property on `<html>` (e.g. the
 * bottom nav, so a full-height tab such as the coach chat can leave room for it). The
 * height changes with text zoom and the safe-area inset, so it is measured, not hard-coded.
 */
export function useHeightVariable<T extends HTMLElement>(variableName: `--${string}`) {
  const elementRef = useRef<T>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const root = document.documentElement;
    const publish = () =>
      root.style.setProperty(variableName, `${element.getBoundingClientRect().height}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty(variableName);
    };
  }, [variableName]);

  return elementRef;
}

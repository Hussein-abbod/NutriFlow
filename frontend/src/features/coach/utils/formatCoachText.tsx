import type { ReactNode } from 'react';

/**
 * The coach is asked for plain text but sometimes answers with `**bold**`. Those markers
 * become <strong>; everything else stays text (React escapes it; no HTML is ever parsed).
 * Line breaks are kept by the bubble's `white-space: pre-wrap`.
 */
export function formatCoachText(text: string): ReactNode[] {
  const parts = text.split(/\*\*(?=\S)(.+?)(?<=\S)\*\*/gs);
  return parts.map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part));
}

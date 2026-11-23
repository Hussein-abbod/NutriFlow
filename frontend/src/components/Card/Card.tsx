import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Draw the subtle outline-variant border used by dashboard cards. */
  bordered?: boolean;
  padding?: 'none' | 'md' | 'lg';
}

/** Flat Material card: cardBackground(), radius 20, elevation 0. */
export function Card({ bordered = true, padding = 'md', className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        styles.card,
        bordered && styles.bordered,
        styles[`padding-${padding}`],
        className,
      )}
      {...rest}
    />
  );
}

import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { transitionKeyFor } from '../router/tabs';
import styles from './PageTransition.module.css';

/**
 * NutriAnimations.fadeThrough: fade + 4% slide-up on every route change (400ms).
 * Switching tabs is not a route change for this purpose (the tab shell fades its content).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div key={transitionKeyFor(location.pathname)} className={styles.page}>
      {children}
    </div>
  );
}

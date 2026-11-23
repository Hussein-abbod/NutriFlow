import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import styles from './PageTransition.module.css';

/** NutriAnimations.fadeThrough: fade + 4% slide-up on every route change (400ms). */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className={styles.page}>
      {children}
    </div>
  );
}

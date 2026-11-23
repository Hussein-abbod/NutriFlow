import { Spinner } from '@/components';
import { LogoBadge } from '../components/LogoBadge';
import { SPLASH_MIN_DURATION_MS, useSessionBootstrap } from '../hooks/useSessionBootstrap';
import styles from './SplashPage.module.css';

export interface SplashPageProps {
  minDurationMs?: number;
}

/** splash_screen.dart: animated logo + title while the session is restored. */
export function SplashPage({ minDurationMs = SPLASH_MIN_DURATION_MS }: SplashPageProps) {
  useSessionBootstrap(minDurationMs);

  return (
    <main className={styles.splash} aria-busy="true">
      <div className={styles.logoStack}>
        <div className={styles.glowRing} aria-hidden="true" />
        <LogoBadge variant="splash" className={styles.logo} />
      </div>

      <div className={styles.titleGroup}>
        <h1 className={styles.appName}>NutriFlow</h1>
        <p className={styles.tagline}>Smart Nutrition Tracking</p>
      </div>

      <div className={styles.loader}>
        <Spinner
          size={32}
          strokeWidth={2.5}
          color="rgb(255 255 255 / 0.5)"
          label="Loading NutriFlow"
        />
      </div>
    </main>
  );
}

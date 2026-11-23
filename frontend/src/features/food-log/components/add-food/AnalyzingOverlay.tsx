import { Spinner } from '@/components';
import type { CaptureStage } from '../../hooks/useImageCapture';
import styles from './AnalyzingOverlay.module.css';

const STEPS: Record<Exclude<CaptureStage, 'idle'>, { step: number; label: string }> = {
  preparing: { step: 1, label: 'Preparing image...' },
  analyzing: { step: 2, label: 'Analyzing with AI...' },
};

/** `_ScannerOverlay` sweep + dark scrim, spinner and the current upload step. */
export function AnalyzingOverlay({ stage }: { stage: Exclude<CaptureStage, 'idle'> }) {
  const { step, label } = STEPS[stage];
  return (
    <div className={styles.overlay}>
      <div className={styles.sweep} aria-hidden="true" />
      <div className={styles.scrim} role="status">
        <Spinner color="var(--color-white)" label={label} />
        <p className={styles.label}>{label}</p>
        <p className={styles.step}>Step {step} of 2</p>
      </div>
    </div>
  );
}

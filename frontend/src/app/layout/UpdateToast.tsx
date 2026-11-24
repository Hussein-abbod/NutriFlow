import { usePwaStore } from '@/lib/platform/pwa';
import styles from './UpdateToast.module.css';

/** "Update available": a new version was downloaded in the background; Reload switches. */
export function UpdateToast() {
  const updateAvailable = usePwaStore((state) => state.updateAvailable);
  const applyUpdate = usePwaStore((state) => state.applyUpdate);
  const dismissUpdate = usePwaStore((state) => state.dismissUpdate);

  return (
    <div className={styles.region} aria-live="polite">
      {updateAvailable && (
        <div className={styles.toast}>
          <p className={styles.message}>A new version of NutriFlow is ready.</p>
          <button type="button" className={styles.action} onClick={dismissUpdate}>
            Later
          </button>
          <button type="button" className={styles.action} onClick={applyUpdate}>
            Reload
          </button>
        </div>
      )}
    </div>
  );
}

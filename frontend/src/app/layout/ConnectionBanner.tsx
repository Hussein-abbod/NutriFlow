import { Icon } from '@/components';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import styles from './ConnectionBanner.module.css';

/** A slim notice while the device is offline: screens stay visible, saving will fail. */
export function ConnectionBanner() {
  const online = useOnlineStatus();
  return (
    <div className={styles.region} aria-live="polite">
      {!online && (
        <p className={styles.banner}>
          <Icon name="cloudOff" size={16} />
          You&apos;re offline. Changes can&apos;t be saved until you reconnect.
        </p>
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { Button, Icon } from '@/components';
import { useSessionStore } from '@/features/auth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import styles from './OfflineScreen.module.css';

/**
 * Shown when the session could not be restored because the server was out of reach. The
 * app shell itself works offline (service worker); the data does not. Retries by itself
 * when the connection comes back.
 */
export function OfflineScreen() {
  const online = useOnlineStatus();
  const retryRestore = useSessionStore((state) => state.retryRestore);

  useEffect(() => {
    window.addEventListener('online', retryRestore);
    return () => window.removeEventListener('online', retryRestore);
  }, [retryRestore]);

  return (
    <main className={styles.screen}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name="cloudOff" size={40} />
      </span>
      <h1 className={styles.title}>{online ? "Can't reach NutriFlow" : "You're offline"}</h1>
      <p className={styles.message}>
        {online
          ? "Our server isn't answering right now. Your data is safe; please try again in a moment."
          : 'NutriFlow needs an internet connection to load your meals and goals. We’ll try again as soon as you’re back online.'}
      </p>
      <Button
        variant="primary"
        leadingIcon={<Icon name="refresh" size={20} />}
        onClick={retryRestore}
      >
        Try again
      </Button>
    </main>
  );
}

import { useRouteError } from 'react-router';
import { Button, Icon } from '@/components';
import styles from './OfflineScreen.module.css';

/** A lazy screen's code could not be loaded: offline, or an update replaced the old files. */
function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(
      error.message,
    )
  );
}

/**
 * Route `errorElement`: replaces React Router's developer error page. Details are never
 * shown to the user; reloading fetches the current version of the app.
 */
export function RouteErrorScreen() {
  const error = useRouteError();
  const chunkError = isChunkLoadError(error);
  return (
    <main className={styles.screen}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name={chunkError ? 'cloudOff' : 'errorOutline'} size={40} />
      </span>
      <h1 className={styles.title}>
        {chunkError ? "This screen couldn't load" : 'Something went wrong'}
      </h1>
      <p className={styles.message}>
        {chunkError
          ? 'Check your connection, then reload. If NutriFlow was just updated, reloading gets the new version.'
          : 'Sorry, NutriFlow ran into a problem. Reloading usually fixes it; your data is safe.'}
      </p>
      <Button
        variant="primary"
        leadingIcon={<Icon name="refresh" size={20} />}
        onClick={() => window.location.reload()}
      >
        Reload
      </Button>
    </main>
  );
}

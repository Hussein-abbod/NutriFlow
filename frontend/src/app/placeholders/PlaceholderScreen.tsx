import { Button, Card, Icon } from '@/components';
import { useCurrentUser, useLogout } from '@/features/auth';
import styles from './PlaceholderScreen.module.css';

export interface PlaceholderScreenProps {
  title: string;
  message: string;
}

/** Temporary screen for routes that later sessions will build (keeps the auth flow testable). */
export function PlaceholderScreen({ title, message }: PlaceholderScreenProps) {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  return (
    <main className={styles.screen}>
      <Card className={styles.card} padding="lg">
        <p className={styles.greeting}>Hi, {user?.full_name ?? user?.email ?? 'there'}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        <Button
          variant="outlined"
          fullWidth
          leadingIcon={<Icon name="logout" size={20} />}
          loading={logout.isPending}
          loadingLabel="Logging out"
          onClick={() => logout.mutate()}
        >
          Log out
        </Button>
      </Card>
    </main>
  );
}

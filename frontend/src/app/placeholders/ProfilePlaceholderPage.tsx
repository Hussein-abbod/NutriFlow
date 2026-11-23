import { Button, Icon } from '@/components';
import { useLogout } from '@/features/auth';
import { TabPlaceholder } from './TabPlaceholder';

/** Built in session 4; keeps Log out reachable until then. */
export function ProfilePlaceholderPage() {
  const logout = useLogout();
  return (
    <TabPlaceholder
      title="Profile"
      subtitle="Your details and settings"
      icon="person"
      action={
        <Button
          variant="outlined"
          leadingIcon={<Icon name="logout" size={20} />}
          loading={logout.isPending}
          loadingLabel="Logging out"
          onClick={() => logout.mutate()}
        >
          Log out
        </Button>
      }
    />
  );
}

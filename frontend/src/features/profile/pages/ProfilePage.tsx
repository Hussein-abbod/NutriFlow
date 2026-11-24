import { ErrorState, Spinner, StaggeredEntrance } from '@/components';
import { useCurrentUser } from '@/features/auth';
import { getErrorMessage } from '@/lib/api';
import type { UserDto } from '@/types/api';
import { AccountCard } from '../components/AccountCard';
import { AllergiesCard } from '../components/AllergiesCard';
import { AppSettingsCard } from '../components/AppSettingsCard';
import { PersonalInfoCard } from '../components/PersonalInfoCard';
import { ProfileHeader } from '../components/ProfileHeader';
import { usePersonalInfoForm } from '../hooks/usePersonalInfoForm';
import styles from './ProfilePage.module.css';

/** `_buildAnimated`: Interval(i * 0.1, i * 0.1 + 0.5) over 900 ms, slide Offset(0, 0.08). */
const ENTRANCE = { step: 0.1, span: 0.5, controllerMs: 900, slidePercent: 8 } as const;

/** screens/tabs/profile_tab.dart */
export function ProfilePage() {
  const currentUser = useCurrentUser();

  if (currentUser.isError) {
    return (
      <main className={styles.status}>
        <ErrorState
          message={getErrorMessage(currentUser.error)}
          onRetry={() => void currentUser.refetch()}
        />
      </main>
    );
  }
  if (!currentUser.data) {
    return (
      <main className={styles.status}>
        <Spinner label="Loading profile" />
      </main>
    );
  }
  return <Profile user={currentUser.data} />;
}

function Profile({ user }: { user: UserDto }) {
  const personalInfo = usePersonalInfoForm(user);
  const cards = [
    <PersonalInfoCard
      key="personal"
      form={personalInfo.form}
      editing={personalInfo.editing}
      saving={personalInfo.saving}
      onSave={() => void personalInfo.save()}
      onCancel={personalInfo.cancel}
    />,
    <AllergiesCard key="allergies" allergies={user.food_allergies ?? []} />,
    <AppSettingsCard key="settings" />,
    <AccountCard key="account" />,
  ];

  return (
    <main className={styles.page}>
      <ProfileHeader
        user={user}
        editing={personalInfo.editing}
        saving={personalInfo.saving}
        onEditOrSave={personalInfo.editOrSave}
      />
      <div className={styles.cards}>
        {cards.map((card, index) => (
          <StaggeredEntrance key={card.key} index={index} {...ENTRANCE}>
            {card}
          </StaggeredEntrance>
        ))}
      </div>
    </main>
  );
}

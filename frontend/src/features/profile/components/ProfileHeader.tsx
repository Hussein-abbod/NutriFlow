import { Icon, Spinner } from '@/components';
import type { UserDto } from '@/types/api';
import styles from './ProfileHeader.module.css';

export interface ProfileHeaderProps {
  user: UserDto;
  editing: boolean;
  saving: boolean;
  /** Edit → turns the personal info fields on; Save → submits them. */
  onEditOrSave: () => void;
}

/** Flat header of profile_tab.dart: title + edit/save button, initial avatar, name, email. */
export function ProfileHeader({ user, editing, saving, onEditOrSave }: ProfileHeaderProps) {
  const name = user.full_name?.trim() || 'User';
  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Profile</h1>
        <button
          type="button"
          className={styles.editButton}
          onClick={onEditOrSave}
          disabled={saving}
          aria-label={saving ? 'Saving profile' : editing ? 'Save profile' : 'Edit profile'}
        >
          {saving ? (
            <Spinner size={20} strokeWidth={2} label="Saving profile" />
          ) : (
            <Icon name={editing ? 'save' : 'edit'} size={20} />
          )}
        </button>
      </div>
      <span className={styles.avatar} aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </span>
      <p className={styles.name}>{name}</p>
      <p className={styles.email}>{user.email}</p>
    </header>
  );
}

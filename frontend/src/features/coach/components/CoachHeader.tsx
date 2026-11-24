import { Icon } from '@/components';
import { CoachAvatar } from './CoachAvatar';
import styles from './CoachHeader.module.css';

export interface CoachHeaderProps {
  onNewChat: () => void;
  newChatDisabled: boolean;
}

/** Header of coach_ai_tab.dart: robot badge, title, subtitle and the "New Chat" pill. */
export function CoachHeader({ onNewChat, newChatDisabled }: CoachHeaderProps) {
  return (
    <header className={styles.header}>
      <CoachAvatar kind="coach" size="large" />
      <div className={styles.titles}>
        <h1 className={styles.title}>Coach AI</h1>
        <p className={styles.subtitle}>Your personal nutrition advisor</p>
      </div>
      <button
        type="button"
        className={styles.newChat}
        onClick={onNewChat}
        disabled={newChatDisabled}
      >
        <span className={styles.pill}>
          <Icon name="refresh" size={14} />
          New Chat
        </span>
      </button>
    </header>
  );
}

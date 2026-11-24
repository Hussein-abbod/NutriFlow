import { Icon } from '@/components';
import styles from './ChatEmptyState.module.css';

/** Shown in place of the conversation until the first message. */
export function ChatEmptyState() {
  return (
    <div className={styles.empty}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name="chatBubbleOutline" size={40} />
      </span>
      <p className={styles.title}>Say hi to your Coach AI!</p>
      <p className={styles.message}>Ask anything about nutrition</p>
    </div>
  );
}

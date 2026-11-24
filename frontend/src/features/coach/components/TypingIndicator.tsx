import { CoachAvatar } from './CoachAvatar';
import styles from './TypingIndicator.module.css';

/** `_TypingIndicator`: three dots fading in turn (600ms, 200ms apart). */
export function TypingIndicator() {
  return (
    <li className={styles.row}>
      <CoachAvatar kind="coach" />
      <span className={styles.bubble} role="status">
        <span className="visually-hidden">Coach AI is typing…</span>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.dot} aria-hidden="true" />
      </span>
    </li>
  );
}

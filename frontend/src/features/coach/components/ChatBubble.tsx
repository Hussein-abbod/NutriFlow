import type { CoachMessageDto } from '@/types/api';
import { cn } from '@/lib/utils/cn';
import { formatCoachText } from '../utils/formatCoachText';
import { CoachAvatar } from './CoachAvatar';
import styles from './ChatBubble.module.css';

/** coach_ai_tab.dart `_ChatBubble`: slides in from its own side, avatar on the outside. */
export function ChatBubble({ message }: { message: CoachMessageDto }) {
  const isUser = message.role === 'user';
  return (
    <li className={cn(styles.row, isUser ? styles.user : styles.coach)}>
      {!isUser && <CoachAvatar kind="coach" />}
      <p className={styles.bubble}>
        <span className="visually-hidden">{isUser ? 'You: ' : 'Coach AI: '}</span>
        {isUser ? message.content : formatCoachText(message.content)}
      </p>
      {isUser && <CoachAvatar kind="user" />}
    </li>
  );
}

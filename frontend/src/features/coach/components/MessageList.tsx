import type { CoachMessageDto } from '@/types/api';
import { useScrollToEnd } from '../hooks/useScrollToEnd';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import styles from './MessageList.module.css';

export interface MessageListProps {
  messages: CoachMessageDto[];
  typing: boolean;
}

/** The conversation, oldest first, kept scrolled to the newest message. */
export function MessageList({ messages, typing }: MessageListProps) {
  const listRef = useScrollToEnd<HTMLOListElement>(`${messages.length}:${typing}`);
  return (
    <ol
      ref={listRef}
      className={styles.list}
      aria-label="Conversation with Coach AI"
      aria-live="polite"
      aria-relevant="additions"
      // A scrollable region must be reachable by keyboard (WCAG 2.1.1); the bubbles have no
      // focusable content of their own.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
    >
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
      {typing && <TypingIndicator />}
    </ol>
  );
}

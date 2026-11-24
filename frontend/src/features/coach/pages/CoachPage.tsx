import { useState } from 'react';
import { ErrorState, Spinner } from '@/components';
import { getErrorMessage } from '@/lib/api';
import { ChatEmptyState } from '../components/ChatEmptyState';
import { ClearChatDialog } from '../components/ClearChatDialog';
import { CoachHeader } from '../components/CoachHeader';
import { MessageComposer } from '../components/MessageComposer';
import { MessageList } from '../components/MessageList';
import { QuickSuggestions } from '../components/QuickSuggestions';
import { useCoachConversation } from '../hooks/useCoachConversation';
import styles from './CoachPage.module.css';

/** screens/tabs/coach_ai_tab.dart */
export function CoachPage() {
  const { history, messages, typing, send, clear, clearing } = useCoachConversation();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const empty = messages.length === 0 && !typing;

  const sendSuggestion = (message: string) => send(message, () => undefined);

  return (
    <main className={styles.page}>
      <CoachHeader
        onNewChat={() => setConfirmingClear(true)}
        newChatDisabled={messages.length === 0 || typing}
      />
      {history.isSuccess && empty && <QuickSuggestions onPick={sendSuggestion} />}

      <div className={styles.conversation}>
        {history.isPending && !typing ? (
          <div className={styles.status}>
            <Spinner label="Loading conversation" />
          </div>
        ) : history.isError && messages.length === 0 ? (
          <div className={styles.status}>
            <ErrorState
              message={getErrorMessage(history.error)}
              onRetry={() => void history.refetch()}
            />
          </div>
        ) : empty ? (
          <ChatEmptyState />
        ) : (
          <MessageList messages={messages} typing={typing} />
        )}
      </div>

      <MessageComposer busy={typing} onSend={send} />
      <ClearChatDialog
        open={confirmingClear}
        clearing={clearing}
        onCancel={() => setConfirmingClear(false)}
        onConfirm={() => clear(() => setConfirmingClear(false))}
      />
    </main>
  );
}

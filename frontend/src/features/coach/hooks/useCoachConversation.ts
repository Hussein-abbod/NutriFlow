import { useCallback } from 'react';
import { showSnackbar } from '@/components';
import { getErrorMessage } from '@/lib/api';
import {
  useClearCoachHistory,
  useCoachHistory,
  useDiscussMeal,
  useSendCoachMessage,
} from '../api/useCoachChat';
import type { CoachContext } from '../navigation';
import { useDiscussFromRoute } from './useDiscussFromRoute';

const showError = (error: unknown) => showSnackbar(getErrorMessage(error), 'error');

/** CoachProvider: the conversation, sending, discussing a meal and starting over. */
export function useCoachConversation() {
  const history = useCoachHistory();
  const sendMessage = useSendCoachMessage();
  const discussMeal = useDiscussMeal();
  const clearHistory = useClearCoachHistory();

  const { mutate: discuss } = discussMeal;
  const startDiscussion = useCallback(
    (context: CoachContext) => discuss(context, { onError: showError }),
    [discuss],
  );
  useDiscussFromRoute(startDiscussion);

  const send = (message: string, restore: () => void) =>
    sendMessage.mutate(message, {
      onError: (error) => {
        restore();
        showError(error);
      },
    });

  const clear = (onCleared: () => void) =>
    clearHistory.mutate(undefined, { onSuccess: onCleared, onError: showError });

  return {
    history,
    messages: history.data ?? [],
    typing: sendMessage.isPending || discussMeal.isPending,
    send,
    clear,
    clearing: clearHistory.isPending,
  };
}

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { CoachMessageDto, CoachRole } from '@/types/api';
import type { CoachContext } from '../navigation';
import { coachApi } from './coachApi';
import { coachKeys } from './queryKeys';

type Messages = CoachMessageDto[];

let nextLocalId = -1;

/** A message shown before the server has stored it (negative id, never sent back). */
function localMessage(role: CoachRole, content: string): CoachMessageDto {
  return { id: nextLocalId--, role, content, created_at: new Date().toISOString() };
}

async function appendLocal(queryClient: QueryClient, message: CoachMessageDto) {
  await queryClient.cancelQueries({ queryKey: coachKeys.history() });
  queryClient.setQueryData<Messages>(coachKeys.history(), (old = []) => [...old, message]);
  return { localId: message.id };
}

function removeLocal(queryClient: QueryClient, localId: number | undefined) {
  queryClient.setQueryData<Messages>(coachKeys.history(), (old = []) =>
    old.filter((message) => message.id !== localId),
  );
}

/** CoachProvider.loadHistory: the stored conversation, oldest first. */
export function useCoachHistory() {
  return useQuery({
    queryKey: coachKeys.history(),
    queryFn: ({ signal }) => coachApi.history(signal),
    staleTime: 5 * 60_000,
  });
}

/**
 * CoachProvider.sendMessage: the question appears at once; the reply is appended when it
 * arrives. On failure the question is taken back out (the caller shows the error).
 */
export function useSendCoachMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => coachApi.send({ message }),
    onMutate: (message) => appendLocal(queryClient, localMessage('user', message)),
    onSuccess: (reply) =>
      queryClient.setQueryData<Messages>(coachKeys.history(), (old = []) => [...old, reply]),
    onError: (_error, _message, context) => removeLocal(queryClient, context?.localId),
    // Sending may have cancelled the first history load: reload the stored conversation.
    onSettled: () => queryClient.invalidateQueries({ queryKey: coachKeys.history() }),
  });
}

/**
 * "Discuss with Coach AI": the meal's advice appears as a coach message while the coach
 * prepares its answer; then the stored conversation is reloaded (Flutter `loadHistory`).
 */
export function useDiscussMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (context: CoachContext) => coachApi.send({ food_log_id: context.foodLogId }),
    onMutate: (context) => appendLocal(queryClient, localMessage('assistant', context.advice)),
    onError: (_error, _context, local) => removeLocal(queryClient, local?.localId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: coachKeys.history() }),
  });
}

/** "New Chat": deletes the stored conversation (and with it the coach's memory). */
export function useClearCoachHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => coachApi.clearHistory(),
    onSuccess: () => queryClient.setQueryData<Messages>(coachKeys.history(), []),
  });
}

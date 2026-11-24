import { AI_REQUEST_TIMEOUT_MS, apiClient } from '@/lib/api';
import type { CoachMessageDto, CoachMessageRequestDto } from '@/types/api';

/** How many earlier messages the chat shows (Flutter loaded 20). */
export const COACH_HISTORY_LIMIT = 50;

/** services/coach_service.dart */
export const coachApi = {
  history: (signal?: AbortSignal) =>
    apiClient.get<CoachMessageDto[]>(`/coach/history?limit=${COACH_HISTORY_LIMIT}`, { signal }),

  send: (body: CoachMessageRequestDto) =>
    apiClient.post<CoachMessageDto>('/coach/message', body, { timeoutMs: AI_REQUEST_TIMEOUT_MS }),

  clearHistory: () => apiClient.delete<undefined>('/coach/history'),
};

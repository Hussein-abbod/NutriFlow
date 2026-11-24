import { delay, http, HttpResponse } from 'msw';
import type { CoachMessageDto, CoachMessageRequestDto, CoachRole } from '@/types/api';
import { TEST_API } from './fixtures';

export function buildCoachMessage(
  role: CoachRole,
  content: string,
  id = Math.floor(Math.random() * 1e6),
): CoachMessageDto {
  return { id, role, content, created_at: '2026-11-24T09:00:00Z' };
}

export interface CoachServerOptions {
  /** Answer with this reply (default: "Coach reply to: <message>"). */
  reply?: (message: string) => string;
  /** The advice stored on each food log id ("Discuss with Coach AI"). */
  adviceByLogId?: Record<number, string>;
  /** Delay before /coach/message answers, e.g. 'infinite' to keep the coach typing. */
  replyDelay?: number | 'infinite';
}

/**
 * A small in-memory coach server: GET /coach/history, POST /coach/message (question or
 * meal), DELETE /coach/history. `requests` records every POST body.
 */
export function coachServer(initial: CoachMessageDto[] = [], options: CoachServerOptions = {}) {
  const messages = [...initial];
  const requests: CoachMessageRequestDto[] = [];
  let nextId = 1000;
  const add = (role: CoachRole, content: string) => {
    const message = buildCoachMessage(role, content, nextId++);
    messages.push(message);
    return message;
  };

  const handlers = [
    http.get(`${TEST_API}/coach/history`, () => HttpResponse.json(messages)),
    http.post(`${TEST_API}/coach/message`, async ({ request }) => {
      const body = (await request.json()) as CoachMessageRequestDto;
      requests.push(body);
      if (options.replyDelay !== undefined) await delay(options.replyDelay);
      if ('food_log_id' in body) {
        add('assistant', options.adviceByLogId?.[body.food_log_id] ?? 'Unknown advice');
        return HttpResponse.json(add('assistant', 'Happy to talk about this meal.'));
      }
      add('user', body.message);
      const reply = options.reply?.(body.message) ?? `Coach reply to: ${body.message}`;
      return HttpResponse.json(add('assistant', reply));
    }),
    http.delete(`${TEST_API}/coach/history`, () => {
      messages.length = 0;
      return new HttpResponse(null, { status: 204 });
    }),
  ];
  return { handlers, messages, requests };
}

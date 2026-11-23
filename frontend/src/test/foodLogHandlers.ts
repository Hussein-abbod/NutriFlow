import { http, HttpResponse } from 'msw';
import type { DayLogsDto } from '@/types/api';
import { buildDayLogs, TEST_API } from './fixtures';

/** GET /food-log/history: the given days, an empty day for any other date. */
export function foodLogHandlers(days: Record<string, DayLogsDto> = {}) {
  return [
    http.get(`${TEST_API}/food-log/history`, ({ request }) => {
      const date = new URL(request.url).searchParams.get('log_date') ?? '';
      return HttpResponse.json(days[date] ?? buildDayLogs(date));
    }),
  ];
}

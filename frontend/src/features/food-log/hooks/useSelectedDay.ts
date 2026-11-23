import { useSearchParams } from 'react-router';
import { isIsoDay, toIsoDay } from '../model/dates';

/**
 * The day shown by the food log (`?date=YYYY-MM-DD`, default today). Picking a day replaces
 * the history entry, so Back leaves the tab instead of stepping through days.
 */
export function useSelectedDay() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = toIsoDay(new Date());
  const requested = searchParams.get('date');
  const selectedDay = requested && isIsoDay(requested) ? requested : today;

  const selectDay = (day: string) =>
    setSearchParams(day === today ? {} : { date: day }, { replace: true });

  return { today, selectedDay, selectDay };
}

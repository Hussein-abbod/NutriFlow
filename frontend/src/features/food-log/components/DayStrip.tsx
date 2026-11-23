import { cn } from '@/lib/utils/cn';
import { dayLabel, dayStrip, parseIsoDay } from '../model/dates';
import styles from './DayStrip.module.css';

export interface DayStripProps {
  today: string;
  selectedDay: string;
  onSelect: (day: string) => void;
}

/** "Daily Calendar Selector": three days back, today and three days ahead. */
export function DayStrip({ today, selectedDay, onSelect }: DayStripProps) {
  const days = dayStrip(parseIsoDay(today) ?? new Date());
  return (
    <div className={styles.strip} role="group" aria-label="Choose a day">
      {days.map((day) => {
        const label = dayLabel(day);
        const selected = day === selectedDay;
        return (
          <button
            key={day}
            type="button"
            className={cn(styles.day, selected && styles.selected)}
            aria-pressed={selected}
            onClick={() => onSelect(day)}
          >
            {/* Accessible name keeps the visible text first: "Tue 24 November, today". */}
            <span className={styles.weekday}>{label.weekday}</span>{' '}
            <span className={styles.date}>{label.dayOfMonth}</span>
            <span className="visually-hidden">
              {' '}
              {label.month}
              {day === today && ', today'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

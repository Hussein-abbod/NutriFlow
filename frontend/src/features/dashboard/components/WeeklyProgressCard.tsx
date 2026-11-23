import { useId } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils/cn';
import type { DailyCaloriesDto } from '@/types/api';
import { weekdayLabel } from '../utils/progress';
import cardStyles from './DashboardCard.module.css';
import { WeeklyChartTooltip } from './WeeklyChartTooltip';
import styles from './WeeklyProgressCard.module.css';

export interface WeeklyProgressCardProps {
  weekly: DailyCaloriesDto[];
  calorieTarget: number;
}

const CHART_HEIGHT = 200;
const FALLBACK_TARGET = 2000;
const AXIS_TICK = { fontSize: 10, fontWeight: 600 };

/** Dashed target lines at every multiple of the target (fl_chart horizontalInterval). */
function targetLines(interval: number, maxY: number): number[] {
  const lines: number[] = [];
  for (let value = interval; value <= maxY; value += interval) lines.push(value);
  return lines;
}

/** `_WeeklyProgressCard`: last 7 days as gradient bars, coral when over the target. */
export function WeeklyProgressCard({ weekly, calorieTarget }: WeeklyProgressCardProps) {
  const gradientId = useId().replace(/:/g, '');
  const reducedMotion = usePrefersReducedMotion();

  if (weekly.length === 0) {
    return (
      <div className={cn(cardStyles.card, cardStyles.padded)}>
        <p className={cardStyles.message}>Not enough data yet</p>
      </div>
    );
  }

  const days = weekly.map((entry) => ({
    key: entry.date,
    day: weekdayLabel(entry.date),
    calories: entry.calories,
    over: entry.calories > calorieTarget,
  }));
  const maxY = Math.max(calorieTarget, ...days.map((day) => day.calories)) * 1.2;
  const interval = calorieTarget > 0 ? calorieTarget : FALLBACK_TARGET;

  return (
    <figure className={cn(cardStyles.card, styles.card)}>
      <div className={styles.chart} aria-hidden="true">
        <ResponsiveContainer
          width="100%"
          height={CHART_HEIGHT}
          initialDimension={{ width: 320, height: CHART_HEIGHT }}
        >
          <BarChart
            data={days}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            accessibilityLayer={false}
          >
            <defs>
              <linearGradient id={`${gradientId}-ok`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" className={styles.okStart} />
                <stop offset="100%" className={styles.okEnd} />
              </linearGradient>
              <linearGradient id={`${gradientId}-over`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" className={styles.overStart} />
                <stop offset="100%" className={styles.overEnd} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              horizontalValues={targetLines(interval, maxY)}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              tickMargin={8}
              height={28}
              interval={0}
            />
            <YAxis hide domain={[0, maxY]} />
            <Tooltip cursor={false} content={<WeeklyChartTooltip />} isAnimationActive={false} />
            <Bar
              dataKey="calories"
              barSize={18}
              radius={6}
              isAnimationActive={!reducedMotion}
              animationDuration={600}
            >
              {days.map((day) => (
                <Cell key={day.key} fill={`url(#${gradientId}-${day.over ? 'over' : 'ok'})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="visually-hidden">
        <caption>Calories in the last 7 days (target {Math.round(calorieTarget)} kcal)</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Calories</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.key}>
              <th scope="row">{day.day}</th>
              <td>
                {Math.round(day.calories)} kcal{day.over ? ' (over target)' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

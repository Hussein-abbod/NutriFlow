import styles from './WeeklyProgressCard.module.css';

export interface WeeklyChartTooltipProps {
  active?: boolean;
  payload?: readonly { value?: unknown; payload?: { over?: boolean } }[];
}

/** fl_chart BarTouchTooltipData: "<n> kcal" in white on the default dark tooltip. */
export function WeeklyChartTooltip({ active, payload }: WeeklyChartTooltipProps) {
  const entry = payload?.[0];
  if (!active || typeof entry?.value !== 'number') return null;
  return (
    <div className={styles.tooltip}>
      {Math.round(entry.value)} kcal
      {entry.payload?.over && <span className={styles.tooltipNote}> · over target</span>}
    </div>
  );
}

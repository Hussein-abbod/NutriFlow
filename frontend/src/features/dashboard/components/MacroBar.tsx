import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import { cn } from '@/lib/utils/cn';
import type { MacroSummaryDto } from '@/types/api';
import { ratio } from '../utils/progress';
import styles from './MacroBar.module.css';

export interface MacroBarProps {
  label: string;
  macro: MacroSummaryDto;
  icon: IconName;
  tone: 'protein' | 'carbs' | 'fat';
}

/** `_MacroBar`: icon + label, 6px progress bar, "consumed/target g · pct%". */
export function MacroBar({ label, macro, icon, tone }: MacroBarProps) {
  const progress = ratio(macro.consumed, macro.target);
  const percent = Math.round(progress * 100);
  const consumed = Math.round(macro.consumed);
  const target = Math.round(macro.target);
  return (
    <div className={cn(styles.macro, styles[tone])}>
      <div className={styles.label}>
        <Icon name={icon} size={14} className={styles.icon} />
        <span>{label}</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${consumed} of ${target} g`}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <p className={styles.amount}>
        {consumed}/{target}g · {percent}%
      </p>
    </div>
  );
}

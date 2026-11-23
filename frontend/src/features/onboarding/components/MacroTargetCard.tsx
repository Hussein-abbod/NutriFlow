import { GlassCard, Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils/cn';
import styles from './MacroTargetCard.module.css';

export interface MacroTargetCardProps {
  title: string;
  grams: number;
  icon: IconName;
  tone: 'protein' | 'carbs' | 'fat';
}

/** `_MacroCard` of step_summary.dart: coloured icon, counted-up grams, label. */
export function MacroTargetCard({ title, grams, icon, tone }: MacroTargetCardProps) {
  const shown = useCountUp(grams, 1000);
  return (
    <GlassCard className={styles.card} padding={16} opacity={0.1} blurAmount={10} tone="onGradient">
      <Icon name={icon} size={22} className={cn(styles.icon, styles[tone])} />
      <p className={styles.amount}>
        <span aria-hidden="true">{shown}g</span>
        <span className="visually-hidden">
          {Math.round(grams)} grams of {title.toLowerCase()}
        </span>
      </p>
      <p className={styles.title} aria-hidden="true">
        {title}
      </p>
    </GlassCard>
  );
}

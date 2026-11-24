import { useState } from 'react';
import { BottomSheet, Button, Icon } from '@/components';
import type { FoodLogDto } from '@/types/api';
import styles from './AiAdviceSheet.module.css';

export interface AiAdviceSheetProps {
  /** The meal just logged; the sheet is open while it has advice. */
  log: FoodLogDto | null;
  remainingCalories: number;
  onClose: () => void;
  /** Opens the coach about this meal (`log` is the meal just logged). */
  onDiscussWithCoach: (log: FoodLogDto) => void;
}

/** widgets/ai_advice_sheet.dart: the AI's feedback right after a meal is logged. */
export function AiAdviceSheet({
  log,
  remainingCalories,
  onClose,
  onDiscussWithCoach,
}: AiAdviceSheetProps) {
  const open = Boolean(log?.ai_advice);
  // Keep the content while the sheet slides out after `log` is cleared.
  const [shown, setShown] = useState(log);
  if (open && log !== shown) setShown(log);
  const advice = shown?.ai_advice ?? '';

  return (
    <BottomSheet open={open} onClose={onClose} label="NutriFlow Advice">
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.badge} aria-hidden="true">
            <Icon name="autoAwesome" size={20} />
          </span>
          <h2 className={styles.title}>NutriFlow Advice</h2>
        </div>
        {/* Plain text only: AI output is never rendered as HTML. */}
        <p className={styles.advice}>{advice}</p>
      </div>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>This Meal</dt>
          <dd className={styles.mealValue}>{Math.round(shown?.total_calories ?? 0)} kcal</dd>
        </div>
        <div className={styles.statDivider} aria-hidden="true" />
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Remaining</dt>
          <dd className={styles.remainingValue}>
            {Math.max(0, Math.round(remainingCalories))} kcal
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Button
          variant="outlined"
          fullWidth
          className={styles.coach}
          leadingIcon={<Icon name="chatBubbleOutline" size={18} />}
          onClick={() => shown && onDiscussWithCoach(shown)}
        >
          Discuss with Coach AI
        </Button>
        <Button variant="gradient" fullWidth className={styles.gotIt} onClick={onClose}>
          Got it!
        </Button>
      </div>
    </BottomSheet>
  );
}

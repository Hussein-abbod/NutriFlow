import { forwardRef, type InputHTMLAttributes } from 'react';
import { Icon } from '@/components';
import { cn } from '@/lib/utils/cn';
import styles from './MeasureField.module.css';

export interface MeasureFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  id: string;
  /** Unit shown inside the field after the value (Flutter `suffixText`). */
  suffix: string;
  error?: string;
  /** `large` = 18/600 value text (age, target weight). */
  valueSize?: 'default' | 'large';
}

/** Filled numeric input on a glass card (step_basic_info.dart / step_goal_selection.dart). */
export const MeasureField = forwardRef<HTMLInputElement, MeasureFieldProps>(function MeasureField(
  { id, suffix, error, valueSize = 'default', className, ...inputProps },
  ref,
) {
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <div className={cn(styles.control, error && styles.invalid)}>
        <input
          ref={ref}
          id={id}
          type="text"
          autoComplete="off"
          className={cn(styles.input, valueSize === 'large' && styles.large)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        <span className={styles.suffix} aria-hidden="true">
          {suffix}
        </span>
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          <Icon name="errorOutline" size={14} className={styles.errorIcon} />
          {error}
        </p>
      )}
    </div>
  );
});

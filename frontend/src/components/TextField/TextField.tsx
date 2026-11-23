import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '@/components/Icon/Icon';
import type { IconName } from '@/components/Icon/icons';
import { cn } from '@/lib/utils/cn';
import styles from './TextField.module.css';

export type TextFieldVariant = 'default' | 'glass';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  /** Inline validation message; marks the field invalid when set. */
  error?: string;
  /** Material icon shown before the input (Flutter `prefixIcon`). */
  icon?: IconName;
  /** Element shown after the input (Flutter `suffixIcon`), e.g. a visibility toggle. */
  endAdornment?: ReactNode;
  /** `glass` = white-on-gradient style used by the auth / onboarding screens. */
  variant?: TextFieldVariant;
  /** Hint shown under the field (Flutter `helperText`); hidden while an error is shown. */
  helperText?: string;
}

/** Outlined, filled text field with a floating label (Flutter InputDecoration). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    error,
    icon,
    endAdornment,
    variant = 'default',
    helperText,
    id,
    className,
    ...inputProps
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const showHelper = Boolean(helperText) && !error;
  const hasSuffix = endAdornment !== undefined && endAdornment !== null;
  const describedBy = [
    inputProps['aria-describedby'],
    error ? errorId : undefined,
    showHelper ? helperId : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn(styles.field, styles[variant], error && styles.invalid, className)}>
      <div className={styles.control}>
        {icon && <Icon name={icon} className={styles.prefixIcon} />}
        <input
          ref={ref}
          id={inputId}
          className={cn(styles.input, icon && styles.withPrefix, hasSuffix && styles.withSuffix)}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          {...inputProps}
          aria-describedby={describedBy || undefined}
        />
        <label htmlFor={inputId} className={cn(styles.label, icon && styles.labelWithPrefix)}>
          {label}
        </label>
        {hasSuffix && <div className={styles.suffix}>{endAdornment}</div>}
        <fieldset aria-hidden="true" className={styles.outline}>
          <legend className={styles.legend}>
            <span>{label}</span>
          </legend>
        </fieldset>
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {showHelper && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
    </div>
  );
});

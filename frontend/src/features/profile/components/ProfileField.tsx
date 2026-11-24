import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './ProfileField.module.css';

export interface ProfileFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * `_ProfileField`: a filled, borderless field. Outside edit mode it is read-only (not
 * disabled), so the values keep full contrast and stay readable by screen readers.
 */
export const ProfileField = forwardRef<HTMLInputElement, ProfileFieldProps>(function ProfileField(
  { label, error, className, readOnly, ...inputProps },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={cn(readOnly && styles.readOnly, error && styles.invalid, className)}>
      <div className={styles.box}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={styles.input}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

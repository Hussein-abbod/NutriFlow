import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '@/components/Spinner/Spinner';
import { cn } from '@/lib/utils/cn';
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary' // ElevatedButton theme
  | 'gradient' // login button: primary gradient + glow
  | 'light' // white button on coloured gradients (onboarding / register)
  | 'outlined' // OutlinedButton theme
  | 'text'; // TextButton theme

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  /** Accessible text announced while loading (the label is replaced by a spinner). */
  loadingLabel?: string;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  loadingLabel = 'Loading',
  fullWidth = false,
  leadingIcon,
  disabled,
  className,
  children,
  type = 'button',
  'aria-label': ariaLabel,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(styles.button, styles[variant], fullWidth && styles.fullWidth, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={loading ? loadingLabel : ariaLabel}
      {...rest}
    >
      {loading ? (
        <Spinner size={22} strokeWidth={2.5} color="currentColor" label={loadingLabel} />
      ) : (
        <>
          {leadingIcon}
          {children}
        </>
      )}
    </button>
  );
}

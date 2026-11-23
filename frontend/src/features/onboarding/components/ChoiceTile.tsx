import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './ChoiceTile.module.css';

export type ChoiceTileLayout = 'tile' | 'row' | 'toggle' | 'chip';

export interface ChoiceTileProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type: 'radio' | 'checkbox';
  selected: boolean;
  /** tile = gender/goal cards, row = activity levels, toggle = "None", chip = allergy chips. */
  layout: ChoiceTileLayout;
  children: ReactNode;
}

/**
 * The white-on-gradient selectable cards of the onboarding steps. A real (visually hidden)
 * radio/checkbox keeps keyboard and screen-reader behaviour native.
 */
export const ChoiceTile = forwardRef<HTMLInputElement, ChoiceTileProps>(function ChoiceTile(
  { type, selected, layout, children, className, disabled, ...inputProps },
  ref,
) {
  return (
    <label className={cn(styles.choice, disabled && styles.disabled, className)}>
      <input
        ref={ref}
        type={type}
        className={cn('visually-hidden', styles.input)}
        disabled={disabled}
        {...inputProps}
      />
      <span className={cn(styles.box, styles[layout], selected && styles.selected)}>
        {children}
      </span>
    </label>
  );
});

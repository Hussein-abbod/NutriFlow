import { forwardRef, useState } from 'react';
import { Icon } from '@/components/Icon/Icon';
import { TextField, type TextFieldProps } from '@/components/TextField/TextField';
import styles from './PasswordField.module.css';

export type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'endAdornment'>;

/** Password input with the Flutter visibility toggle (visibility_off_outlined / visibility_outlined). */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ icon = 'lockOutline', label, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <TextField
        ref={ref}
        label={label}
        icon={icon}
        type={visible ? 'text' : 'password'}
        endAdornment={
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={visible}
          >
            <Icon name={visible ? 'visibilityOutlined' : 'visibilityOffOutlined'} />
          </button>
        }
        {...props}
      />
    );
  },
);

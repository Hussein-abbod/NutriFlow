import type { ReactNode } from 'react';
import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import styles from './SettingRow.module.css';

export interface SettingRowProps {
  label: string;
  description: string;
  /** For `aria-labelledby` / `aria-describedby` on the control. */
  labelId?: string;
  descriptionId?: string;
  icon?: IconName;
  /** The control at the end of the row (switch, button). */
  children?: ReactNode;
}

/** One line of App Settings: optional icon, label + description, control. */
export function SettingRow({
  label,
  description,
  labelId,
  descriptionId,
  icon,
  children,
}: SettingRowProps) {
  return (
    <div className={styles.row}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
      )}
      <div className={styles.text}>
        <p id={labelId} className={styles.label}>
          {label}
        </p>
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

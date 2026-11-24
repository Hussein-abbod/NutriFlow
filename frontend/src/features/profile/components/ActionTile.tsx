import { Icon, Spinner } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import { cn } from '@/lib/utils/cn';
import styles from './ActionTile.module.css';

export interface ActionTileProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  /** Coral icon + text for actions that end something (Reset Goal, Logout). */
  destructive?: boolean;
  disabled?: boolean;
  /** Replaces the chevron while the action runs. */
  busy?: boolean;
}

/** profile_tab.dart `_ActionTile`: tinted icon, label, chevron. */
export function ActionTile({ icon, label, onClick, destructive, disabled, busy }: ActionTileProps) {
  return (
    <button
      type="button"
      className={cn(styles.tile, destructive && styles.destructive)}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      <span className={styles.badge} aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <span className={styles.label}>{label}</span>
      {busy ? (
        <Spinner size={16} strokeWidth={2} color="currentColor" label={`${label}…`} />
      ) : (
        <Icon name="arrowForwardIos" size={14} className={styles.chevron} />
      )}
    </button>
  );
}

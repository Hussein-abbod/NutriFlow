import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import { useThemeStore, type ThemePreference } from '@/lib/theme';
import styles from './ThemeSelector.module.css';

const OPTIONS: readonly { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'system', label: 'System', icon: 'smartphone' },
  { value: 'light', label: 'Light', icon: 'lightModeOutlined' },
  { value: 'dark', label: 'Dark', icon: 'darkModeOutlined' },
];

/** Theme toggle (new): follow the system like Flutter, or force light / dark. */
export function ThemeSelector() {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Theme</legend>
      <div className={styles.options}>
        {OPTIONS.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name="theme"
              className="visually-hidden"
              value={option.value}
              checked={preference === option.value}
              onChange={() => setPreference(option.value)}
            />
            <Icon name={option.icon} size={18} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

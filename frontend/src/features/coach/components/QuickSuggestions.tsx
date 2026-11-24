import { Icon } from '@/components';
import type { IconName } from '@/components/Icon/icons';
import styles from './QuickSuggestions.module.css';

interface Suggestion {
  icon: IconName;
  label: string;
  message: string;
}

/** The `_QuickChip`s shown while the chat is empty. */
const QUICK_SUGGESTIONS: readonly Suggestion[] = [
  {
    icon: 'lightbulbOutline',
    label: 'Meal ideas',
    message: 'Give me healthy meal ideas for today',
  },
  {
    icon: 'analyticsOutlined',
    label: 'Analyze my diet',
    message: 'Analyze my diet from this week',
  },
  { icon: 'eco', label: 'Low calorie snacks', message: 'Suggest some low calorie snacks' },
];

export function QuickSuggestions({ onPick }: { onPick: (message: string) => void }) {
  return (
    <ul className={styles.list} aria-label="Suggested questions">
      {QUICK_SUGGESTIONS.map((suggestion) => (
        <li key={suggestion.label}>
          <button type="button" className={styles.chip} onClick={() => onPick(suggestion.message)}>
            <Icon name={suggestion.icon} size={16} className={styles.icon} />
            {suggestion.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

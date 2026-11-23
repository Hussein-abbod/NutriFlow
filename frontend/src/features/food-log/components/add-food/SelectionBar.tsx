import { Button } from '@/components';
import styles from './SelectionBar.module.css';

export interface SelectionBarProps {
  count: number;
  onReview: () => void;
}

/** Bottom bar of TextFoodScreen: "N item(s) selected" + Review & Confirm. */
export function SelectionBar({ count, onReview }: SelectionBarProps) {
  return (
    <div className={styles.bar}>
      <p className={styles.count} role="status">
        {count} item(s) selected
      </p>
      <Button variant="gradient" fullWidth className={styles.review} onClick={onReview}>
        Review &amp; Confirm
      </Button>
    </div>
  );
}

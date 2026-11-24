import { useState } from 'react';
import { Icon } from '@/components';
import { EditAllergiesSheet } from './EditAllergiesSheet';
import { SectionCard } from './SectionCard';
import styles from './AllergiesCard.module.css';

/** "Food Allergies": coral chips (or "No allergies listed") with an edit button. */
export function AllergiesCard({ allergies }: { allergies: readonly string[] }) {
  const [editing, setEditing] = useState(false);
  return (
    <SectionCard
      title="Food Allergies"
      icon="healthAndSafetyOutlined"
      action={
        <button
          type="button"
          className={styles.edit}
          aria-label="Edit allergies"
          onClick={() => setEditing(true)}
        >
          <Icon name="edit" size={18} />
        </button>
      }
    >
      {allergies.length === 0 ? (
        <p className={styles.empty}>No allergies listed</p>
      ) : (
        <ul className={styles.chips}>
          {allergies.map((allergy) => (
            <li key={allergy} className={styles.chip}>
              {allergy}
            </li>
          ))}
        </ul>
      )}
      <EditAllergiesSheet open={editing} allergies={allergies} onClose={() => setEditing(false)} />
    </SectionCard>
  );
}

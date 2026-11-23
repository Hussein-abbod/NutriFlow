import { useState } from 'react';
import { BottomSheet, Icon } from '@/components';
import type { FoodItem } from '../../model/foodItem';
import { EditPortionForm } from './EditPortionForm';
import styles from './EditFoodItemSheet.module.css';

export interface EditFoodItemSheetProps {
  /** Food being edited; null closes the sheet. */
  item: FoodItem | null;
  onClose: () => void;
  onSave: (item: FoodItem) => void;
}

/** widgets/edit_food_item_sheet.dart: change the amount and unit of one food. */
export function EditFoodItemSheet({ item, onClose, onSave }: EditFoodItemSheetProps) {
  // Keep the content while the sheet slides out after `item` becomes null.
  const [shown, setShown] = useState(item);
  if (item && item !== shown) setShown(item);

  return (
    <BottomSheet open={item !== null} onClose={onClose} label={`Edit ${shown?.foodName ?? 'food'}`}>
      {shown && (
        <>
          <div className={styles.header}>
            <h2 className={styles.title}>{shown.foodName}</h2>
            <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
          <EditPortionForm
            key={shown.key}
            item={shown}
            onSave={(updated) => {
              onSave(updated);
              onClose();
            }}
          />
        </>
      )}
    </BottomSheet>
  );
}

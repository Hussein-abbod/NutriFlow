import { useState } from 'react';
import { BottomSheet } from '@/components';
import type { MealType } from '@/types/api';
import { mealLabel } from '../../model/meals';
import { addFoodUrl, foodLogPaths } from '../../paths';
import { AddFoodMethodOption } from './AddFoodMethodOption';
import styles from './AddFoodSheet.module.css';

export interface AddFoodSheetProps {
  /** Meal to add to; null closes the sheet. */
  meal: MealType | null;
  /** ISO day the food is logged on. */
  date: string;
  onClose: () => void;
}

/** add_food_sheet.dart `AddFoodSheet`: pick barcode, photo or name search. */
export function AddFoodSheet({ meal, date, onClose }: AddFoodSheetProps) {
  // Keep the last meal while the sheet slides out after `meal` becomes null.
  const [shownMeal, setShownMeal] = useState<MealType>(meal ?? 'breakfast');
  if (meal && meal !== shownMeal) setShownMeal(meal);

  const label = mealLabel(shownMeal);
  const target = { meal: shownMeal, date };

  return (
    <BottomSheet open={meal !== null} onClose={onClose} label={`Add food to ${label}`}>
      <div className={styles.content}>
        <h2 className={styles.title}>Add Food to {label}</h2>
        <p className={styles.subtitle}>Choose how you want to log food</p>
        <ul className={styles.options}>
          <AddFoodMethodOption
            to={addFoodUrl(foodLogPaths.barcode, target)}
            icon="qrCodeScanner"
            title="Barcode Scanner"
            subtitle="Scan a product barcode for instant nutrition info"
            tone="primary"
            delayMs={0}
          />
          <AddFoodMethodOption
            to={addFoodUrl(foodLogPaths.photo, target)}
            icon="cameraAlt"
            title="Log by Photo"
            subtitle="Take a photo or upload from gallery"
            tone="photo"
            delayMs={100}
          />
          <AddFoodMethodOption
            to={addFoodUrl(foodLogPaths.search, target)}
            icon="search"
            title="Search by Name"
            subtitle="Type what you ate and search the USDA database"
            tone="coral"
            delayMs={200}
          />
        </ul>
      </div>
    </BottomSheet>
  );
}

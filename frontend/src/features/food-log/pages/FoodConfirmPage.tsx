import { Navigate, useLocation } from 'react-router';
import { Button, Spinner, StaggeredEntrance } from '@/components';
import { ConfirmItemRow } from '../components/confirm/ConfirmItemRow';
import { ConfirmSummaryCard } from '../components/confirm/ConfirmSummaryCard';
import { EditFoodItemSheet } from '../components/confirm/EditFoodItemSheet';
import { SubpageLayout } from '../components/SubpageLayout';
import { useAddFoodTarget } from '../hooks/useAddFoodFlow';
import { useFoodConfirm } from '../hooks/useFoodConfirm';
import { mealLabel } from '../model/meals';
import { foodLogPaths, type AddFoodTarget } from '../paths';
import { confirmStateSchema, type ConfirmState } from '../schemas/foodLogSchemas';
import styles from './FoodConfirmPage.module.css';

/** AnimationController(700 ms): summary slides down, items fade in Interval(i·0.1, +0.5). */
const SUMMARY_ENTRANCE = { step: 0, span: 1, controllerMs: 700, slidePercent: -15 } as const;
const ITEM_ENTRANCE = { step: 0.1, span: 0.5, controllerMs: 700, slidePercent: 0 } as const;

/** screens/food_log/food_confirm_screen.dart */
export function FoodConfirmPage() {
  const target = useAddFoodTarget();
  const { state } = useLocation();
  const confirmState = confirmStateSchema.safeParse(state);
  // Nothing to confirm (reload without history state, hand-typed URL): back to the log.
  if (!target || !confirmState.success) return <Navigate to={foodLogPaths.log} replace />;
  return <FoodConfirm target={target} initial={confirmState.data} />;
}

function FoodConfirm({ target, initial }: { target: AddFoodTarget; initial: ConfirmState }) {
  const confirm = useFoodConfirm(target, initial);
  const canSubmit = confirm.items.length > 0 && !confirm.submitting;

  return (
    <SubpageLayout title={`Confirm ${mealLabel(target.meal)}`} fallback={foodLogPaths.log}>
      <StaggeredEntrance index={0} {...SUMMARY_ENTRANCE}>
        <ConfirmSummaryCard totals={confirm.totals} />
      </StaggeredEntrance>

      <ul className={styles.items} aria-label="Foods in this meal">
        {confirm.items.map((item, index) => (
          <li key={item.key}>
            <StaggeredEntrance index={index} {...ITEM_ENTRANCE}>
              <ConfirmItemRow
                item={item}
                onEdit={() => confirm.startEditing(item.key)}
                onRemove={() => confirm.removeItem(item.key)}
              />
            </StaggeredEntrance>
          </li>
        ))}
      </ul>
      {confirm.items.length === 0 && (
        <p className={styles.empty}>No foods left. Go back to add some.</p>
      )}

      <div className={styles.footer}>
        <Button
          variant="gradient"
          fullWidth
          className={styles.logMeal}
          disabled={!canSubmit}
          aria-busy={confirm.submitting || undefined}
          onClick={confirm.submit}
        >
          {confirm.submitting ? (
            <>
              <span aria-hidden="true" className={styles.spinner}>
                <Spinner size={20} strokeWidth={2.5} color="currentColor" />
              </span>
              Logging meal...
            </>
          ) : (
            'Log Meal'
          )}
        </Button>
      </div>

      <EditFoodItemSheet
        item={confirm.editing}
        onClose={confirm.stopEditing}
        onSave={confirm.updateItem}
      />
    </SubpageLayout>
  );
}

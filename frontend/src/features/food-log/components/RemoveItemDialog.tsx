import { Button, Dialog, showSnackbar } from '@/components';
import { getErrorMessage } from '@/lib/api';
import type { FoodLogItemDto } from '@/types/api';
import { useDeleteFoodItem } from '../api/useFoodLogQueries';
import styles from './RemoveItemDialog.module.css';

export interface RemoveItemDialogProps {
  item: FoodLogItemDto | null;
  onClose: () => void;
}

/** "Remove item?" AlertDialog of `_FoodItemTile`; stays open until the delete finishes. */
export function RemoveItemDialog({ item, onClose }: RemoveItemDialogProps) {
  const deleteItem = useDeleteFoodItem();

  const remove = () => {
    if (!item) return;
    deleteItem.mutate(item.id, {
      onSuccess: onClose,
      onError: (error) => {
        onClose();
        showSnackbar(getErrorMessage(error), 'error');
      },
    });
  };

  return (
    <Dialog
      open={item !== null}
      onClose={deleteItem.isPending ? () => undefined : onClose}
      title="Remove item?"
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={deleteItem.isPending}>
            Cancel
          </Button>
          <Button
            variant="text"
            className={styles.remove}
            loading={deleteItem.isPending}
            loadingLabel="Removing"
            onClick={remove}
          >
            Remove
          </Button>
        </>
      }
    >
      Remove {item?.food_name}?
    </Dialog>
  );
}

import { Icon, Spinner, TextField } from '@/components';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils/cn';
import type { MealType } from '@/types/api';
import { useTextSearch } from '../../hooks/useTextSearch';
import type { FoodItem } from '../../model/foodItem';
import { FOOD_LIMITS } from '../../schemas/limits';
import { ErrorBanner } from '../ErrorBanner';
import { SearchResultsList } from './SearchResultsList';
import { SelectionBar } from './SelectionBar';
import styles from './TextSearchPanel.module.css';

export interface TextSearchPanelProps {
  meal: MealType;
  onReview: (items: FoodItem[]) => void;
}

/** add_food_sheet.dart `TextFoodScreen`: search USDA by name or let the AI parse a meal. */
export function TextSearchPanel({ meal, onReview }: TextSearchPanelProps) {
  const { form, search, submitSearch, retry, clear, selected, add } = useTextSearch(meal);
  const query = form.watch('query');
  const queryError = form.formState.errors.query?.message;

  return (
    <div className={styles.panel}>
      <form
        className={styles.searchRow}
        role="search"
        noValidate
        onSubmit={(event) => void submitSearch(false)(event)}
      >
        <TextField
          label="Search food"
          icon="search"
          className={styles.field}
          autoComplete="off"
          enterKeyHint="search"
          maxLength={FOOD_LIMITS.textQueryMax}
          error={queryError}
          endAdornment={
            query ? (
              <button
                type="button"
                className={styles.clear}
                aria-label="Clear search"
                onClick={clear}
              >
                <Icon name="close" size={20} />
              </button>
            ) : null
          }
          {...form.register('query')}
        />
        <button
          type="submit"
          className={cn(styles.action, styles.search)}
          aria-label="Search"
          title="Search"
          disabled={search.isPending}
        >
          <Icon name="search" />
        </button>
        <button
          type="button"
          className={cn(styles.action, styles.ai)}
          aria-label="AI Parse"
          title="AI Parse: describe your whole meal"
          disabled={search.isPending}
          onClick={(event) => void submitSearch(true)(event)}
        >
          <Icon name="autoAwesome" />
        </button>
      </form>

      <div className={styles.results}>
        {search.isPending && (
          <div className={styles.status}>
            <Spinner size={32} label="Searching" />
          </div>
        )}
        {search.isError && (
          <ErrorBanner
            className={styles.error}
            message={getErrorMessage(search.error)}
            onRetry={retry}
          />
        )}
        {search.isSuccess && search.data.length > 0 && (
          <SearchResultsList results={search.data} onAdd={add} />
        )}
        {search.isSuccess && search.data.length === 0 && (
          <p className={styles.status}>
            No foods found for “{search.variables.query}”. Try another name, or describe your meal
            and tap AI Parse.
          </p>
        )}
        {search.isIdle && <p className={styles.status}>Search for food above</p>}
      </div>

      {selected.length > 0 && (
        <SelectionBar count={selected.length} onReview={() => onReview(selected)} />
      )}
    </div>
  );
}

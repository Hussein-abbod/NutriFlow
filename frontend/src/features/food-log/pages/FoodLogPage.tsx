import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { tabPaths } from '@/app/router/tabs';
import { ErrorState, Spinner, StaggeredEntrance } from '@/components';
import { useCurrentUser } from '@/features/auth';
import type { CoachContextState } from '@/features/coach';
import { getErrorMessage } from '@/lib/api';
import { notifyTargetReached } from '@/lib/notifications';
import type { DayLogsDto, FoodLogDto, FoodLogItemDto, MealType } from '@/types/api';
import { useDayLogs } from '../api/useFoodLogQueries';
import { AddFoodSheet } from '../components/add-food/AddFoodSheet';
import { AiAdviceSheet } from '../components/AiAdviceSheet';
import { CaloriesRemainingCard } from '../components/CaloriesRemainingCard';
import { DayStrip } from '../components/DayStrip';
import { FoodLogHeader } from '../components/FoodLogHeader';
import { MealSection } from '../components/MealSection';
import { ReminderPrompt } from '../components/ReminderPrompt';
import { RemoveItemDialog } from '../components/RemoveItemDialog';
import { useSelectedDay } from '../hooks/useSelectedDay';
import { DEFAULT_DAILY_CALORIES, MEALS } from '../model/meals';
import { useAdviceStore } from '../store/adviceStore';
import styles from './FoodLogPage.module.css';

/** Interval(i * 0.12, i * 0.12 + 0.5) over a 1000 ms controller, slide Offset(0, 0.15). */
const ENTRANCE = { step: 0.12, span: 0.5, controllerMs: 1000, slidePercent: 15 } as const;

/** screens/tabs/food_log_tab.dart */
export function FoodLogPage() {
  const { today, selectedDay, selectDay } = useSelectedDay();
  const user = useCurrentUser().data;
  const dayLogs = useDayLogs(selectedDay);
  const [addingTo, setAddingTo] = useState<MealType | null>(null);
  const [removing, setRemoving] = useState<FoodLogItemDto | null>(null);
  const dailyCalories = user?.daily_calories_target ?? DEFAULT_DAILY_CALORIES;
  const consumed = dayLogs.data?.total_calories ?? 0;
  const loadedToday = selectedDay === today && dayLogs.isSuccess;

  useEffect(() => {
    if (loadedToday) notifyTargetReached(consumed, dailyCalories, today);
  }, [loadedToday, consumed, dailyCalories, today]);

  return (
    <main className={styles.page}>
      <FoodLogHeader fullName={user?.full_name} />
      <DayStrip today={today} selectedDay={selectedDay} onSelect={selectDay} />
      <CaloriesRemainingCard consumed={consumed} target={dailyCalories} />
      {loadedToday && consumed > 0 && <ReminderPrompt />}

      {dayLogs.isPending ? (
        <div className={styles.status}>
          <Spinner label="Loading meals" />
        </div>
      ) : dayLogs.isError ? (
        <div className={styles.status}>
          <ErrorState
            message={getErrorMessage(dayLogs.error)}
            onRetry={() => void dayLogs.refetch()}
          />
        </div>
      ) : (
        <MealList
          day={dayLogs.data}
          dailyCalories={dailyCalories}
          onAdd={setAddingTo}
          onRemove={setRemoving}
        />
      )}

      <AddFoodSheet meal={addingTo} date={selectedDay} onClose={() => setAddingTo(null)} />
      <RemoveItemDialog item={removing} onClose={() => setRemoving(null)} />
      <MealAdvice remainingCalories={dailyCalories - consumed} />
    </main>
  );
}

interface MealListProps {
  day: DayLogsDto;
  dailyCalories: number;
  onAdd: (meal: MealType) => void;
  onRemove: (item: FoodLogItemDto) => void;
}

function MealList({ day, dailyCalories, onAdd, onRemove }: MealListProps) {
  return (
    <div className={styles.meals}>
      {MEALS.map((meal, index) => (
        <StaggeredEntrance key={meal.type} index={index} {...ENTRANCE}>
          <MealSection
            meal={meal}
            calorieTarget={dailyCalories * meal.share}
            logs={day[meal.type]}
            onAdd={() => onAdd(meal.type)}
            onRemove={onRemove}
          />
        </StaggeredEntrance>
      ))}
    </div>
  );
}

/** Shows the advice of the meal just logged once (FoodLogTab._showAdviceIfAvailable). */
function MealAdvice({ remainingCalories }: { remainingCalories: number }) {
  const navigate = useNavigate();
  const lastSubmittedLog = useAdviceStore((state) => state.lastSubmittedLog);
  const clearAdvice = useAdviceStore((state) => state.clearAdvice);

  const discussWithCoach = (log: FoodLogDto) => {
    clearAdvice();
    const state: CoachContextState = {
      coachContext: { foodLogId: log.id, advice: log.ai_advice ?? '' },
    };
    void navigate(tabPaths.coach, { state });
  };

  return (
    <AiAdviceSheet
      log={lastSubmittedLog}
      remainingCalories={remainingCalories}
      onClose={clearAdvice}
      onDiscussWithCoach={discussWithCoach}
    />
  );
}

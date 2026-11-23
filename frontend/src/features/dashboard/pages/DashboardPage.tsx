import { ErrorState, Spinner, StaggeredEntrance } from '@/components';
import { useDashboardData, type DashboardData } from '../api/useDashboardData';
import { DashboardHeader } from '../components/DashboardHeader';
import { GoalProgressCard } from '../components/GoalProgressCard';
import { MealBreakdown } from '../components/MealBreakdown';
import { SectionTitle } from '../components/SectionTitle';
import { TodaySummaryCard } from '../components/TodaySummaryCard';
import { WeeklyProgressCard } from '../components/WeeklyProgressCard';
import styles from './DashboardPage.module.css';

/** Interval(index * 0.1, + 0.5) over a 1000ms controller, slide Offset(0, 0.1). */
const ENTRANCE = { step: 0.1, span: 0.5, controllerMs: 1000, slidePercent: 10 } as const;

/** screens/tabs/dashboard_tab.dart */
export function DashboardPage() {
  const data = useDashboardData();

  if (data.status === 'pending') {
    return (
      <main className={styles.centered}>
        <Spinner label="Loading dashboard" />
      </main>
    );
  }
  if (data.status === 'error') {
    return (
      <main className={styles.centered}>
        <ErrorState message={data.message} onRetry={data.retry} />
      </main>
    );
  }
  return <DashboardContent data={data} />;
}

function DashboardContent({ data }: { data: Extract<DashboardData, { status: 'success' }> }) {
  const { today, weekly, goal } = data;
  return (
    <main className={styles.page}>
      <DashboardHeader />
      <div className={styles.content}>
        <StaggeredEntrance index={0} {...ENTRANCE}>
          <TodaySummaryCard summary={today} />
        </StaggeredEntrance>

        <section className={styles.section} aria-labelledby="dashboard-meals">
          <StaggeredEntrance index={1} {...ENTRANCE}>
            <SectionTitle id="dashboard-meals" title="Meal Breakdown" icon="restaurantMenu" />
          </StaggeredEntrance>
          <StaggeredEntrance index={2} {...ENTRANCE} className={styles.sectionBody}>
            <MealBreakdown meals={today.meals} />
          </StaggeredEntrance>
        </section>

        <section className={styles.section} aria-labelledby="dashboard-weekly">
          <StaggeredEntrance index={3} {...ENTRANCE}>
            <SectionTitle id="dashboard-weekly" title="Weekly Progress" icon="trendingUp" />
          </StaggeredEntrance>
          <StaggeredEntrance index={4} {...ENTRANCE} className={styles.sectionBody}>
            <WeeklyProgressCard weekly={weekly} calorieTarget={today.calories_target} />
          </StaggeredEntrance>
        </section>

        <section className={styles.section} aria-labelledby="dashboard-goal">
          <StaggeredEntrance index={5} {...ENTRANCE}>
            <SectionTitle id="dashboard-goal" title="Goal Progress" icon="flagOutlined" />
          </StaggeredEntrance>
          <StaggeredEntrance index={6} {...ENTRANCE} className={styles.sectionBody}>
            <GoalProgressCard goal={goal} />
          </StaggeredEntrance>
        </section>
      </div>
    </main>
  );
}

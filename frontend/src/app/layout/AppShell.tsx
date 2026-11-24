import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useMealReminders } from '@/lib/notifications';
import { BottomNav } from './BottomNav';
import styles from './AppShell.module.css';

/** home_screen.dart: the current tab (AnimatedSwitcher fade, 300ms) above the bottom nav. */
export function AppShell() {
  const { pathname } = useLocation();
  useMealReminders();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <div key={pathname} className={styles.tab}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

import { NavLink } from 'react-router';
import { Icon } from '@/components';
import { cn } from '@/lib/utils/cn';
import { APP_TABS } from '../router/tabs';
import styles from './BottomNav.module.css';

/** The custom bottom navigation of home_screen.dart (pill highlight, filled icon when active). */
export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Main">
      <ul className={styles.list}>
        {APP_TABS.map((tab) => (
          <li key={tab.path} className={styles.cell}>
            <NavLink
              to={tab.path}
              className={({ isActive }) => cn(styles.item, isActive && styles.active)}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={24}
                    className={styles.icon}
                  />
                  <span className={styles.label}>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

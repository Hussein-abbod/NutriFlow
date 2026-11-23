import type { IconName } from '@/components/Icon/icons';

export interface AppTab {
  path: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}

/** home_screen.dart `_navItems`, in the same order. */
export const APP_TABS = [
  {
    path: '/food-log',
    label: 'Food Log',
    icon: 'restaurantMenuOutlined',
    activeIcon: 'restaurantMenu',
  },
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboardOutlined', activeIcon: 'dashboard' },
  { path: '/coach', label: 'AI Coach', icon: 'smartToyOutlined', activeIcon: 'smartToy' },
  { path: '/profile', label: 'Profile', icon: 'personOutline', activeIcon: 'person' },
] as const satisfies readonly AppTab[];

export const tabPaths = {
  foodLog: APP_TABS[0].path,
  dashboard: APP_TABS[1].path,
  coach: APP_TABS[2].path,
  profile: APP_TABS[3].path,
} as const;

/** HomeScreen starts on index 0 (Food Log). */
export const DEFAULT_TAB_PATH = tabPaths.foodLog;

const TAB_PATHS: ReadonlySet<string> = new Set(APP_TABS.map((tab) => tab.path));

/** Route transitions treat the whole tab shell as one page (tabs fade on their own). */
export function transitionKeyFor(pathname: string): string {
  return TAB_PATHS.has(pathname) ? 'app-shell' : pathname;
}

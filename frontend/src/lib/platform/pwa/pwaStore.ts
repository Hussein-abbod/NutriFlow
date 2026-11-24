import { create } from 'zustand';

/** Chrome / Edge / Android `beforeinstallprompt` (not in the TypeScript DOM types yet). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  /** A new service worker is waiting; `applyUpdate` activates it and reloads. */
  updateAvailable: boolean;
  applyUpdate: () => void;
  /** The browser offered to install the app (stashed prompt). */
  installPrompt: BeforeInstallPromptEvent | null;
  dismissUpdate: () => void;
}

export const usePwaStore = create<PwaState>((set) => ({
  updateAvailable: false,
  applyUpdate: () => undefined,
  installPrompt: null,
  dismissUpdate: () => set({ updateAvailable: false }),
}));

/** Show the browser's install dialog; true when the user installed the app. */
export async function promptInstall(): Promise<boolean> {
  const event = usePwaStore.getState().installPrompt;
  if (!event) return false;
  usePwaStore.setState({ installPrompt: null }); // a prompt can only be used once
  await event.prompt();
  return (await event.userChoice).outcome === 'accepted';
}

/** iPhone / iPad Safari has no install prompt: users add the app via Share → Add to Home Screen. */
export function needsManualInstall(): boolean {
  const { userAgent, maxTouchPoints } = navigator;
  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  return isIos && !isInstalled();
}

/** Running as the installed app (home screen / app window), not in a browser tab. */
export function isInstalled(): boolean {
  const standaloneIos = 'standalone' in navigator && navigator.standalone === true;
  return standaloneIos || window.matchMedia('(display-mode: standalone)').matches;
}

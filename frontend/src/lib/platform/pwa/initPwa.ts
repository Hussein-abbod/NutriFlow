import { usePwaStore, type BeforeInstallPromptEvent } from './pwaStore';

/** How often an open app checks for a new version. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Registers the service worker (production builds only; vite-plugin-pwa `prompt` mode) and
 * listens for the install prompt. Call once at startup. A Capacitor build ships the app in
 * the binary and skips both.
 */
export function initPwa() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // offered from Profile instead of the mini-infobar
    usePwaStore.setState({ installPrompt: event as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => usePwaStore.setState({ installPrompt: null }));

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  void import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh: () =>
        usePwaStore.setState({
          updateAvailable: true,
          applyUpdate: () => void updateSW(true),
        }),
      onRegisteredSW: (_url, registration) => {
        if (!registration) return;
        setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS);
      },
    });
  });
}

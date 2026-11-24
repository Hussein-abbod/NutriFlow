import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  needsManualInstall,
  promptInstall,
  usePwaStore,
  type BeforeInstallPromptEvent,
} from './pwaStore';
import { initPwa } from './initPwa';

function fakePrompt(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as BeforeInstallPromptEvent;
  Object.assign(event, {
    prompt: vi.fn(async () => undefined),
    userChoice: Promise.resolve({ outcome }),
  });
  return event;
}

afterEach(() => {
  usePwaStore.setState({ installPrompt: null });
  vi.restoreAllMocks();
});

describe('install prompt', () => {
  it('keeps the browser prompt for later and uses it once', async () => {
    initPwa();
    const event = fakePrompt('accepted');
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(usePwaStore.getState().installPrompt).toBe(event);

    expect(await promptInstall()).toBe(true);
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(usePwaStore.getState().installPrompt).toBeNull();
    expect(await promptInstall()).toBe(false);
  });

  it('reports a dismissed install', async () => {
    usePwaStore.setState({ installPrompt: fakePrompt('dismissed') });
    expect(await promptInstall()).toBe(false);
  });

  it('forgets the prompt once the app is installed', () => {
    initPwa();
    usePwaStore.setState({ installPrompt: fakePrompt('accepted') });
    window.dispatchEvent(new Event('appinstalled'));
    expect(usePwaStore.getState().installPrompt).toBeNull();
  });

  it('explains the manual install on iPhone Safari only', () => {
    const userAgent = vi.spyOn(navigator, 'userAgent', 'get');
    userAgent.mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
    );
    expect(needsManualInstall()).toBe(true);
    userAgent.mockReturnValue('Mozilla/5.0 (Linux; Android 15) Chrome/131.0 Mobile Safari/537.36');
    expect(needsManualInstall()).toBe(false);
  });
});

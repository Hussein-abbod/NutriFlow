import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextOccurrence } from './nextOccurrence';
import { webNotifications } from './webNotifications';

const shown: Array<{ title: string; options: NotificationOptions }> = [];

/** Stands in for the browser's `Notification` constructor. */
function FakeNotification(title: string, options: NotificationOptions) {
  shown.push({ title, options });
}
FakeNotification.permission = 'granted' as NotificationPermission;
FakeNotification.requestPermission = async () => FakeNotification.permission;

beforeEach(() => {
  shown.length = 0;
  FakeNotification.permission = 'granted';
  vi.stubGlobal('Notification', FakeNotification);
});

afterEach(() => {
  webNotifications.cancelDailyReminders();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('nextOccurrence', () => {
  it('is later today when the time has not come yet, otherwise tomorrow', () => {
    const now = new Date(2026, 10, 24, 9, 30);
    expect(nextOccurrence(now, 14, 0)).toEqual(new Date(2026, 10, 24, 14, 0));
    expect(nextOccurrence(now, 8, 0)).toEqual(new Date(2026, 10, 25, 8, 0));
    expect(nextOccurrence(new Date(2026, 10, 24, 14, 0), 14, 0)).toEqual(
      new Date(2026, 10, 25, 14, 0),
    );
  });

  it('crosses month ends', () => {
    expect(nextOccurrence(new Date(2026, 10, 30, 21, 0), 8, 0)).toEqual(
      new Date(2026, 11, 1, 8, 0),
    );
  });
});

describe('webNotifications', () => {
  it('reports unsupported browsers', async () => {
    vi.stubGlobal('Notification', undefined);
    Reflect.deleteProperty(window, 'Notification');
    expect(webNotifications.permission()).toBe('unsupported');
    expect(await webNotifications.requestPermission()).toBe('unsupported');
  });

  it('asks for permission and reports the answer', async () => {
    FakeNotification.permission = 'denied';
    expect(await webNotifications.requestPermission()).toBe('denied');
    expect(webNotifications.permission()).toBe('denied');
  });

  it('shows nothing without permission', async () => {
    FakeNotification.permission = 'default';
    await webNotifications.show({ title: 'Hi', body: 'There', tag: 't' });
    expect(shown).toEqual([]);
  });

  it('fires each reminder at its time, every day, until cancelled', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 24, 7, 0));
    webNotifications.scheduleDailyReminders([
      { title: 'Morning', body: 'Log breakfast', tag: 'm', hour: 8, minute: 0 },
    ]);

    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(shown.map((notification) => notification.title)).toEqual(['Morning']);
    expect(shown[0]?.options).toMatchObject({ body: 'Log breakfast', tag: 'm' });

    await vi.advanceTimersByTimeAsync(24 * 60 * 60_000);
    expect(shown).toHaveLength(2);

    webNotifications.cancelDailyReminders();
    await vi.advanceTimersByTimeAsync(24 * 60 * 60_000);
    expect(shown).toHaveLength(2);
  });

  it('uses the service worker when one is registered', async () => {
    const showNotification = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: { getRegistration: async () => ({ showNotification }) },
    });
    await webNotifications.show({ title: 'Target Reached!', body: 'Great job!', tag: 'target' });
    expect(showNotification).toHaveBeenCalledWith(
      'Target Reached!',
      expect.objectContaining({ body: 'Great job!', tag: 'target' }),
    );
    expect(shown).toEqual([]);
  });
});

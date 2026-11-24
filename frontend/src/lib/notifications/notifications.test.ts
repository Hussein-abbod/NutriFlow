import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationPermissionState } from '@/lib/platform/notifications';
import { DAILY_REMINDERS, reminderTimesLabel, TARGET_REACHED } from './messages';
import { useNotificationSettings } from './notificationSettings';
import { notifyTargetReached } from './notifyTargetReached';
import { useMealReminders } from './useMealReminders';
import { useReminderSettings } from './useReminderSettings';

const adapter = vi.hoisted(() => {
  const fake = {
    state: 'default' as NotificationPermissionState,
    answer: 'granted' as NotificationPermissionState,
    permission: vi.fn(() => fake.state),
    requestPermission: vi.fn(async () => {
      fake.state = fake.answer;
      return fake.answer;
    }),
    show: vi.fn(async () => undefined),
    scheduleDailyReminders: vi.fn(),
    cancelDailyReminders: vi.fn(),
  };
  return fake;
});

vi.mock('@/lib/platform/notifications', () => ({ notifications: adapter }));

beforeEach(() => {
  adapter.state = 'default';
  adapter.answer = 'granted';
});

afterEach(() => {
  window.localStorage.clear();
  useNotificationSettings.setState({ remindersEnabled: false, promptDismissed: false });
});

describe('useReminderSettings', () => {
  it('asks for permission and turns reminders on', async () => {
    const { result } = renderHook(() => useReminderSettings());
    expect(result.current.status).toBe('off');

    let status = '';
    await act(async () => {
      status = await result.current.enable();
    });
    expect(status).toBe('on');
    expect(result.current.status).toBe('on');
    expect(adapter.requestPermission).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('nutriflow.reminders')).toBe('on');

    act(() => result.current.disable());
    expect(result.current.status).toBe('off');
    expect(window.localStorage.getItem('nutriflow.reminders')).toBeNull();
  });

  it('reports a refused permission as blocked and stays off', async () => {
    adapter.answer = 'denied';
    const { result } = renderHook(() => useReminderSettings());
    await act(async () => {
      expect(await result.current.enable()).toBe('blocked');
    });
    expect(result.current.status).toBe('blocked');
    expect(useNotificationSettings.getState().remindersEnabled).toBe(false);
  });

  it('knows when the browser cannot notify at all', () => {
    adapter.state = 'unsupported';
    const { result } = renderHook(() => useReminderSettings());
    expect(result.current.status).toBe('unsupported');
  });
});

describe('useMealReminders', () => {
  it('schedules the three daily reminders while enabled and cancels them on unmount', () => {
    adapter.state = 'granted';
    useNotificationSettings.setState({ remindersEnabled: true });
    const { unmount } = renderHook(() => useMealReminders());
    expect(adapter.scheduleDailyReminders).toHaveBeenCalledWith(DAILY_REMINDERS);
    unmount();
    expect(adapter.cancelDailyReminders).toHaveBeenCalled();
  });

  it('schedules nothing without permission', () => {
    adapter.state = 'denied';
    useNotificationSettings.setState({ remindersEnabled: true });
    renderHook(() => useMealReminders());
    expect(adapter.scheduleDailyReminders).not.toHaveBeenCalled();
  });
});

describe('notifyTargetReached', () => {
  beforeEach(() => {
    adapter.state = 'granted';
    useNotificationSettings.setState({ remindersEnabled: true });
  });

  it('celebrates once per day when the target is reached', () => {
    notifyTargetReached(1999, 2000, '2026-11-24');
    expect(adapter.show).not.toHaveBeenCalled();
    notifyTargetReached(2000, 2000, '2026-11-24');
    notifyTargetReached(2400, 2000, '2026-11-24');
    expect(adapter.show).toHaveBeenCalledTimes(1);
    expect(adapter.show).toHaveBeenCalledWith(TARGET_REACHED);
    notifyTargetReached(2100, 2000, '2026-11-25');
    expect(adapter.show).toHaveBeenCalledTimes(2);
  });

  it('stays quiet when reminders are off', () => {
    useNotificationSettings.setState({ remindersEnabled: false });
    notifyTargetReached(2500, 2000, '2026-11-24');
    expect(adapter.show).not.toHaveBeenCalled();
  });
});

describe('reminderTimesLabel', () => {
  it('lists the three reminder times', () => {
    expect(reminderTimesLabel('en-GB')).toBe('8:00, 14:00 and 20:00');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SnackbarHost } from '@/components';
import { useNotificationSettings } from '@/lib/notifications';
import type { NotificationPermissionState } from '@/lib/platform/notifications';
import { ReminderPrompt } from './ReminderPrompt';

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

const renderPrompt = () =>
  render(
    <>
      <ReminderPrompt />
      <SnackbarHost />
    </>,
  );

describe('ReminderPrompt', () => {
  it('turns reminders on when the user accepts', async () => {
    renderPrompt();
    await userEvent.click(screen.getByRole('button', { name: 'Turn on' }));
    expect(await screen.findByText('Meal reminders are on')).toBeVisible();
    expect(useNotificationSettings.getState().remindersEnabled).toBe(true);
    expect(screen.queryByRole('heading', { name: 'Get meal reminders?' })).not.toBeInTheDocument();
  });

  it('explains a refusal and does not ask again', async () => {
    adapter.answer = 'denied';
    renderPrompt();
    await userEvent.click(screen.getByRole('button', { name: 'Turn on' }));
    expect(await screen.findByText('Notifications are blocked in your browser')).toBeVisible();
    expect(useNotificationSettings.getState().promptDismissed).toBe(true);
  });

  it('goes away for good on "Not now"', async () => {
    const { unmount } = renderPrompt();
    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(adapter.requestPermission).not.toHaveBeenCalled();
    unmount();
    renderPrompt();
    expect(screen.queryByRole('heading', { name: 'Get meal reminders?' })).not.toBeInTheDocument();
  });

  it('is not shown once the browser was asked', () => {
    adapter.state = 'denied';
    renderPrompt();
    expect(screen.queryByRole('heading', { name: 'Get meal reminders?' })).not.toBeInTheDocument();
  });
});

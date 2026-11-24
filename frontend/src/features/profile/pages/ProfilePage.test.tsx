import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { buildUser, TEST_API } from '@/test/fixtures';
import { profileServer } from '@/test/profileHandlers';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';
import { tokenStore } from '@/lib/api';
import { usePwaStore } from '@/lib/platform/pwa';
import type { BeforeInstallPromptEvent } from '@/lib/platform/pwa/pwaStore';

const dana = buildUser({
  full_name: 'Dana Flow',
  email: 'dana@example.com',
  age: 30,
  height_cm: 165,
  weight_kg: 70.5,
  food_allergies: ['Peanuts', 'Kiwi'],
  is_profile_complete: true,
});

function renderProfile(user = dana) {
  const profile = profileServer(user);
  server.use(...profile.handlers);
  return { ...renderApp('/profile'), profile, userEvents: userEvent.setup() };
}

const card = (name: string) => screen.getByRole('region', { name });
const field = (name: string) => screen.getByRole('textbox', { name });

// The tab is a lazy route; load it once up front.
beforeAll(() => import('@/features/profile'));

describe('ProfilePage', () => {
  it('shows the user, their details and allergies', async () => {
    renderProfile();
    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText('Dana Flow')).toBeInTheDocument();
    expect(screen.getByText('dana@example.com')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();

    expect(field('Full Name')).toHaveValue('Dana Flow');
    expect(field('Age')).toHaveValue('30');
    expect(field('Height (cm)')).toHaveValue('165');
    expect(field('Weight (kg)')).toHaveValue('70.5');
    expect(field('Age')).toHaveAttribute('readonly');

    const allergies = within(card('Food Allergies')).getAllByRole('listitem');
    expect(allergies.map((chip) => chip.textContent)).toEqual(['Peanuts', 'Kiwi']);
    expect(card('Account')).toBeInTheDocument();
  });

  it('says when no allergies are listed', async () => {
    renderProfile({ ...dana, food_allergies: [] });
    expect(await screen.findByText('No allergies listed')).toBeInTheDocument();
  });

  it('edits and saves the personal information', async () => {
    const { profile, userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Edit profile' }));
    expect(field('Full Name')).toHaveFocus();
    expect(field('Weight (kg)')).not.toHaveAttribute('readonly');

    await userEvents.clear(field('Weight (kg)'));
    await userEvents.type(field('Weight (kg)'), '68');
    await userEvents.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByText('Profile updated successfully')).toBeVisible();
    expect(profile.requests).toEqual([
      {
        path: '/users/profile',
        body: { full_name: 'Dana Flow', age: 30, height_cm: 165, weight_kg: 68 },
      },
    ]);
    expect(field('Weight (kg)')).toHaveValue('68');
    expect(field('Weight (kg)')).toHaveAttribute('readonly');
  });

  it('validates before saving and can cancel', async () => {
    const { profile, userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Edit profile' }));
    await userEvents.clear(field('Age'));
    await userEvents.type(field('Age'), '7');
    await userEvents.clear(field('Full Name'));
    await userEvents.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Enter a valid age (10-100)')).toBeVisible();
    expect(screen.getByText('Required')).toBeVisible();
    expect(field('Age')).toHaveAttribute('aria-invalid', 'true');
    expect(profile.requests).toEqual([]);

    await userEvents.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(field('Age')).toHaveValue('30');
    expect(field('Full Name')).toHaveValue('Dana Flow');
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
  });

  it('shows server validation errors next to the field', async () => {
    const { userEvents } = renderProfile();
    server.use(
      http.put(`${TEST_API}/users/profile`, () =>
        HttpResponse.json(
          {
            detail: [
              { loc: ['body', 'height_cm'], msg: 'Height looks wrong.', type: 'value_error' },
            ],
          },
          { status: 422 },
        ),
      ),
    );
    await userEvents.click(await screen.findByRole('button', { name: 'Edit profile' }));
    await userEvents.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Height looks wrong.')).toBeVisible();
  });

  it('changes the password and keeps the session with the new token', async () => {
    const { profile, userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Change Password' }));
    const sheet = screen.getByRole('dialog', { name: 'Change Password' });

    await userEvents.type(within(sheet).getByLabelText('Current Password'), 'Wrong-pass1');
    await userEvents.type(within(sheet).getByLabelText('New Password'), 'BrandNew123');
    await userEvents.type(within(sheet).getByLabelText('Confirm New Password'), 'BrandNew123');
    await userEvents.click(within(sheet).getByRole('button', { name: 'Save' }));
    expect(await within(sheet).findByText('Incorrect current password')).toBeVisible();

    await userEvents.clear(within(sheet).getByLabelText('Current Password'));
    await userEvents.type(within(sheet).getByLabelText('Current Password'), 'Str0ngPass!');
    await userEvents.click(within(sheet).getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Password changed. Other devices have been signed out.'),
    ).toBeVisible();
    expect(tokenStore.getAccessToken()).toBe('after-password-change');
    expect(profile.requests.at(-1)).toEqual({
      path: '/users/password',
      body: { current_password: 'Str0ngPass!', new_password: 'BrandNew123' },
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('checks the new password before sending it', async () => {
    const { profile, userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Change Password' }));
    const sheet = screen.getByRole('dialog', { name: 'Change Password' });
    await userEvents.type(within(sheet).getByLabelText('Current Password'), 'Str0ngPass!');
    await userEvents.type(within(sheet).getByLabelText('New Password'), 'password');
    await userEvents.type(within(sheet).getByLabelText('Confirm New Password'), 'different1');
    await userEvents.click(within(sheet).getByRole('button', { name: 'Save' }));

    expect(await within(sheet).findByText('Use at least one letter and one number')).toBeVisible();
    expect(within(sheet).getByText('Passwords do not match')).toBeVisible();
    expect(profile.requests).toEqual([]);
  });

  it('edits the allergies', async () => {
    const { profile, userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Edit allergies' }));
    const sheet = screen.getByRole('dialog', { name: 'Edit Allergies' });
    expect(within(sheet).getByRole('checkbox', { name: 'Peanuts' })).toBeChecked();
    expect(within(sheet).getByRole('textbox', { name: /Other allergies/ })).toHaveValue('Kiwi');

    await userEvents.click(within(sheet).getByRole('checkbox', { name: 'Fish' }));
    await userEvents.click(within(sheet).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Allergies updated')).toBeVisible();
    expect(profile.requests).toEqual([
      { path: '/users/allergies', body: { allergies: ['Peanuts', 'Fish', 'Kiwi'] } },
    ]);
    await waitFor(() =>
      expect(
        within(card('Food Allergies'))
          .getAllByRole('listitem')
          .map((chip) => chip.textContent),
      ).toEqual(['Peanuts', 'Fish', 'Kiwi']),
    );
  });

  it('clears every allergy with "None"', async () => {
    const { profile, userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Edit allergies' }));
    const sheet = screen.getByRole('dialog', { name: 'Edit Allergies' });
    await userEvents.click(within(sheet).getByRole('checkbox', { name: 'None' }));
    expect(within(sheet).getByRole('checkbox', { name: 'Peanuts' })).toBeDisabled();
    await userEvents.click(within(sheet).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('No allergies listed')).toBeInTheDocument();
    expect(profile.requests[0]?.body).toEqual({ allergies: [] });
  });

  it('switches the theme', async () => {
    const { userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    await userEvents.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  it('explains when the browser cannot show reminders', async () => {
    renderProfile();
    const reminders = await screen.findByRole('switch', { name: 'Meal reminders' });
    expect(reminders).toBeDisabled();
    expect(reminders).toHaveAccessibleDescription(/can't show notifications/);
  });

  it('offers to install the app when the browser allows it', async () => {
    const prompt = vi.fn(async () => undefined);
    usePwaStore.setState({
      installPrompt: Object.assign(new Event('beforeinstallprompt'), {
        prompt,
        userChoice: Promise.resolve({ outcome: 'accepted' as const }),
      }) as BeforeInstallPromptEvent,
    });
    const { userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Install' }));
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('NutriFlow was added to your home screen')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
  });

  it('extends the goal by two weeks', async () => {
    const { profile, userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Extend Goal (2 Weeks)' }));
    expect(await screen.findByText('Goal extended by 2 weeks.')).toBeVisible();
    expect(profile.requests).toEqual([
      { path: '/dashboard/extend-goal', body: { extra_weeks: 2 } },
    ]);
  });

  it('resets the goal after confirming and opens onboarding', async () => {
    const { router, userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Reset Goal' }));
    const sheet = screen.getByRole('dialog', { name: 'Reset goal' });
    await userEvents.click(within(sheet).getByRole('button', { name: 'Reset Goal' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'));
  });

  it('logs out', async () => {
    const { router, userEvents } = renderProfile();
    await userEvents.click(await screen.findByRole('button', { name: 'Logout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(tokenStore.getAccessToken()).toBeNull();
  });
});

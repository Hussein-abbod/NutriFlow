import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { sessionHandlers } from '@/test/authHandlers';
import { buildUser, TEST_API } from '@/test/fixtures';
import { renderApp } from '@/test/renderApp';
import { server } from '@/test/server';
import type { OnboardingGoalResponseDto } from '@/types/api';

const newUser = buildUser({ full_name: 'Alice' });
const targets = {
  daily_calories: 1651.39,
  daily_protein: 140,
  daily_carbs: 169.64,
  daily_fat: 45.87,
};

function onboardingHandlers(goalResponses: OnboardingGoalResponseDto[]) {
  const requests: Record<string, unknown[]> = {
    profile: [],
    goal: [],
    allergies: [],
    complete: [],
  };
  let user = newUser;
  const remainingGoalResponses = [...goalResponses];
  server.use(
    ...sessionHandlers(newUser),
    http.post(`${TEST_API}/onboarding/profile`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      requests.profile?.push(body);
      user = { ...user, ...body } as typeof user;
      return HttpResponse.json(user);
    }),
    http.post(`${TEST_API}/onboarding/goal`, async ({ request }) => {
      requests.goal?.push(await request.json());
      return HttpResponse.json(remainingGoalResponses.shift());
    }),
    http.post(`${TEST_API}/onboarding/allergies`, async ({ request }) => {
      requests.allergies?.push(await request.json());
      return HttpResponse.json(user);
    }),
    http.post(`${TEST_API}/onboarding/complete`, () => {
      requests.complete?.push(true);
      return HttpResponse.json({ ...user, is_profile_complete: true });
    }),
  );
  return requests;
}

const feasible: OnboardingGoalResponseDto = {
  is_feasible: true,
  message: "Your goal is realistic and safe. Let's do this!",
  suggested_weeks: null,
  targets,
};

const next = () => userEvent.click(screen.getByRole('button', { name: 'Next' }));

describe('OnboardingPage', () => {
  it('walks through every step, saving each one, and opens the app', async () => {
    const requests = onboardingHandlers([
      {
        is_feasible: false,
        message: 'Losing 20.0 kg in 12 weeks requires losing 1.67 kg/week.',
        suggested_weeks: 21,
        targets: null,
      },
      feasible,
    ]);
    const user = userEvent.setup();
    const { router } = renderApp('/onboarding');

    // Step 1: welcome back
    expect(
      await screen.findByRole('heading', { name: 'Welcome back, Alice!' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 2: basic info (no API call yet)
    expect(await screen.findByRole('heading', { name: 'Basic Information' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Sign-up progress' })).toHaveAttribute(
      'aria-valuetext',
      'Step 2 of 6',
    );
    await user.click(screen.getByRole('radio', { name: 'Female' }));
    await user.clear(screen.getByLabelText('Age'));
    await user.type(screen.getByLabelText('Age'), '30');
    await next();

    // Step 3: activity → POST /onboarding/profile
    expect(await screen.findByRole('heading', { name: 'Activity Level' })).toBeInTheDocument();
    await next();
    expect(await screen.findByRole('alert')).toHaveTextContent('Please select an activity level');
    await user.click(screen.getByRole('radio', { name: 'Moderately Active' }));
    await next();

    // Step 4: goal → POST /onboarding/goal (unsafe first, then accepted)
    expect(await screen.findByRole('heading', { name: 'Your Goal' })).toBeInTheDocument();
    expect(requests.profile).toEqual([
      {
        full_name: 'Alice',
        age: 30,
        gender: 'female',
        height_cm: 170,
        weight_kg: 70,
        activity_level: 'moderately_active',
      },
    ]);
    await user.click(screen.getByRole('radio', { name: 'Lose Weight' }));
    await next();
    expect(await screen.findByRole('alert')).toHaveTextContent('requires losing 1.67 kg/week');
    expect(screen.getByRole('heading', { name: 'Your Goal' })).toBeInTheDocument();
    await next();

    // Step 5: allergies → POST /onboarding/allergies
    expect(await screen.findByRole('heading', { name: 'Food Allergies' })).toBeInTheDocument();
    expect(requests.goal).toEqual([
      { goal_type: 'lose_weight', target_weight_kg: 65, goal_period_weeks: 12 },
      { goal_type: 'lose_weight', target_weight_kg: 65, goal_period_weeks: 12 },
    ]);
    await user.click(screen.getByRole('checkbox', { name: 'Peanuts' }));
    await next();

    // Step 6: summary → POST /onboarding/complete → app
    expect(await screen.findByRole('heading', { name: 'Your Plan is Ready!' })).toBeInTheDocument();
    expect(requests.allergies).toEqual([{ food_allergies: ['Peanuts'] }]);
    expect(screen.getByText('1651 kcal')).toBeInTheDocument();
    expect(screen.getByText('12 weeks to reach your goal')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm & Finish' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/food-log'));
    expect(requests.complete).toHaveLength(1);
  });

  it('keeps what was typed when going back', async () => {
    onboardingHandlers([feasible]);
    const user = userEvent.setup();
    renderApp('/onboarding');
    await user.click(await screen.findByRole('button', { name: 'Continue' }));
    await user.clear(await screen.findByLabelText('Age'));
    await user.type(screen.getByLabelText('Age'), '44');
    await next();
    await screen.findByRole('heading', { name: 'Activity Level' });

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByLabelText('Age')).toHaveValue('44');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(
      await screen.findByRole('heading', { name: 'Welcome back, Alice!' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });

  it('shows the server error and stays on the step when saving fails', async () => {
    onboardingHandlers([feasible]);
    server.use(
      http.post(`${TEST_API}/onboarding/profile`, () =>
        HttpResponse.json({ detail: 'Service unavailable' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderApp('/onboarding');
    await user.click(await screen.findByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: 'Basic Information' });
    await next();
    await user.click(await screen.findByRole('radio', { name: 'Sedentary' }));
    await next();
    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
    expect(screen.getByRole('heading', { name: 'Activity Level' })).toBeInTheDocument();
  });

  it('starts a returning user with their saved details', async () => {
    onboardingHandlers([feasible]);
    server.use(
      ...sessionHandlers(
        buildUser({ full_name: 'Bo', age: 52, gender: 'female', weight_kg: 81.5 }),
      ),
    );
    const user = userEvent.setup();
    renderApp('/onboarding');
    await user.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(await screen.findByLabelText('Age')).toHaveValue('52');
    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked();
    expect(screen.getByLabelText('Weight')).toHaveValue('81.5');
  });
});

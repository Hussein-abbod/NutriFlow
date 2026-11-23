# PROJECT_STATE.md — Current state of NutriFlow

> Every AI session: read [AGENTS.md](AGENTS.md) first, then this file.
> At the end of the session, update this file so the next session can continue.

_Last updated: 2026-11-24 — session 2 finished._

---

## Current goal: migrate the client from Flutter to React + TypeScript (PWA)

- The Flutter app in `mobile/` is **frozen** (reference only, do not edit).
- The new client lives in `frontend/` (React 18 + TypeScript + Vite, PWA). It will later be wrapped
  with Capacitor to produce Android and iOS apps.
- The FastAPI backend in `backend/` stays and is improved where needed (with tests).
- The migration is split into 4 sessions. Prompts are in [docs/MIGRATION_PROMPTS.md](docs/MIGRATION_PROMPTS.md).

## Migration progress

| # | Session | Status |
| --- | --- | --- |
| 1 | Foundation: backend tests + security fixes, frontend setup, design system, API client, auth (splash, login, register) | ✅ Done |
| 2 | Onboarding (6 steps), app shell with bottom tabs, dashboard tab | ✅ Done |
| 3 | Food logging: text / barcode / image, confirm, edit, AI advice, history, delete | ⬜ Not started |
| 4 | Coach AI, profile, notifications, PWA, full E2E, README, final review | ⬜ Not started |

Status legend: ⬜ not started · 🟨 in progress · ✅ done

## Flutter → React screen map

| Flutter file (`mobile/lib/…`) | React target (`frontend/src/…`) | Status |
| --- | --- | --- |
| `screens/splash_screen.dart` | `features/auth/pages/SplashPage.tsx` | ✅ |
| `screens/login_screen.dart` | `features/auth/pages/LoginPage.tsx` | ✅ |
| `screens/onboarding/step_welcome.dart` (sign-up form) | `features/auth/pages/RegisterPage.tsx` (route `/register`) | ✅ |
| `screens/onboarding_screen.dart` + `screens/onboarding/step_*.dart` (steps 2–6, "Welcome back") | `features/onboarding/pages/OnboardingPage.tsx` + `components/steps/*Step.tsx` | ✅ |
| `providers/onboarding_provider.dart` | `features/onboarding/store/onboardingStore.ts` + `hooks/useOnboardingFlow.ts` | ✅ |
| `screens/home_screen.dart` (bottom tabs) | `app/layout/AppShell.tsx` + `BottomNav.tsx`, tabs in `app/router/tabs.ts` | ✅ |
| `screens/tabs/dashboard_tab.dart` + `providers/dashboard_provider.dart` + `models/dashboard_model.dart` | `features/dashboard/pages/DashboardPage.tsx`, `components/*`, `api/useDashboardData.ts`, `utils/progress.ts` | ✅ |
| `screens/tabs/food_log_tab.dart` | `features/food-log/pages/FoodLogPage.tsx` | ⬜ |
| `screens/food_log/add_food_sheet.dart` (1005 lines → split) | `features/food-log/components/add-food/…` | ⬜ |
| `screens/food_log/food_confirm_screen.dart` | `features/food-log/pages/FoodConfirmPage.tsx` | ⬜ |
| `widgets/edit_food_item_sheet.dart` | `features/food-log/components/EditFoodItemSheet.tsx` (use `components/BottomSheet`) | ⬜ |
| `widgets/ai_advice_sheet.dart` | `features/food-log/components/AiAdviceSheet.tsx` (use `components/BottomSheet`) | ⬜ |
| `screens/tabs/coach_ai_tab.dart` | `features/coach/pages/CoachPage.tsx` | ⬜ |
| `screens/tabs/profile_tab.dart` | `features/profile/pages/ProfilePage.tsx` | ⬜ |
| `widgets/glass_card.dart` | `components/GlassCard` | ✅ |
| `widgets/animated_gradient_ring.dart` | `components/AnimatedGradientRing` | ✅ |
| `services/notification_service.dart` | `lib/notifications/…` (web, Capacitor later) | ⬜ |

Temporary tab placeholders (`app/placeholders/`): `FoodLogPlaceholderPage` (`/food-log`, replace in
session 3), `CoachPlaceholderPage` (`/coach`) and `ProfilePlaceholderPage` (`/profile`, has the only
**Log out** button for now) — replace in session 4. All use `TabPlaceholder` (tab header + "Coming soon").

## Frontend overview (`frontend/`)

- **Stack:** Vite 6, React 18.3, TypeScript 5.8 (`strict`, `noUncheckedIndexedAccess`), React Router 7
  (`react-router` package, data router), TanStack Query 5, Zustand 5, react-hook-form 7 + zod 4
  (`@hookform/resolvers` 7), Recharts 3.10 (+ `react-is` peer), Vitest 5 + Testing Library + MSW 2,
  Playwright, vite-plugin-pwa 2, Inter via `@fontsource-variable/inter` (self-hosted, works offline).
- **Design tokens:** `src/styles/tokens.css` — every colour, gradient, type style, radius, shadow,
  duration and curve from `theme.dart` / `animations.dart`, light + dark (`prefers-color-scheme`,
  same as Flutter `ThemeMode.system`). Onboarding step gradients are tokens too
  (`--gradient-onboarding-*`). Type utility classes in `typography.css`.
- **Shared components** (`src/components`, all exported from `index.ts`, each with a test): Button
  (`primary`, `gradient`, `light`, `outlined`, `text`, loading state), TextField (Material outlined
  field with floating label + notch, `default` / `glass` variants, forwards refs for RHF),
  PasswordField, Card, GlassCard, AnimatedGradientRing, BottomSheet (focus trap, Esc, scrim, exit
  animation), Spinner, ErrorState, EmptyState, Snackbar (`showSnackbar(msg, 'error')`),
  StaggeredEntrance (port of `NutriAnimations.stagger`), Icon (Material icon paths in `icons.ts` —
  add new icons there).
- **API layer:** `src/lib/api` — `apiClient.get/post/put/delete<T>()`, base URL from
  `VITE_API_BASE_URL` (validated), typed `ApiError` (`status`, `kind`, `fieldErrors` from 422),
  20 s timeout, access token in memory (`tokenStore`), automatic refresh on 401 with one in-flight
  refresh per tab and a Web Locks lock across tabs, session-expired event when the server rejects
  the refresh (401/403). 429/5xx/network during refresh do **not** log the user out.
- **Forms:** one zod schema per form in `features/<x>/schemas`; `lib/forms/reportFormError.ts` puts
  422 field errors inline and shows other server errors in an error snackbar (Flutter behaviour).
- **Auth/session:** `features/auth` — `useSessionStore` (`unknown | authenticated | anonymous`),
  `useCurrentUser()` (TanStack Query `['auth','me']`), `useLogin/useRegister/useLogout`.
  The splash restores the session (refresh cookie → `/auth/me`) and stays ≥ 2.5 s like Flutter.
- **Routing / guards:** `app/router/routes.tsx` + `RouteGate` with `resolveRedirect()` in
  `features/auth/routing.ts`: anonymous → `/login`; signed in, onboarding incomplete → `/onboarding`;
  onboarded → `/home`, which redirects to the first tab `/food-log` (Flutter `HomeScreen` starts on
  index 0). Tabs are real routes: `/food-log`, `/dashboard`, `/coach`, `/profile` (`app/router/tabs.ts`)
  inside `AppShell` (tab content fades 300ms; bottom nav is sticky). Route changes use the Flutter
  `fadeThrough` transition (`PageTransition`), keyed so tab switches don't re-animate the shell.
- **Onboarding** (`features/onboarding`): `OnboardingPage` = gradient background (`StepBackground`,
  cross-fade per step), `OnboardingStepIndicator`, `StepViewport` (500ms horizontal slide, old step
  inert, focus moves to the new heading, no slide with reduced motion), `OnboardingNav` (Back / Next /
  Confirm & Finish; Next submits the current step's `<form id>`; during the slide the 2nd click of a
  double-click is ignored so it can't submit the incoming step).
  Steps: `WelcomeBackStep` (signed-in user arriving from login/reload), `BasicInfoStep`,
  `ActivityLevelStep`, `GoalStep`, `AllergiesStep`, `SummaryStep`; each step = RHF + one zod schema in
  `schemas/` (ranges in `schemas/limits.ts` mirror `backend/app/schemas/common.py`). State lives in
  `store/onboardingStore.ts` (Zustand, keyed by user id; drafts survive Back/Next; prefilled from the
  user after "Reset Goal"). `useOnboardingFlow` does Flutter's `_nextPage`: profile is POSTed on the
  activity step, goal on the goal step (`is_feasible: false` → snackbar with the backend message),
  allergies, then complete → user cache updated → guard opens the app. Right after sign-up
  `useRegister({ onRegistered: startAfterSignUp })` starts at "Basic Information" like Flutter.
- **Dashboard** (`features/dashboard`): `useDashboardData` loads today/weekly/goal-progress together
  (one spinner, one error with Retry, like `DashboardProvider.loadDashboard`). Components:
  `DashboardHeader`, `TodaySummaryCard` (ring + count-up + `MacroBar`s), `MealBreakdown`/`MealCard`,
  `WeeklyProgressCard` (Recharts; gradient bars, coral when over target, dashed coral target lines,
  dark tooltip, visually-hidden table for screen readers), `GoalProgressCard` (+ `GoalEndedActions`:
  when 0 days are left, "Extend 2 weeks" and "Reset Goal" with a bottom-sheet confirmation;
  `api/useGoalActions.ts`). Helpers ported from `dashboard_model.dart` in `utils/progress.ts`.
- The dashboard route is **lazy-loaded** (`routes.tsx` `lazy`), so Recharts (~400 kB) is not in the
  main bundle; tests that open it first `import('@/features/dashboard')` in `beforeAll`.
- **Accessibility (session 2):** axe-core 4.10 scan of all new screens in light + dark → 0 WCAG 2.1 AA
  violations; keyboard order nav → content; touch targets ≥ 48 px; choices are native radios /
  checkboxes; step changes move focus to the new heading; chart has a screen-reader table.
- **Shared hooks:** `hooks/useCountUp.ts` (Flutter `TweenAnimationBuilder<int>`),
  `hooks/usePrefersReducedMotion.ts`. `StaggeredEntrance` also supports the
  `Interval(i·step, i·step+span)` timing (`step`/`span` props) and `slidePercent`.
  `TextField` has `helperText`. `lib/api/errorMessage.ts` → `getErrorMessage(error)` (only backend
  messages are shown to users).
- **Platform adapter:** `src/lib/platform/index.ts` (web only for now; Capacitor build will send
  `X-Client-Platform: native` and keep the refresh token in secure storage).
- **Env:** `.env.development` (`VITE_API_BASE_URL=http://localhost:8000`), `.env.test`
  (`http://api.test` for MSW), `.env.example`. Public values only.

## Backend API (current)

Base URL in dev: `http://localhost:8000` (docs at `/docs`).

- **Auth** `/auth`: `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`
- **Users** `/users`: `GET /profile`, `PUT /profile`, `PUT /password`, `PUT /allergies`
- **Onboarding** `/onboarding`: `POST /profile`, `POST /goal`, `POST /allergies`, `POST /complete`
- **Food log** `/food-log`: `POST /barcode`, `POST /image`, `POST /text`, `POST /submit`,
  `GET /today`, `GET /history`, `DELETE /item/{item_id}`
- **Dashboard** `/dashboard`: `GET /today`, `GET /weekly`, `GET /goal-progress`, `PUT /reset-goal`, `PUT /extend-goal` (body `{"extra_weeks": 1–52}`)
- **Coach** `/coach`: `POST /message`, `GET /history`, `DELETE /history`
- **Health**: `GET /`, `GET /health`

Note: the README lists some endpoints with old names (`/food_log/...`, `/coach/chat`,
`/dashboard/summary`). The list above is the real one; fix the README in session 4.

### Auth contract (changed in session 1)

| Client | Request | Access token | Refresh token |
| --- | --- | --- | --- |
| Web (default) | — | JSON body (`access_token`, `expires_in`), kept in memory | `nf_refresh` cookie: httpOnly, Secure, SameSite=strict, Path=/auth, 7 days. Body `refresh_token` is `null`. |
| Native (Capacitor later) | header `X-Client-Platform: native` | JSON body | JSON body; send back as `{"refresh_token": "..."}` to `/auth/refresh` and `/auth/logout`. Cookies are ignored. |

- `POST /auth/refresh` rotates: the old refresh token is revoked and a new pair issued. A cookie
  refresh from an `Origin` outside `CORS_ORIGINS` → 403.
- `POST /auth/logout` revokes the presented access + refresh tokens and clears the cookie; always 204.
- `POST /auth/register` accepts optional `full_name` (the Flutter sign-up form collects it).
- Every JWT has a `jti`; refresh tokens are rejected as access tokens (was a bug).
- Errors are always `{"detail": "..."}` (422 → list of `{loc, msg, type}`); 429 →
  `{"detail": "Too many requests. Please try again later."}`.

### Backend changes in session 1

- `CORS_ORIGINS` env allow-list (wildcard rejected), `allow_credentials=True`.
- Settings: `SECRET_KEY` ≥ 32 chars (app refuses to start otherwise); cookie and rate-limit settings
  (see `backend/.env.example`).
- One shared slowapi limiter (`app/limiter.py`): register 5/min, login 10/min, refresh 30/min,
  password change 5/min, AI endpoints (`/food-log/text|image|barcode`, `/coach/message`) 20/min.
- Validation: shared constrained types in `app/schemas/common.py` (password 8–72 chars and ≤ 72
  bytes for bcrypt, names 1–255 trimmed, allergies ≤ 30 × 1–100 chars, age 10–100, height (0, 300],
  weight (0, 500]); `PUT /users/profile` now validates ranges; coach message ≤ 2000 chars.
- Users/onboarding logic moved to `services/user_service.py` and `services/onboarding_service.py`.
- Bug fixes: `PUT /users/profile` crashed (500) when weight/age/height changed (missing
  `calculate_daily_targets`); completing onboarding twice created two active goals.
- No DB schema changes → no Alembic migration this session (DB head: `79ed88a76e66`).
- Removed scratch scripts `backend/test_usda.py`, `test_usda2.py` (network-only, unused).

### Backend changes in session 2

- Dashboard logic moved to `services/dashboard_service.py`, schemas to `schemas/dashboard.py`; router
  is HTTP only. `reset-goal` / `extend-goal` now return `{"message": ...}` via `MessageOut`.
- **`PUT /dashboard/extend-goal` fixed** (was always 500): `extra_weeks` 1–52 (422 otherwise); the new
  target date is `max(target_date, today) + weeks`; daily targets are recalculated with
  `calculate_nutrition_plan` over the weeks actually left; no deficit/surplus once the target weight
  is reached; maintain goals keep `goal_period_weeks = null`; 404 without an active goal.
- **Realistic body ranges** (`schemas/common.py`): height 50–300 cm, weight 20–500 kg (was > 0);
  `GoalData.target_weight_kg` uses the same weight range. Age stays 10–100.
- **Goal direction check** (`POST /onboarding/goal`): lose needs a target below the current weight,
  gain above it → 400 `"To lose weight, your target must be below your current weight (70 kg)."`.
- No DB schema change → no Alembic migration (head still `79ed88a76e66`).
- New tests: `tests/test_dashboard.py`, `tests/test_calorie_calculator.py`, more onboarding cases
  (165 backend tests).

## Decisions log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-11-23 | Move client from Flutter to React + TypeScript PWA; Capacitor later for Android/iOS | Developer is more comfortable with React; one codebase for web + native |
| 2026-11-23 | Freeze `mobile/` (Flutter) as UI reference | Keep the working app as a backup and design source |
| 2026-11-23 | Web: access token in memory + refresh token in httpOnly cookie; native: header-selected body tokens | AGENTS.md §5; JS can never read the refresh token on web |
| 2026-11-23 | React 18 (not the template's 19) | AGENTS.md §2 |
| 2026-11-23 | zod 4, Vitest 5, vite-plugin-pwa 2 instead of older majors | Older versions had open security advisories (`npm audit`) |
| 2026-11-23 | Backend tests use in-memory SQLite (override with `TEST_DATABASE_URL` for MySQL) | Fast, isolated, never touches the dev DB |
| 2026-11-23 | Sign-up is its own route `/register` (Flutter shows it as onboarding step 1, incl. the 6-segment progress bar) | Clean URLs + guards; same look |
| 2026-11-23 | On dark gradient screens, GlassCard uses `tone="onGradient"` (translucent white in light mode too, not Flutter's 70 % white), glass inputs focus white, errors `#FFCC80` | Flutter's light-mode glass card puts white text on near-white (fails WCAG AA) |
| 2026-11-23 | Server errors on forms → error snackbar (coral, white text); 422 field errors → inline | Matches Flutter SnackBar; white on `#FF5252` (Flutter dark) fails contrast, so coral is used in both themes |
| 2026-11-23 | Material icons as inline SVG paths (`components/Icon/icons.ts`), no icon library | Tiny bundle, exact Flutter glyphs |
| 2026-11-24 | Recharts 3.10.1 for charts (not the 6-day-old 3.11.0) | AGENTS.md §2; stable release |
| 2026-11-24 | Tabs are URLs (`/food-log`, `/dashboard`, `/coach`, `/profile`); `/home` → `/food-log` | Deep links + back button; Flutter's default tab is Food Log |
| 2026-11-24 | Signed-in users with incomplete onboarding see step 1 as "Welcome back, name!" (Flutter `StepWelcome` when authenticated); fresh sign-ups skip it | Same as Flutter |
| 2026-11-24 | "None" allergies sends `[]` (Flutter sent `["None"]`); free text is split on commas | Clean data for profile + AI coach |
| 2026-11-24 | Lose/gain picks suggest a target 5 kg away when none fits; drafts persist on Back | Flutter defaulted to 70 kg and lost input on Back |
| 2026-11-24 | Small text on onboarding gradients uses white 90 % (`--color-on-gradient-muted`), errors are white text + orange icon/ring | Flutter's 50–70 % white and orange text are < 4.5:1 on the blue/teal steps |
| 2026-11-24 | "Over target" red in dark mode is `#FF5252` (`--color-over-target`) | Flutter's `#BA1A1A` is unreadable on the dark card |
| 2026-11-24 | Dashboard shows Extend / Reset goal only when the goal period has ended (0 days left) | Uses the endpoints now; Flutter only had them in the profile tab (session 4 adds them there too) |
| 2026-11-24 | No pull-to-refresh on the web dashboard; TanStack Query refetches on focus / after mutations | Browser has no RefreshIndicator equivalent |

## Known issues / TODO

- **Token revocation is in memory** (`app/utils/security.py`): lost on restart and not shared
  between workers, so a revoked/rotated refresh token works again after a restart. Fix: a
  `revoked_tokens` table (jti + exp, pruned) or Redis — needs a migration.
- **Password change does not end other sessions** (pre-existing): add a per-user token version /
  `password_changed_at` claim checked in `decode_token` (migration needed).
- `user_service._recalculate_targets` (profile edit) spreads the goal over the *whole*
  `goal_period_weeks` from the current weight, while `extend-goal` uses the weeks left. Align them
  when the profile tab is built (session 4).
- `food_log` and `coach` routers still hold business logic and have few tests — move to services +
  test them in sessions 3–4. Food-log request schemas have no numeric ranges yet.
- Onboarding has no Log out button (Flutter neither); a user can leave via the URL `/login` only
  after the session ends. Consider adding one in session 4.
- `mobile/windows/flutter/generated_plugin_registrant.cc` has a local, uncommitted change that was
  already there before session 2 — not ours, left untouched and not committed.
- passlib 1.7 + bcrypt 4.2 logs a harmless `bcrypt.__about__` traceback at first hash; consider
  replacing passlib with direct `bcrypt` calls.
- `npm audit`: 0 production vulnerabilities; 4 moderate dev-only (glob/minimatch inside
  `workbox-build`, used by vite-plugin-pwa at build time).
- Use the same host for app and API in dev (`localhost`, not `127.0.0.1`), otherwise the
  SameSite=strict cookie is not sent. Phone testing over a LAN IP needs HTTPS (Secure cookie).
- Two tabs refreshing at the very same moment are serialised by Web Locks; very old browsers
  without Web Locks could still race and log one tab out.

## How to run

```
# MySQL (XAMPP): start from the XAMPP panel, or
C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:\xampp\mysql\bin\my.ini --standalone

# Backend
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0
#   first time: pip install -r requirements-dev.txt ; copy .env.example to .env ; alembic upgrade head

# Frontend
cd frontend && npm install && npm run dev        # http://localhost:5173
```

### Checks (all must pass)

```
cd backend  && venv\Scripts\python -m pytest          # 165 tests, SQLite, AI/USDA mocked
cd frontend && npm run lint                            # ESLint (0 warnings) + Prettier
cd frontend && npm run typecheck && npm test           # tsc -b ; Vitest (208 tests)
cd frontend && npx playwright install chromium         # first time only
cd frontend && npm run test:e2e                        # Playwright vs REAL backend (needs MySQL);
                                                       # starts uvicorn + vite if not running
cd frontend && npm run build                           # production build + service worker
```

## Next step

Start **Session 3** using Prompt 3 in `docs/MIGRATION_PROMPTS.md`: food logging (text / barcode /
image, confirm, edit, AI advice, history, delete). Replace `app/placeholders/FoodLogPlaceholderPage.tsx`
at `/food-log` (keep the route path), split `add_food_sheet.dart` into small components, use
`components/BottomSheet`, and after a meal is logged invalidate `['dashboard']` queries so the
dashboard updates. Move `food_log` router logic into a service with tests and add numeric ranges to
the food-log request schemas. Test helpers to reuse: `test/dashboardHandlers.ts`, `test/renderStep.tsx`,
fixtures in `test/fixtures.ts`, E2E helpers in `e2e/helpers.ts`.

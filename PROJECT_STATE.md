# PROJECT_STATE.md — Current state of NutriFlow

> Every AI session: read [AGENTS.md](AGENTS.md) first, then this file.
> At the end of the session, update this file so the next session can continue.

_Last updated: 2026-11-23 — migration planned, not started._

---

## Current goal: migrate the client from Flutter to React + TypeScript (PWA)

- The Flutter app in `mobile/` is **frozen** (reference only, do not edit).
- The new client lives in `frontend/` (React + TypeScript + Vite, PWA). It will later be wrapped
  with Capacitor to produce Android and iOS apps.
- The FastAPI backend in `backend/` stays and is improved where needed (with tests).
- The migration is split into 4 sessions. Prompts are in [docs/MIGRATION_PROMPTS.md](docs/MIGRATION_PROMPTS.md).

## Migration progress

| # | Session | Status |
| --- | --- | --- |
| 1 | Foundation: backend tests + security fixes, frontend setup, design system, API client, auth (splash, login, register) | ⬜ Not started |
| 2 | Onboarding (6 steps), app shell with bottom tabs, dashboard tab | ⬜ Not started |
| 3 | Food logging: text / barcode / image, confirm, edit, AI advice, history, delete | ⬜ Not started |
| 4 | Coach AI, profile, notifications, PWA, full E2E, README, final review | ⬜ Not started |

Status legend: ⬜ not started · 🟨 in progress · ✅ done

## Flutter → React screen map

| Flutter file (`mobile/lib/…`) | React target (`frontend/src/…`) | Status |
| --- | --- | --- |
| `screens/splash_screen.dart` | `features/auth/pages/SplashPage.tsx` | ⬜ |
| `screens/login_screen.dart` | `features/auth/pages/LoginPage.tsx` (+ register) | ⬜ |
| `screens/onboarding_screen.dart` + `screens/onboarding/step_*.dart` (6 steps) | `features/onboarding/…` | ⬜ |
| `screens/home_screen.dart` (bottom tabs) | `app/layout/AppShell.tsx` | ⬜ |
| `screens/tabs/dashboard_tab.dart` | `features/dashboard/pages/DashboardPage.tsx` | ⬜ |
| `screens/tabs/food_log_tab.dart` | `features/food-log/pages/FoodLogPage.tsx` | ⬜ |
| `screens/food_log/add_food_sheet.dart` (1005 lines → split) | `features/food-log/components/add-food/…` | ⬜ |
| `screens/food_log/food_confirm_screen.dart` | `features/food-log/pages/FoodConfirmPage.tsx` | ⬜ |
| `widgets/edit_food_item_sheet.dart` | `features/food-log/components/EditFoodItemSheet.tsx` | ⬜ |
| `widgets/ai_advice_sheet.dart` | `features/food-log/components/AiAdviceSheet.tsx` | ⬜ |
| `screens/tabs/coach_ai_tab.dart` | `features/coach/pages/CoachPage.tsx` | ⬜ |
| `screens/tabs/profile_tab.dart` | `features/profile/pages/ProfilePage.tsx` | ⬜ |
| `widgets/glass_card.dart`, `widgets/animated_gradient_ring.dart` | `components/…` | ⬜ |
| `services/notification_service.dart` | `lib/notifications/…` (web, Capacitor later) | ⬜ |

## Backend API (current)

Base URL in dev: `http://localhost:8000` (docs at `/docs`).

- **Auth** `/auth`: `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`
- **Users** `/users`: `GET /profile`, `PUT /profile`, `PUT /password`, `PUT /allergies`
- **Onboarding** `/onboarding`: `POST /profile`, `POST /goal`, `POST /allergies`, `POST /complete`
- **Food log** `/food-log`: `POST /barcode`, `POST /image`, `POST /text`, `POST /submit`,
  `GET /today`, `GET /history`, `DELETE /item/{item_id}`
- **Dashboard** `/dashboard`: `GET /today`, `GET /weekly`, `GET /goal-progress`, `PUT /reset-goal`, `PUT /extend-goal`
- **Coach** `/coach`: `POST /message`, `GET /history`, `DELETE /history`
- **Health**: `GET /`, `GET /health`

Note: the README lists some endpoints with old names (`/food_log/...`, `/coach/chat`,
`/dashboard/summary`). The list above is the real one; fix the README in session 4.

## Known issues found before migration (to fix in session 1)

- CORS is `allow_origins=["*"]` in `backend/app/main.py` → move to an env allow-list.
- No backend test suite (`backend/tests/` does not exist). `backend/test_usda.py` and
  `test_usda2.py` are scratch scripts, not real tests.
- No `backend/.env.example`.
- API base URL is hard-coded in the Flutter client (`mobile/lib/services/api_client.dart`) — the React
  client must use `VITE_API_BASE_URL`.

## Decisions log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-11-23 | Move client from Flutter to React + TypeScript PWA; Capacitor later for Android/iOS | Developer is more comfortable with React; one codebase for web + native |
| 2026-11-23 | Freeze `mobile/` (Flutter) as UI reference | Keep the working app as a backup and design source |

## How to run

```
# Backend
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0

# Frontend (after session 1)
cd frontend && npm install && npm run dev
```

## Next step

Start **Session 1** using Prompt 1 in `docs/MIGRATION_PROMPTS.md`.

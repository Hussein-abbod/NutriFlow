# Migration prompts — Flutter → React + TypeScript (PWA)

Use **one prompt per Claude Code session**, in order. Start each session fresh, from the repo root.
Each prompt tells the agent to read `AGENTS.md` and `PROJECT_STATE.md` first and to update
`PROJECT_STATE.md` at the end, so nothing is lost between sessions.

---

## Prompt 1 — Foundation: backend safety net, frontend setup, design system, auth

```
Read AGENTS.md and PROJECT_STATE.md fully before doing anything. Follow every rule in AGENTS.md.
We are migrating the client of NutriFlow from Flutter (mobile/, FROZEN – never edit it) to a new
React + TypeScript + Vite PWA in a new folder frontend/. This is session 1 of 4.

Goal of this session: a safe backend with tests, a clean frontend foundation, and working auth
screens that look exactly like the Flutter ones.

PART A — Backend audit and test baseline
1. Read every file in backend/app/ to understand models, schemas, routers and services.
2. Create backend/tests/ with pytest + FastAPI TestClient, a separate test database, and fixtures
   (test user, auth headers). Mock Groq, Gemini and USDA calls. Add pytest to requirements
   (or a requirements-dev.txt).
3. Write tests for the existing auth, users and onboarding endpoints: happy path, 422 validation
   errors, 401 without token, and that a user cannot read or change another user's data.
4. Fix security issues you find, the proper way, with tests:
   - CORS: replace allow_origins=["*"] with an allow-list from env (CORS_ORIGINS).
   - Check Pydantic validation ranges/lengths on all auth/user/onboarding inputs.
   - Check rate limiting on login/register.
   - Token strategy for the web: access token returned in the body (kept in memory by the client),
     refresh token in an httpOnly, Secure, SameSite cookie. Keep a body-based refresh option that a
     future Capacitor native client can use. Implement it in the backend with tests.
   - Add backend/.env.example with dummy values (never commit the real .env).
   Move the scratch files backend/test_usda.py and test_usda2.py out of the way only if they are
   not used (or turn them into real mocked tests).

PART B — Frontend foundation (frontend/)
5. Scaffold Vite + React + TypeScript (strict). Install and configure: React Router, TanStack Query,
   Zustand, react-hook-form, zod, ESLint, Prettier, Vitest, React Testing Library, MSW, Playwright,
   vite-plugin-pwa (basic manifest for now). Add npm scripts: dev, build, lint, typecheck, test,
   test:e2e.
6. Create the folder structure exactly as described in AGENTS.md section 3.
7. Design system: read mobile/lib/config/theme.dart and animations.dart and convert ALL colours,
   gradients, typography (Inter), radii, shadows and animation durations into
   src/styles/tokens.css (light + dark). Build the shared components the Flutter app uses:
   Button, TextField, Card, GlassCard (from widgets/glass_card.dart), AnimatedGradientRing
   (from widgets/animated_gradient_ring.dart), BottomSheet, Spinner, ErrorState, EmptyState.
   Each with a test.
8. API client in src/lib/api/: base URL from VITE_API_BASE_URL, typed request helpers, JSON errors
   mapped to a typed ApiError, access token in memory, automatic refresh on 401 (single in-flight
   refresh), logout on refresh failure. Unit-test it with MSW.

PART C — Auth screens
9. Port mobile/lib/screens/splash_screen.dart and login_screen.dart (login + register) to
   features/auth/. Open the Dart files and the images in screenshots/ and reproduce the layout,
   spacing, colours, text, icons, animations and loading/error states as exactly as possible.
   zod validation on all fields with inline error messages (same rules as the backend).
10. Route guards: unauthenticated → login; authenticated but onboarding not complete → onboarding
    placeholder; otherwise → home placeholder.
11. Tests: component tests for both pages (validation, submit, error from server), and one
    Playwright test that registers and logs in against the REAL running backend.

FINISH
12. Run: backend pytest, frontend lint, typecheck, test, test:e2e. Everything must pass.
13. Run /code-review and /security-review on your changes and fix the findings.
14. Update PROJECT_STATE.md (progress table, screen map, decisions, backend changes, how to run,
    next step = session 2). Commit in small Conventional Commits and push to GitHub.
```

---

## Prompt 2 — Onboarding, app shell, dashboard

```
Read AGENTS.md and PROJECT_STATE.md fully before doing anything. Follow every rule in AGENTS.md.
This is session 2 of 4 of the Flutter → React migration. mobile/ is FROZEN (reference only).
Continue from where PROJECT_STATE.md says session 1 ended. If anything from session 1 is broken
or unfinished, fix it first.

Goal: onboarding flow, the main app shell with bottom tabs, and the dashboard tab — all visually
identical to the Flutter app.

1. Onboarding: port mobile/lib/screens/onboarding_screen.dart, providers/onboarding_provider.dart and
   all 6 steps in screens/onboarding/ (welcome, basic info, goal selection, activity level,
   allergies, summary) into features/onboarding/. One component per step, a shared stepper/progress
   header, state in a small store or form context, and back/next navigation like Flutter.
   Validate every input with zod (age, height, weight, target weight, etc. — realistic ranges that
   match the backend). Connect to POST /onboarding/profile, /goal, /allergies, /complete.
2. App shell: port screens/home_screen.dart (bottom navigation with the same tabs, icons, active
   states and transitions). Tabs that are not built yet show a clean placeholder.
3. Dashboard: port screens/tabs/dashboard_tab.dart, providers/dashboard_provider.dart and
   models/dashboard_model.dart into features/dashboard/. Use GET /dashboard/today, /weekly,
   /goal-progress and PUT /reset-goal, /extend-goal. Charts with Recharts styled like fl_chart in
   the Flutter app. The 582-line Flutter file must become several small components
   (header, calorie ring, macro cards, weekly chart, goal progress card, …).
4. Backend: add pytest tests for onboarding and dashboard endpoints (including calorie calculation
   in utils/calorie_calculator.py, edge cases, 401/422). If the frontend needs a change in the API,
   do it properly (schema + service + router + migration if needed + tests) and record it.
5. Tests: component tests for each onboarding step (validation + navigation), dashboard
   components (loading, empty, error, data), and a Playwright flow: register → complete onboarding
   → see the dashboard with the correct targets, against the real backend.
6. Compare each screen side by side with the Flutter code and screenshots/; fix differences.
   Check mobile widths (360–430px) and dark mode. Run design:accessibility-review on the new screens.

FINISH: run all backend and frontend tests/linters (must pass), run /code-review and
/security-review and fix findings, update PROJECT_STATE.md (next step = session 3),
commit with Conventional Commits and push to GitHub.
```

---

## Prompt 3 — Food logging (text, barcode, image)

```
Read AGENTS.md and PROJECT_STATE.md fully before doing anything. Follow every rule in AGENTS.md.
This is session 3 of 4 of the Flutter → React migration. mobile/ is FROZEN (reference only).
Continue from where PROJECT_STATE.md says session 2 ended; fix anything left broken first.

Goal: the complete food logging feature, visually identical to the Flutter app.

1. Port into features/food-log/:
   - screens/tabs/food_log_tab.dart (today's logs grouped by meal, history by date, delete item)
   - screens/food_log/add_food_sheet.dart — 1005 lines in Flutter; split it into small parts:
     sheet container, mode tabs, TextSearchPanel, BarcodeScannerPanel, ImageCapturePanel,
     search results list, and hooks for each mode. No file over ~250 lines.
   - screens/food_log/food_confirm_screen.dart
   - widgets/edit_food_item_sheet.dart and widgets/ai_advice_sheet.dart
   - models/food_item_model.dart, food_log_model.dart, providers/food_log_provider.dart,
     services/food_log_service.dart
2. Connect to POST /food-log/text, /barcode, /image, /submit, GET /today, /history,
   DELETE /item/{item_id}. After submit/delete, invalidate the dashboard queries so the
   dashboard updates.
3. Barcode: browser camera scanner (e.g. @zxing/browser) behind an adapter in
   src/lib/platform/ so Capacitor's native scanner can replace it later. Handle camera
   permission denied, no camera, and a manual barcode input fallback.
4. Image: camera/file input, validate type (jpeg/png/webp) and size, compress before upload,
   show a preview and progress.
5. Validation & security: zod for quantities/servings (positive, sane max), text length limits,
   barcode format. Backend: verify server-side validation for the same, file MIME/size checks
   on /image, ownership check on delete (a user cannot delete another user's item), rate limits
   on AI endpoints. Fix properly with tests.
6. Backend tests for all food-log endpoints with Groq/Gemini/USDA mocked: happy path,
   not found barcode, invalid image, 401, 403/404 on someone else's item, 422.
7. Frontend tests: each panel and sheet (states and validation), hooks with MSW, and a
   Playwright flow: log a food by text → confirm → it appears in the log and the dashboard
   totals change (real backend; AI can be mocked at the backend level for E2E if needed —
   document how).
8. Compare with the Flutter code and screenshots/, check mobile widths and dark mode, run
   design:accessibility-review.

FINISH: all tests/linters pass, /code-review and /security-review with fixes, update
PROJECT_STATE.md (next step = session 4), Conventional Commits, push to GitHub.
```

---

## Prompt 4 — Coach AI, profile, notifications, PWA, final polish

```
Read AGENTS.md and PROJECT_STATE.md fully before doing anything. Follow every rule in AGENTS.md.
This is session 4 of 4 (final) of the Flutter → React migration. mobile/ is FROZEN.
Continue from where PROJECT_STATE.md says session 3 ended; fix anything left broken first.

Goal: finish the remaining features, make the app an installable PWA ready for Capacitor, and
verify the whole system end to end.

1. Coach AI: port screens/tabs/coach_ai_tab.dart, providers/coach_provider.dart,
   services/coach_service.dart, models/coach_message_model.dart into features/coach/.
   POST /coach/message, GET /coach/history, DELETE /coach/history. Chat bubbles, typing
   indicator, auto-scroll, clear history confirmation — like Flutter. Render AI text safely
   (no raw HTML). Message length limit (zod + backend).
2. Profile: port screens/tabs/profile_tab.dart into features/profile/ (split it — 549 lines in
   Flutter): view/edit profile (PUT /users/profile), change password (PUT /users/password, with
   current password + strength rules), allergies (PUT /users/allergies), theme toggle, logout
   (POST /auth/logout, clears the cookie and in-memory state).
3. Notifications: port the behaviour of services/notification_service.dart (daily log reminder,
   goal reached celebration) using the Web Notifications API behind an adapter in
   src/lib/platform/notifications so Capacitor Local Notifications can replace it later.
   Ask permission at a sensible moment, handle denied/unsupported. Document iOS PWA limits in
   PROJECT_STATE.md.
4. PWA: complete vite-plugin-pwa setup — manifest (name, icons in all sizes from the Flutter
   app icon, theme colour from tokens), service worker, offline app shell with a friendly
   offline screen, install prompt, update-available toast. Lighthouse PWA/accessibility/
   performance checks should pass reasonably.
5. Backend: tests for coach and users endpoints (LLM mocked), password change rules, and a final
   check that every non-public route requires auth and checks ownership. Run the full suite and
   report coverage.
6. Full E2E with Playwright against the real backend: register → onboarding → log food →
   dashboard updates → coach chat → edit profile → logout → login again.
7. Final quality pass over frontend/ and backend/: no file over ~400 lines, no duplicated code,
   no dead code, consistent naming, all states handled, light + dark mode, mobile widths.
   Run design:accessibility-review and design:design-critique on the main screens and fix.
8. Update README.md: React + TypeScript + PWA tech stack (Flutter listed as the legacy client),
   correct API endpoint list (see PROJECT_STATE.md), setup steps for frontend, how to test on a
   phone (deploy or HTTPS tunnel), and a short "Next: Capacitor for Android/iOS" section.

FINISH: all tests/linters pass, /code-review and /security-review with fixes, update
PROJECT_STATE.md (migration complete, remaining TODOs, next step = Capacitor), commit with
Conventional Commits and push to GitHub.
```

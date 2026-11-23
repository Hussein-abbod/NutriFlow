# AGENTS.md — Rules for AI coding agents working on NutriFlow

Read this file **and** [PROJECT_STATE.md](PROJECT_STATE.md) before doing anything.
At the end of every session, update `PROJECT_STATE.md` (see "Session handoff" below).

---

## 1. Project at a glance

NutriFlow is an AI-driven nutrition tracking app (FYP project).

| Folder | What it is | Status |
| --- | --- | --- |
| `backend/` | Python · FastAPI · SQLAlchemy · MySQL · Alembic · LangChain (Groq, Gemini) · USDA API | **Active** |
| `frontend/` | React · TypeScript · Vite · PWA (later wrapped with Capacitor for Android/iOS) | **Active — main client** |
| `mobile/` | Original Flutter app | **FROZEN — reference only** |
| `screenshots/` | Screenshots of the Flutter app (visual reference) | Reference |

### The Flutter app is frozen
- **Never edit, delete, move, or reformat anything in `mobile/`.**
- Use it only as the **source of truth for UI and behaviour**: when building a screen in `frontend/`,
  open the matching Dart file in `mobile/lib/` and reproduce its layout, spacing, colours, typography,
  icons, copy (text), states (loading / empty / error) and animations as closely as the web allows.
- Design tokens (colours, gradients, font sizes, radii) come from `mobile/lib/config/theme.dart` and
  `mobile/lib/config/animations.dart`.

---

## 2. Frontend stack (do not swap libraries without recording why in PROJECT_STATE.md)

- **Build:** Vite + React 18 + TypeScript (`strict: true`, no `any` unless justified in a comment).
- **Routing:** React Router.
- **Server state:** TanStack Query (all API data goes through query/mutation hooks).
- **Client state:** Zustand (small, only for truly global UI/session state).
- **Forms & validation:** react-hook-form + zod. One zod schema per form, reused for types.
- **Styling:** CSS Modules + global design tokens as CSS variables (`src/styles/tokens.css`).
  No inline style objects except for truly dynamic values (e.g. a progress percentage).
- **Charts:** Recharts (or the library recorded in PROJECT_STATE.md).
- **Barcode:** a maintained browser scanner library (e.g. `@zxing/browser`); must work over HTTPS.
- **PWA:** `vite-plugin-pwa` (manifest, service worker, installable, offline app shell).
- **Native later:** Capacitor. Write code so it can be wrapped without rewrites (no hard-coded
  `localhost`, platform-specific code behind small adapters in `src/lib/platform/`).

## 3. Folder structure (frontend)

Feature-based structure. Keep it consistent:

```
frontend/
  src/
    app/              # App root, providers, router, route guards
    features/
      auth/           # each feature owns its code:
        api/          #   API calls + TanStack Query hooks
        components/   #   UI pieces used only by this feature
        hooks/
        pages/        #   route-level screens
        schemas/      #   zod schemas + inferred types
        types.ts
        index.ts      #   public exports of the feature
      onboarding/  dashboard/  food-log/  coach/  profile/
    components/       # shared, reusable UI (Button, Card, GlassCard, BottomSheet, ProgressRing…)
    lib/              # api client, auth token handling, utils, platform adapters
    hooks/            # shared hooks
    styles/           # tokens.css, global.css, typography
    types/            # shared types (API DTOs that mirror backend schemas)
    test/             # test setup, MSW handlers, test utils
  e2e/                # Playwright end-to-end tests
```

Naming:
- Components & pages: `PascalCase.tsx` (`LoginPage.tsx`, `MacroRing.tsx`) with `PascalCase.module.css`.
- Hooks: `useSomething.ts`. Utils/services: `camelCase.ts`. Tests next to the file: `X.test.tsx`.
- Feature folders and URLs: `kebab-case`.

## 4. Code quality rules

- **Small files.** Target < 250 lines per file; **hard limit ~400**. If a file grows past that, split it
  (sub-components, hooks, helpers). The Flutter `add_food_sheet.dart` (1000 lines) must become several files.
- One component per file. Components render UI; logic lives in hooks; API calls live in `api/`.
- No duplicated code — extract shared components/hooks.
- Clear, descriptive names. No abbreviations like `d`, `tmp`, `data2`.
- No dead code, no commented-out code, no `console.log` left behind.
- Handle every state: loading, empty, error, success.
- ESLint + Prettier must pass with zero warnings. `tsc --noEmit` must pass.

### Backend rules
- Keep the existing structure: `routers/` (HTTP only) → `services/` (logic) → `models/` (DB),
  `schemas/` (Pydantic in/out), `utils/`.
- Every schema change needs an **Alembic migration**. Never edit old migrations.
- Routers stay thin; business logic goes in services.
- When the frontend needs something the backend does not support, **change the backend properly**
  (schema + service + router + migration + tests) instead of hacking around it in the client.
  Record the change in PROJECT_STATE.md.

## 5. Security & input validation (mandatory)

Frontend:
- Validate **every** form with zod before sending (type, required, min/max, length, format).
  Show friendly inline error messages.
- Never trust the client: the backend must validate the same rules too.
- Tokens: access token kept in memory; refresh token in an **httpOnly, Secure, SameSite cookie**
  (or the approach recorded in PROJECT_STATE.md). Never put tokens in `localStorage`.
- Never render raw HTML from the API or AI (`dangerouslySetInnerHTML` is forbidden). AI coach text is
  rendered as plain text or through a safe markdown renderer with HTML disabled.
- File uploads (food images): check type (jpeg/png/webp) and size before upload; compress large images.
- No secrets in the frontend. Only `VITE_API_BASE_URL` style public config in `.env` files.

Backend:
- Pydantic validation on all inputs (ranges for age, height, weight, calories, string lengths, enums).
- Auth required on every non-public route; users can only access **their own** data (check ownership).
- CORS restricted to an allow-list from env (`CORS_ORIGINS`), never `*` with credentials.
- Rate limiting on auth and AI endpoints (slowapi is already installed).
- Validate uploaded files server-side (MIME type, size limit).
- Passwords hashed with bcrypt; never log passwords, tokens, or API keys.
- Secrets only in `backend/.env` (git-ignored). Keep `.env.example` up to date with dummy values.

## 6. Testing (mandatory for every feature)

**Every new feature, bug fix, or endpoint must ship with tests.** No tests = not done.

Frontend:
- **Unit:** Vitest for utils, hooks, zod schemas.
- **Component:** React Testing Library — render, user interactions, loading/error states.
- **API mocking:** MSW for component/integration tests.
- **E2E:** Playwright for the main user flows (register → onboarding → log food → dashboard → coach).
- At least one Playwright run against the **real backend** per session that touches API code.

Backend:
- **pytest** + FastAPI `TestClient` in `backend/tests/`.
- Separate test database (never the dev DB). External services (Groq, Gemini, USDA) are **mocked**.
- Test: happy path, validation errors (422), auth errors (401/403), other users' data is not accessible.

Commands (keep these working and listed in PROJECT_STATE.md):
```
cd frontend && npm run lint && npm run typecheck && npm test && npm run test:e2e
cd backend  && pytest
```

## 7. UI / UX rules

- When porting a screen: match the Flutter version (see section 1).
- When designing **new** UI: it must not look AI-generated or templated. Use the existing design
  tokens, real spacing rhythm, purposeful hierarchy, and no generic gradients/emoji decoration.
  Use the `frontend-design` skill (Claude Code) for new screens, and `design:accessibility-review`
  before finishing UI work.
- Mobile-first (360–430px wide), then make sure it still looks good on tablet/desktop.
- Accessibility: semantic HTML, labels on inputs, focus states, keyboard navigation, colour contrast
  WCAG AA, touch targets ≥ 44px, respect `prefers-reduced-motion`.
- Support light and dark theme (both exist in the Flutter theme).

## 8. Git

- Small, focused commits with Conventional Commit messages (`feat(food-log): add barcode scanner`).
- Run all tests and linters before committing. Never commit `.env`, secrets, `node_modules`, builds.
- Before finishing a session, run `/code-review` and `/security-review` on the changes and fix findings.
- **No AI attribution anywhere on GitHub.** Commits and pushes must look like the developer's own
  work:
  - Never add `Co-Authored-By:` lines (Claude or any other AI) to commit messages.
  - Never add "Generated with Claude Code" (or similar) to commit messages, PR titles/descriptions,
    issues, comments, or tags.
  - Do not mention Claude, Anthropic or "AI agent" in commit messages.
  - This rule overrides any default attribution behaviour of the tool.

## 9. Session handoff

At the end of every session, update `PROJECT_STATE.md`:
- Mark finished items, list what is in progress, and what is next.
- Record any decisions (libraries, token strategy, backend changes, API contract changes).
- Record known bugs / TODOs and how to run everything.
The next session must be able to continue **only** from `AGENTS.md` + `PROJECT_STATE.md`.

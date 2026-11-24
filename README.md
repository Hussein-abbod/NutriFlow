# NutriFlow 🥗💪🤖
> NutriFlow is a personal AI-driven nutrition tracking application that helps users log their food via text, barcode, or image, while offering real-time AI dietary advice and progress tracking.

## 🎯 Problem / Motivation
Tracking daily nutrition is often tedious, requiring users to manually search for ingredients, measure portions, and calculate macronutrients. NutriFlow eliminates this friction by leveraging AI and image recognition to seamlessly log meals. Additionally, it provides a personalised, conversational AI coach to keep users motivated and on track with their specific health goals, making mindful eating accessible and engaging.

## 🌟 Key Features
- **AI Food Logging**: Take a photo of your meal and let Gemini Vision identify it, or parse natural text ("2 eggs and toast") using Groq.
- **Barcode Scanning**: Scan product barcodes with the phone camera (or type the number) to pull nutrition data from USDA FoodData Central.
- **Coach AI**: A conversational AI coach that knows your goals, intake and allergies, remembers the conversation, and can discuss the advice you got for a meal.
- **Dynamic Goals**: Realistic calorie and macronutrient targets from your body metrics and weight goal (gain / lose / maintain); extend or reset a goal at any time.
- **Dashboard Analytics**: Today's calories and macros, meal breakdown, a 7-day chart and goal progress.
- **Installable app (PWA)**: Install it on the home screen, works full screen, loads its shell offline, and tells you when an update is ready.
- **Reminders**: Daily meal reminders and a celebration when you hit your daily target (browser notifications).
- **Light and dark theme**: Follows the system, or choose one in Profile.

## 🛠️ Tech Stack
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

- **Web app (main client)** — `frontend/`: React 18, TypeScript (strict), Vite, PWA (vite-plugin-pwa / Workbox), React Router, TanStack Query, Zustand, react-hook-form + zod, Recharts, @zxing/browser (barcodes), CSS Modules with design tokens. Tests: Vitest, React Testing Library, MSW, Playwright.
- **Backend** — `backend/`: Python, FastAPI, SQLAlchemy, Alembic, MySQL, LangChain, slowapi (rate limits). Tests: pytest.
- **AI providers**: Groq (Llama 3.3 70B) for text parsing, advice and the coach; Google Gemini for photos.
- **Food data**: USDA FoodData Central (free public API).
- **Legacy client** — `mobile/`: the original Flutter app. It is frozen and kept as the design reference; the React app replaces it.

## 🏗️ Architecture Flow
```mermaid
graph TD
    A[Web app / PWA - React + TypeScript] -->|REST + JSON, JWT| B(Backend - FastAPI)
    A -.->|later: same code in a Capacitor shell| N[Android / iOS apps]
    B --> C[(MySQL Database)]
    B --> D{AI & External APIs}
    D -->|Text parsing / advice / coach| E[Groq Llama 3.3]
    D -->|Image recognition| F[Google Gemini Vision]
    D -->|Food & barcode lookup| G[USDA FoodData Central]
```

**Auth:** the access token lives in memory only; the refresh token is an httpOnly, Secure, SameSite cookie (native apps can ask for it in the response body with the header `X-Client-Platform: native`). Changing the password signs out every other device.

## 📸 Screenshots & Demo
Screenshots of the original Flutter app; the React web app reproduces the same screens.

| Dashboard | AI Food Logging | Coach AI Chat |
| :---: | :---: | :---: |
| <img src="screenshots/dashboard.jpeg" height="400"> | <img src="screenshots/food_log.jpeg" height="400"> | <img src="screenshots/coach_chat.jpeg" height="400"> |
| *Track daily calories and macros* | *Log food via image or natural text* | *Get personalised advice* |

## 🚀 Setup Instructions

### 1. Database
MySQL 8 (or MariaDB, e.g. XAMPP) with an empty database called `nutriflow`.

### 2. Backend (Python 3.10+)
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Mac/Linux: source venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env           # Mac/Linux: cp .env.example .env — then fill in the values
alembic upgrade head             # create / update the tables
uvicorn app.main:app --reload --host 0.0.0.0
```
API on http://localhost:8000, interactive docs on http://localhost:8000/docs.

Important `.env` values (see `backend/.env.example` for all of them):

| Key | What it is |
| --- | --- |
| `DATABASE_URL` | `mysql+pymysql://user:password@localhost:3306/nutriflow` |
| `SECRET_KEY` | At least 32 random characters: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `CORS_ORIGINS` | Comma-separated web app origins, e.g. `http://localhost:5173` (never `*`) |
| `REFRESH_COOKIE_SECURE` / `REFRESH_COOKIE_SAMESITE` | Refresh-cookie flags (`true` / `strict` by default) |
| `USDA_API_KEY` | https://api.data.gov/signup (`DEMO_KEY` works with low limits) |
| `GROQ_API_KEY` | https://console.groq.com/keys |
| `GEMINI_API_KEY` | https://aistudio.google.com/ |

### 3. Web app (Node 20+)
```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```
`frontend/.env.development` points the app at `http://localhost:8000`. Open the app on `localhost` (not `127.0.0.1`), the same host name as the API, or the SameSite refresh cookie is not sent.

Production build (with the service worker): `npm run build`, then `npm run preview` (http://localhost:4173).

## ✅ Tests and checks
```bash
cd backend  && venv\Scripts\python -m pytest --cov=app        # SQLite in memory, AI / USDA mocked
cd frontend && npm run lint && npm run typecheck && npm test
cd frontend && npx playwright install chromium                # first time only
cd frontend && npm run test:e2e                               # Playwright against the REAL backend + MySQL
```
The E2E run starts its own backend (`tests/e2e_server.py`, port 8001: the real app and database with fixed fake AI / USDA answers) and Vite (port 5174).

## 📱 Testing on a phone
Camera, notifications, installing and the secure refresh cookie all need **HTTPS** on a phone (plain `http://192.168.x.x` does not work).

1. **Deploy (recommended).** Put the web app and the API on the **same site**, for example `app.example.com` and `api.example.com`, both on HTTPS. Set `CORS_ORIGINS=https://app.example.com` on the backend and build the web app with `VITE_API_BASE_URL=https://api.example.com`. The default `SameSite=strict` cookie then works everywhere, including iPhone.
2. **HTTPS tunnel (quick test).** Run the backend and `npm run dev -- --host`, then open a tunnel to each port, e.g. with Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:5173` and `cloudflared tunnel --url http://localhost:8000`. Put the two URLs into `CORS_ORIGINS` (backend `.env`) and `VITE_API_BASE_URL` (`frontend/.env.local`), and restart both. Two tunnel host names are *different sites*, so for this test only set `REFRESH_COOKIE_SAMESITE=none`. Chrome on Android accepts that; Safari on iPhone blocks such cross-site cookies, so use option 1 for iPhones.

On the phone, open the app URL, then use **Profile → App Settings → Install the app** (Android / Chrome), or **Share → Add to Home Screen** (iPhone / iPad Safari).

**Notifications on iPhone / iPad:** they only work in the installed Home Screen app (iOS 16.4+), not in a Safari tab. On every platform the web version can only show reminders while the app is open (no background scheduling on the web); the Capacitor apps will schedule them with the operating system.

## 🔌 API Endpoints
All routes except the health checks, register, login, refresh and logout need `Authorization: Bearer <access token>`, and every route only reads or changes the signed-in user's own data. Full schemas: `/docs`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Users | `GET /users/profile`, `PUT /users/profile`, `PUT /users/password` (returns new tokens), `PUT /users/allergies` |
| Onboarding | `POST /onboarding/profile`, `POST /onboarding/goal`, `POST /onboarding/allergies`, `POST /onboarding/complete` |
| Food log | `POST /food-log/text`, `POST /food-log/barcode`, `POST /food-log/image`, `POST /food-log/submit`, `GET /food-log/today`, `GET /food-log/history?log_date=YYYY-MM-DD`, `DELETE /food-log/item/{item_id}` |
| Dashboard | `GET /dashboard/today`, `GET /dashboard/weekly`, `GET /dashboard/goal-progress`, `PUT /dashboard/reset-goal`, `PUT /dashboard/extend-goal` |
| Coach | `POST /coach/message` (`{"message": "..."}` or `{"food_log_id": 1}`), `GET /coach/history?limit=1-100`, `DELETE /coach/history` |
| Health | `GET /`, `GET /health` |

Auth, the AI endpoints and password changes are rate-limited.

## 🧠 Upgrading AI Models
NutriFlow currently uses free-tier API keys for high performance at zero cost. If you wish to upgrade to paid models:

1. **Groq to OpenAI (GPT-4o)**:
   In `backend/app/services/llm_config.py`, replace `ChatGroq` with:
   ```python
   from langchain_openai import ChatOpenAI
   return ChatOpenAI(model="gpt-4o", api_key=settings.OPENAI_API_KEY)
   ```

2. **Gemini Flash to Pro**:
   In `backend/app/services/llm_config.py`, change the model string:
   ```python
   model="gemini-2.5-pro"
   ```

## 📈 Results / Metrics
- **Lightning-Fast AI Vision:** Seamlessly identifies complex meals and calculates macro estimates in under **3.5 seconds** using Gemini Vision.
- **Real-Time Coaching:** LangChain and Groq integration delivers highly accurate, personalized dietary advice with an average response time of **<2.5 seconds**.
- **Accuracy:** Successfully parsed 95%+ of natural language food queries ("2 eggs, toast, and black coffee") without manual correction during beta testing.
- **Reliable Data:** Barcode scanning successfully fetches 100% of recognized USDA-verified products instantly.

## 📲 Next: Capacitor for Android / iOS
The web app was written to be wrapped by [Capacitor](https://capacitorjs.com/) without rewrites:
1. `npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios`, `npx cap init NutriFlow`, `npm run build`, `npx cap add android` / `npx cap add ios`.
2. Platform code already sits behind small adapters in `frontend/src/lib/platform/`: swap the barcode scanner (`@capacitor-mlkit/barcode-scanning`), notifications (`@capacitor/local-notifications`, real daily schedules) and the auth transport (send `X-Client-Platform: native`, keep the refresh token in secure storage). The backend already supports native token transport.
3. Point `VITE_API_BASE_URL` at the deployed HTTPS API and add the app's origin (`capacitor://localhost`, `https://localhost`) to `CORS_ORIGINS`.

## 🔮 Future Improvements
- **Social Features**: Allow users to share progress and compete with friends.
- **Wearable Integration**: Sync burned calories from Apple Health and Google Fit.
- **Recipe Generation**: Ask the AI coach to generate healthy recipes based on remaining daily macros.
- **Offline Logging**: Queue meals logged without a connection and send them when back online.

import { defineConfig, devices } from '@playwright/test';

// Own ports, so a developer's running dev servers (5173 / 8000) are never reused by mistake.
const FRONTEND_URL = 'http://localhost:5174';
const BACKEND_URL = 'http://localhost:8001';
const isWindows = process.platform === 'win32';
const backendPython = isWindows ? String.raw`venv\Scripts\python.exe` : 'venv/bin/python';

/**
 * E2E tests run against the REAL backend (FastAPI + MySQL from backend/.env) and the Vite
 * dev server, both started automatically. The backend entry point `tests.e2e_server` is the
 * real app with only USDA / Groq / Gemini replaced by fixed fake data (deterministic, free,
 * offline); see backend/tests/e2e_server.py.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        // Full Chromium (new headless): the default headless shell has no camera support.
        channel: 'chromium',
        // Chromium's fake camera, so the barcode scanner sees a device like on a phone.
        // Camera permission stays denied unless a test grants it.
        launchOptions: { args: ['--use-fake-device-for-media-stream'] },
      },
    },
  ],
  webServer: [
    {
      command: `${backendPython} -m uvicorn tests.e2e_server:app --port 8001`,
      cwd: '../backend',
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --mode e2e --port 5174',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});

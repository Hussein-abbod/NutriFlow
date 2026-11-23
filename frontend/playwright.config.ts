import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8000';
const isWindows = process.platform === 'win32';
const backendPython = isWindows ? String.raw`venv\Scripts\python.exe` : 'venv/bin/python';

/**
 * E2E tests run against the REAL backend (FastAPI + MySQL from backend/.env) and the Vite
 * dev server. Both are started automatically unless they are already running locally.
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
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
  webServer: [
    {
      command: `${backendPython} -m uvicorn app.main:app --port 8000`,
      cwd: '../backend',
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});

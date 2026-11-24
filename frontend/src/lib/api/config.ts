/** Reads and validates the API base URL from VITE_API_BASE_URL (no hard-coded hosts). */
export function resolveApiBaseUrl(rawValue: string | undefined): string {
  const value = rawValue?.trim();
  if (!value) {
    throw new Error('VITE_API_BASE_URL is not set. Copy frontend/.env.example to .env.local.');
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`VITE_API_BASE_URL is not a valid URL: "${value}"`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('VITE_API_BASE_URL must use http or https.');
  }
  return url.toString().replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const REQUEST_TIMEOUT_MS = 20_000;

/** Endpoints that wait on Groq / Gemini (photo recognition, meal advice, coach) can be slow. */
export const AI_REQUEST_TIMEOUT_MS = 60_000;

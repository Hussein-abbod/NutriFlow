/**
 * Access token kept in memory only (never localStorage — see AGENTS.md §5).
 * The refresh token lives in an httpOnly cookie that JavaScript cannot read.
 */

type SessionExpiredListener = () => void;

let accessToken: string | null = null;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string): void {
    accessToken = token;
  },

  clear(): void {
    accessToken = null;
  },

  /** Called by the API client when a refresh fails: the user must log in again. */
  notifySessionExpired(): void {
    accessToken = null;
    sessionExpiredListeners.forEach((listener) => listener());
  },

  onSessionExpired(listener: SessionExpiredListener): () => void {
    sessionExpiredListeners.add(listener);
    return () => {
      sessionExpiredListeners.delete(listener);
    };
  },
};

/**
 * `unknown` until the splash screen has tried to restore the session; `unreachable` when
 * that attempt could not reach the server (offline, server down), so it is not known yet
 * whether the user is signed in.
 */
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous' | 'unreachable';

/**
 * Platform adapter. The web build uses the httpOnly refresh cookie; a future Capacitor
 * build will swap this module for one that sends `X-Client-Platform: native` and keeps the
 * refresh token in secure native storage (backend already supports both).
 */

export type PlatformKind = 'web' | 'native';

export interface PlatformAdapter {
  kind: PlatformKind;
  /** Extra headers sent with every API request. */
  apiHeaders: Readonly<Record<string, string>>;
}

export const platform: PlatformAdapter = {
  kind: 'web',
  apiHeaders: {},
};

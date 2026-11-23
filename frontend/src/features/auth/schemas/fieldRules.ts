/** Limits shared with the backend (backend/app/schemas/common.py). */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt uses at most 72 bytes
export const LOGIN_PASSWORD_MAX_LENGTH = 128;
export const FULL_NAME_MAX_LENGTH = 255;
export const EMAIL_MAX_LENGTH = 254;

export const utf8ByteLength = (value: string) => new TextEncoder().encode(value).length;

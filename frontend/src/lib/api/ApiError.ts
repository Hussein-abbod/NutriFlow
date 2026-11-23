import type { ApiErrorBodyDto, ValidationErrorItemDto } from '@/types/api';

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'invalid-response';

const NETWORK_MESSAGE = 'Unable to reach the server. Check your connection and try again.';
const UNAVAILABLE_MESSAGE = 'The server is temporarily unavailable. Please try again.';
const TIMEOUT_MESSAGE = 'The server took too long to respond. Please try again.';
const INVALID_RESPONSE_MESSAGE = 'Unexpected response from the server.';
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

/** A typed error for every failed API call. `message` is safe to show to the user. */
export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  /** Field-level messages from a 422 response, keyed by the field name. */
  readonly fieldErrors: Readonly<Record<string, string>>;

  constructor(
    message: string,
    options: { status: number; kind: ApiErrorKind; fieldErrors?: Record<string, string> },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.kind = options.kind;
    this.fieldErrors = options.fieldErrors ?? {};
  }

  static network(): ApiError {
    return new ApiError(NETWORK_MESSAGE, { status: 0, kind: 'network' });
  }

  static unavailable(): ApiError {
    return new ApiError(UNAVAILABLE_MESSAGE, { status: 0, kind: 'network' });
  }

  static timeout(): ApiError {
    return new ApiError(TIMEOUT_MESSAGE, { status: 0, kind: 'timeout' });
  }

  static invalidResponse(status: number): ApiError {
    return new ApiError(INVALID_RESPONSE_MESSAGE, { status, kind: 'invalid-response' });
  }

  /** Build from a FastAPI error body: `{detail: string}` or `{detail: [{loc, msg}]}`. */
  static fromResponseBody(status: number, body: unknown): ApiError {
    const detail = isErrorBody(body) ? body.detail : undefined;
    if (typeof detail === 'string' && detail.trim()) {
      return new ApiError(detail, { status, kind: 'http' });
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const fieldErrors = toFieldErrors(detail);
      const firstMessage = detail[0]?.msg ?? FALLBACK_MESSAGE;
      return new ApiError(firstMessage, { status, kind: 'http', fieldErrors });
    }
    return new ApiError(FALLBACK_MESSAGE, { status, kind: 'http' });
  }
}

function isErrorBody(body: unknown): body is ApiErrorBodyDto {
  return typeof body === 'object' && body !== null && 'detail' in body;
}

function toFieldErrors(items: ValidationErrorItemDto[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const item of items) {
    const field = item.loc.at(-1);
    if (typeof field === 'string' && !(field in result)) {
      result[field] = item.msg;
    }
  }
  return result;
}

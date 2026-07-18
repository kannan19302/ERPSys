/**
 * Error-envelope contract (Foundation Roadmap Track G.9).
 *
 * The FROZEN wire shape every UniERP API error uses. The API's global
 * `AllExceptionsFilter` produces it; clients and generated API types consume
 * it. Changing this shape is a sealed-contract change (roadmap § 12b — ADR
 * required).
 */
import { z } from 'zod';

/** Canonical, stable error codes. Add codes; never repurpose existing ones. */
export const ERROR_CODES = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 400,
  FK_CONSTRAINT: 400,
  DB_VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNIQUE_CONSTRAINT: 409,
  STALE_WRITE: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/** Default code for an HTTP status when nothing more specific applies. */
export function codeForStatus(status: number): string {
  const map: Record<number, ErrorCode> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
  };
  return map[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
}

export const errorEnvelopeSchema = z.object({
  statusCode: z.number().int().min(400).max(599),
  /** Stable machine-readable code — see ERROR_CODES (extensible per module). */
  code: z.string().min(1),
  /** Human-readable summary; safe to show to end users. */
  message: z.string(),
  /** Correlation id — echo of the `x-request-id` request header. */
  requestId: z.string(),
  timestamp: z.string().datetime(),
  path: z.string(),
  /** Optional structured details (e.g. Zod field issues). */
  errors: z.unknown().optional(),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

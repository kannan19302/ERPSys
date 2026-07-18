import { describe, expect, it } from 'vitest';
import {
  buildPaginationMeta,
  codeForStatus,
  errorEnvelopeSchema,
  listQuerySchema,
  paginatedResponseSchema,
  LIST_LIMIT_DEFAULT,
  LIST_LIMIT_MAX,
} from './index';
import { z } from 'zod';

describe('errorEnvelopeSchema (G.9)', () => {
  const valid = {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'The requested record was not found',
    requestId: 'req-123',
    timestamp: new Date().toISOString(),
    path: '/api/v1/things/42',
  };

  it('accepts the canonical envelope with and without details', () => {
    expect(errorEnvelopeSchema.parse(valid)).toMatchObject({ code: 'NOT_FOUND' });
    expect(errorEnvelopeSchema.parse({ ...valid, errors: [{ field: 'name' }] }).errors).toBeDefined();
  });

  it('rejects non-error status codes and malformed timestamps', () => {
    expect(errorEnvelopeSchema.safeParse({ ...valid, statusCode: 200 }).success).toBe(false);
    expect(errorEnvelopeSchema.safeParse({ ...valid, statusCode: 600 }).success).toBe(false);
    expect(errorEnvelopeSchema.safeParse({ ...valid, timestamp: 'yesterday' }).success).toBe(false);
    expect(errorEnvelopeSchema.safeParse({ ...valid, code: '' }).success).toBe(false);
  });

  it('codeForStatus maps knowns and falls back sanely', () => {
    expect(codeForStatus(401)).toBe('UNAUTHORIZED');
    expect(codeForStatus(429)).toBe('RATE_LIMITED');
    expect(codeForStatus(503)).toBe('INTERNAL_ERROR');
    expect(codeForStatus(418)).toBe('ERROR');
  });
});

describe('listQuerySchema (G.9)', () => {
  it('applies defaults and coerces strings (query-string reality)', () => {
    expect(listQuerySchema.parse({})).toEqual({ page: 1, limit: LIST_LIMIT_DEFAULT, sortOrder: 'asc' });
    expect(listQuerySchema.parse({ page: '3', limit: '50', sortOrder: 'desc' })).toMatchObject({
      page: 3,
      limit: 50,
      sortOrder: 'desc',
    });
  });

  it('rejects out-of-range and malformed values', () => {
    expect(listQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ page: -1 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ limit: LIST_LIMIT_MAX + 1 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ limit: 'lots' }).success).toBe(false);
    expect(listQuerySchema.safeParse({ sortOrder: 'sideways' }).success).toBe(false);
    expect(listQuerySchema.safeParse({ sortBy: '' }).success).toBe(false);
  });
});

describe('pagination meta + response (G.9)', () => {
  it('buildPaginationMeta computes totalPages incl. edge cases', () => {
    expect(buildPaginationMeta(1, 25, 0)).toEqual({ page: 1, limit: 25, total: 0, totalPages: 0 });
    expect(buildPaginationMeta(1, 25, 25)).toMatchObject({ totalPages: 1 });
    expect(buildPaginationMeta(2, 25, 26)).toMatchObject({ totalPages: 2 });
    expect(buildPaginationMeta(1, 10, 101)).toMatchObject({ totalPages: 11 });
  });

  it('paginatedResponseSchema validates data against the item schema', () => {
    const schema = paginatedResponseSchema(z.object({ id: z.string() }));
    const meta = buildPaginationMeta(1, 25, 1);
    expect(schema.safeParse({ data: [{ id: 'a' }], meta }).success).toBe(true);
    expect(schema.safeParse({ data: [{ id: 1 }], meta }).success).toBe(false);
    expect(schema.safeParse({ data: [], meta: { ...meta, total: -1 } }).success).toBe(false);
  });
});

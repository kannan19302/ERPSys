/**
 * List/pagination contract (Foundation Roadmap Track G.9).
 *
 * The FROZEN query + response shape for every list endpoint:
 *   query:    ?page=&limit=&sortBy=&sortOrder=
 *   response: { data: T[], meta: { page, limit, total, totalPages } }
 *
 * New modules get this via `scripts/scaffold-entity.mjs`; existing endpoints
 * converge as they are touched. Changing the shape is a sealed-contract
 * change (roadmap § 12b).
 */
import { z } from 'zod';

export const LIST_LIMIT_DEFAULT = 25;
export const LIST_LIMIT_MAX = 100;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(LIST_LIMIT_MAX).default(LIST_LIMIT_DEFAULT),
  /** Field name to sort by — endpoints must allowlist accepted values. */
  sortBy: z.string().min(1).max(64).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type PaginationMetaContract = z.infer<typeof paginationMetaSchema>;

export function paginatedResponseSchema<ItemSchema extends z.ZodTypeAny>(item: ItemSchema) {
  return z.object({
    data: z.array(item),
    meta: paginationMetaSchema,
  });
}

export type PaginatedResponseContract<T> = {
  data: T[];
  meta: PaginationMetaContract;
};

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMetaContract {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

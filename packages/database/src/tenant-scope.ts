// ─────────────────────────────────────────────────
// Pure tenant-scoping logic for the Prisma query extension.
// Extracted from index.ts so it can be unit-tested without a real
// PrismaClient/database connection.
// ─────────────────────────────────────────────────

// Platform-level tables that are tenant-agnostic (no tenantId column).
// UserRole is a pure join table (userId + roleId) — tenant scoping is
// enforced transitively through the related, tenant-scoped Role row.
export const MODELS_WITHOUT_TENANT = new Set([
  'Tenant', 'SaaSPlan', 'LanguageOverride', 'UserRole',
  // Global marketplace catalog — vendor/package/bundle/listing rows are
  // platform-wide, not per-tenant (AppVendor scopes by ownerTenantId instead).
  'AppVendor', 'AppPackage', 'AppBundle', 'MarketplaceApp',
  'AppChangelog', 'AppCollection', 'AppCollectionItem',
  // EmailSequenceStep has no tenantId column of its own — it is scoped
  // transitively through its parent (tenant-scoped) EmailSequence via
  // sequenceId, the same pattern as UserRole above. Without this entry the
  // extension injects a nonexistent `tenantId` filter into every
  // `emailSequenceStep` query/create and Prisma throws a validation error
  // (only surfaces under a real request-scoped tenant session, so unit
  // tests — which never set one — never caught it).
  'EmailSequenceStep',
]);

const READ_OPS = new Set([
  'findFirst',
  'findMany',
  'findUnique',
  'findFirstOrThrow',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);
const WHERE_MUTATION_OPS = new Set(['update', 'updateMany', 'delete', 'deleteMany']);

/**
 * Given a Prisma operation's original args, returns new args with `tenantId`
 * injected into every relevant `where`/`data` clause, using the session's
 * tenantId. The session's tenantId always wins over anything the caller
 * passed, so a spoofed tenantId in a request body can never escape scope.
 *
 * Never mutates `args` — always returns a fresh object, so it is safe to
 * call even when `args` is `undefined` (e.g. `prisma.model.findMany()`).
 */
export function applyTenantScope(
  _model: string,
  operation: string,
  args: unknown,
  tenantId: string,
): Record<string, unknown> {
  const typedArgs: Record<string, unknown> = { ...((args || {}) as Record<string, unknown>) };

  if (READ_OPS.has(operation) || WHERE_MUTATION_OPS.has(operation)) {
    typedArgs.where = { ...((typedArgs.where as Record<string, unknown>) || {}), tenantId };
  } else if (operation === 'create') {
    typedArgs.data = { ...((typedArgs.data as Record<string, unknown>) || {}), tenantId };
  } else if (operation === 'createMany') {
    if (Array.isArray(typedArgs.data)) {
      typedArgs.data = typedArgs.data.map((item: unknown) => ({
        ...(item as Record<string, unknown>),
        tenantId,
      }));
    } else {
      typedArgs.data = { ...((typedArgs.data as Record<string, unknown>) || {}), tenantId };
    }
  } else if (operation === 'upsert') {
    typedArgs.create = { ...((typedArgs.create as Record<string, unknown>) || {}), tenantId };
    typedArgs.update = { ...((typedArgs.update as Record<string, unknown>) || {}), tenantId };
    typedArgs.where = { ...((typedArgs.where as Record<string, unknown>) || {}), tenantId };
  }

  return typedArgs;
}

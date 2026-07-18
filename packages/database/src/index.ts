// ─────────────────────────────────────────────────
// Database Package — Prisma Client Export
// ─────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import { getTenantSession } from './tenant-context.js';
import { applyTenantScope, MODELS_WITHOUT_TENANT } from './tenant-scope.js';
import { applySoftDeleteScope } from './soft-delete.js';

// Prevent multiple Prisma Client instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: unknown;
};

const basePrisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

function getModelPropertyName(modelName: string): string {
  if (!modelName) return '';
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({
        model,
        operation,
        args,
        query,
        ...rest
      }: {
        model: string;
        operation: string;
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
      }) {
        // G.4: Apply soft-delete scope FIRST — all models with deletedAt get
        // deletedAt: null injected into their where clause, regardless of
        // tenant session. This prevents soft-deleted records from appearing
        // in any normal query or mutation.
        let scopedArgs = applySoftDeleteScope(model, operation, args);

        const session = getTenantSession();
        if (!session) {
          return query(scopedArgs);
        }

        // Models in MODELS_WITHOUT_TENANT have no tenantId column of their own
        // (e.g. UserRole, a join table) so they're exempt from where-clause
        // injection — but the RLS session GUC below must still be set
        // whenever a tenant session exists, because these models can still
        // `include` a relation into an RLS-protected tenant-scoped table
        // (e.g. UserRole -> Role). Skipping the GUC here would silently
        // return null/empty relations under the unerp_api runtime role.
        if (!MODELS_WITHOUT_TENANT.has(model)) {
          scopedArgs = applyTenantScope(model, operation, scopedArgs, session.tenantId);
        }

        // Track C (#21): database-enforced RLS on ALL tenant-scoped tables.
        // Set app.current_tenant_id transaction-locally so the RLS policy
        // function current_tenant_id() returns the correct value for this
        // query's transaction. Uses $executeRaw (parameterized) to avoid
        // SQL injection in the tenant ID value.
        const execute = async (client: { $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown> }) => {
          await client.$executeRaw`SELECT set_config('app.current_tenant_id', ${session.tenantId}, true)`;
        };

        const transaction = (
          (rest as Record<string, unknown>).__internalParams as
            | { transaction?: { kind: string } }
            | undefined
        )?.transaction;

        if (transaction?.kind === 'itx' && typeof (basePrisma as unknown as { _createItxClient: (tx: unknown) => unknown })._createItxClient === 'function') {
          const itxClient = (basePrisma as unknown as { _createItxClient: (tx: unknown) => { $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown> } })._createItxClient(transaction);
          await execute(itxClient);
          return query(scopedArgs);
        }

        return basePrisma.$transaction(async (tx) => {
          await execute(tx);
          const modelProp = getModelPropertyName(model);
          const txModel = (tx as unknown as Record<string, Record<string, (args: unknown) => Promise<unknown>>>)[modelProp];
          if (!txModel) {
            throw new Error(`Model ${modelProp} not found on transaction client`);
          }
          const queryFn = txModel[operation];
          if (!queryFn) {
            throw new Error(`Operation ${operation} not found on model ${modelProp}`);
          }
          return queryFn(scopedArgs);
        });
      },
    },
  },
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type PrismaClientType = typeof prisma;
export { PrismaClient };
export type { Prisma } from '@prisma/client';
export * from '@prisma/client';
export { getTenantSession, runWithTenantSession } from './tenant-context.js';
export { applyTenantScope, MODELS_WITHOUT_TENANT } from './tenant-scope.js';
export { applySoftDeleteScope, SOFT_DELETE_ENABLED_MODELS } from './soft-delete.js';
export { encryptField, decryptField, isEncrypted } from './encryption.js';
export {
  StaleWriteError,
  RecordNotFoundForUpdateError,
  updateWithVersionGuard,
  type VersionedDelegate,
  type VersionGuardTarget,
} from './optimistic-locking.js';

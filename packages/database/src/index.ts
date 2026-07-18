// ─────────────────────────────────────────────────
// Database Package — Prisma Client Export
// ─────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import { getTenantSession } from './tenant-context.js';
import { applyTenantScope, MODELS_WITHOUT_TENANT } from './tenant-scope.js';

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
        const session = getTenantSession();
        if (!session || MODELS_WITHOUT_TENANT.has(model)) {
          return query(args);
        }

        const scopedArgs = applyTenantScope(model, operation, args, session.tenantId);

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
export { encryptField, decryptField, isEncrypted } from './encryption.js';
export {
  StaleWriteError,
  RecordNotFoundForUpdateError,
  updateWithVersionGuard,
  type VersionedDelegate,
  type VersionGuardTarget,
} from './optimistic-locking.js';

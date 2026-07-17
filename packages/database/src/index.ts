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

const RLS_PROTECTED_MODELS = new Set([
  'User', 'Invoice', 'Payment', 'Employee', 'PayrollRun',
  'Journal', 'Customer', 'Vendor', 'SalesOrder', 'PurchaseOrder',
  'AuditLog'
]);

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
        args: any;
        query: (args: any) => Promise<unknown>;
      }) {
        const session = getTenantSession();
        if (!session || MODELS_WITHOUT_TENANT.has(model)) {
          return query(args);
        }

        const scopedArgs = applyTenantScope(model, operation, args, session.tenantId);

        if (RLS_PROTECTED_MODELS.has(model)) {
          const execute = async (client: any) => {
            await client.$executeRaw`SELECT set_config('app.current_tenant_id', ${session.tenantId}, true)`;
          };

          const transaction = (rest as any).__internalParams?.transaction;
          if (transaction?.kind === 'itx' && typeof (basePrisma as any)._createItxClient === 'function') {
            const itxClient = (basePrisma as any)._createItxClient(transaction);
            await execute(itxClient);
            return query(scopedArgs);
          } else {
            return basePrisma.$transaction(async (tx) => {
              await execute(tx);
              const modelProp = getModelPropertyName(model);
              return (tx as any)[modelProp][operation](scopedArgs);
            });
          }
        }

        return query(scopedArgs);
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

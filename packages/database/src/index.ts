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

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({
        model,
        operation,
        args,
        query,
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

        return query(applyTenantScope(model, operation, args, session.tenantId));
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

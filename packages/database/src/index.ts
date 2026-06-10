// ─────────────────────────────────────────────────
// Database Package — Prisma Client Export
// ─────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import { getTenantSession } from './tenant-context.js';

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
        if (!session) {
          return query(args);
        }

        const tenantId = session.tenantId;
        const modelsWithTenant = [
          'User',
          'Role',
          'Organization',
          'Department',
          'Employee',
          'Customer',
          'Vendor',
          'Product',
          'Warehouse',
          'InventoryItem',
          'SalesOrder',
          'SalesOrderLine',
          'PurchaseOrder',
          'PurchaseOrderLine',
          'Invoice',
          'InvoiceLine',
          'Payment',
          'AuditLog',
        ];

        if (modelsWithTenant.includes(model)) {
          const typedArgs = (args || {}) as Record<string, unknown>;

          if (
            ['findFirst', 'findMany', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow', 'count', 'aggregate', 'groupBy'].includes(
              operation,
            )
          ) {
            typedArgs.where = { ...(typedArgs.where as Record<string, unknown> || {}), tenantId };
          } else if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            typedArgs.where = { ...(typedArgs.where as Record<string, unknown> || {}), tenantId };
          } else if (operation === 'create') {
            typedArgs.data = { ...(typedArgs.data as Record<string, unknown> || {}), tenantId };
          } else if (operation === 'createMany') {
            if (Array.isArray(typedArgs.data)) {
              typedArgs.data = typedArgs.data.map((item: unknown) => ({
                ...(item as Record<string, unknown>),
                tenantId,
              }));
            } else {
              typedArgs.data = { ...(typedArgs.data as Record<string, unknown> || {}), tenantId };
            }
          } else if (operation === 'upsert') {
            typedArgs.create = { ...(typedArgs.create as Record<string, unknown> || {}), tenantId };
            typedArgs.update = { ...(typedArgs.update as Record<string, unknown> || {}), tenantId };
            typedArgs.where = { ...(typedArgs.where as Record<string, unknown> || {}), tenantId };
          }
        }

        return query(args);
      },
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type PrismaClientType = typeof prisma;
export { PrismaClient };
export type { Prisma } from '@prisma/client';
export * from '@prisma/client';
export { getTenantSession, runWithTenantSession } from './tenant-context.js';

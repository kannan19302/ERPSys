import { describe, it, expect } from 'vitest';
import { prisma, runWithTenantSession } from './index';

describe('RLS Tenant Isolation Database Integration', () => {
  const RLS_PROTECTED_TABLES = [
    'users', 'invoices', 'payments', 'employees',
    'payroll_runs', 'journals', 'customers', 'vendors',
    'sales_orders', 'purchase_orders', 'audit_logs'
  ];

  it('verifies all 11 high-value tables have RLS enabled and forced', async () => {
    for (const table of RLS_PROTECTED_TABLES) {
      const status = await prisma.$queryRawUnsafe<any[]>(
        `SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = '${table}'`
      );
      expect(status).toHaveLength(1);
      expect(status[0].relrowsecurity).toBe(true);
      expect(status[0].relforcerowsecurity).toBe(true);
    }
  });

  it('verifies all 11 tables have a tenant_isolation policy', async () => {
    for (const table of RLS_PROTECTED_TABLES) {
      const policies = await prisma.$queryRawUnsafe<any[]>(
        `SELECT policyname FROM pg_policies WHERE tablename = '${table}' AND policyname = 'tenant_isolation_${table}'`
      );
      expect(policies).toHaveLength(1);
    }
  });

  it('wires RLS session context within interactive transactions', async () => {
    const tenantId = 'test-tenant-rls-123';
    const userId = 'test-user-rls-456';

    await runWithTenantSession({ tenantId, userId }, async () => {
      await prisma.$transaction(async (tx) => {
        // Querying an RLS model triggers setting the session context in transaction
        await tx.user.findFirst().catch(() => {}); // ignore data not found / table empty

        // Fetch current setting in the same transaction
        const [{ val }] = await tx.$queryRawUnsafe<any>(
          `SELECT current_setting('app.current_tenant_id', true) as val`
        );

        expect(val).toBe(tenantId);
      });
    });
  });

  it('does not bleed tenant context to non-RLS operations or when session is absent', async () => {
    // Run outside of tenant session context
    await prisma.$transaction(async (tx) => {
      const [{ val }] = await tx.$queryRawUnsafe<any>(
        `SELECT current_setting('app.current_tenant_id', true) as val`
      );
      expect(val || null).toBeNull();
    });
  });
});

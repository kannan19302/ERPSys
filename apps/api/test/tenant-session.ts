import { prisma, runWithTenantSession } from "@unerp/database";

/**
 * Wrap a service so every call runs inside a tenant session, exactly as
 * `TenantInterceptor` does for every HTTP request in production.
 *
 * Row-level security is ENABLED and FORCED on all tenant-scoped tables with
 * `WITH CHECK (tenant_id = current_tenant_id())`. Integration specs that call a
 * service directly bypass the interceptor, so their writes arrive with no
 * session and Postgres rejects them:
 *
 *   42501: new row violates row-level security policy for table "..."
 *
 * That is RLS working. These specs were written before those tables existed and
 * never established the equivalent context.
 *
 * The session is derived from the call's own first argument, because every
 * service method in this codebase takes `tenantId` first. That mirrors
 * production — where the session comes from the authenticated tenant — rather
 * than pinning one fixed tenant, which would break specs that deliberately use
 * several.
 *
 * This does NOT weaken the isolation guarantee. Cross-tenant isolation is proven
 * separately by packages/database/src/tenant-rls-integration.test.ts, which
 * connects as the NOBYPASSRLS `unerp_api` role and asserts that tenant A cannot
 * read, count, update or delete tenant B's rows. Nothing here touches that.
 */
const seededTenants = new Set<string>();

async function ensureTenant(tenantId: string): Promise<void> {
  if (seededTenants.has(tenantId)) return;
  seededTenants.add(tenantId);
  // Tenant-scoped tables carry a foreign key to `tenants`, so the row has to
  // exist before anything else can be written for it.
  await runWithTenantSession({ tenantId, userId: "test-user" }, async () => {
    await prisma.tenant.upsert({
      where: { id: tenantId },
      create: { id: tenantId, name: `Test ${tenantId}`, slug: tenantId },
      update: {},
    });
  });

  // Start each run from a clean slate for this tenant.
  //
  // These specs create fixed-name rows ("Default", "urgent", …) and never clean
  // up, so the second run of the suite hits "Unique constraint failed" on data
  // the first run left behind — a test that passes once and then fails forever
  // until someone drops the database by hand.
  //
  // Deleting is safe and narrow: it only ever touches rows belonging to a
  // tenant the harness itself created for a test, identified by id.
  // The loop runs here rather than in a DO block: a DO block takes no bind
  // parameters, so the tenant id would have to be interpolated into SQL text.
  const tables = await prisma.$queryRaw<Array<{ relname: string }>>`
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname <> 'tenants'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = 'public'
          AND col.table_name = c.relname
          AND col.column_name = 'tenant_id'
      )`;

  // The GUC has to be set explicitly here. `runWithTenantSession` works through
  // the Prisma client extension, which applies to model operations — raw SQL
  // goes straight to the connection, so without this the DELETEs are silently
  // filtered out by RLS and remove nothing at all. Set transaction-locally, the
  // same way TenantInterceptor does it, so it cannot leak to a pooled
  // connection afterwards.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_tenant_id', $1, true)`,
      tenantId,
    );
    for (const { relname } of tables) {
      // Identifier comes from pg_class, never from user input; the value is
      // still bound rather than interpolated.
      await tx.$executeRawUnsafe(
        `DELETE FROM public."${relname}" WHERE tenant_id = $1`,
        tenantId,
      );
    }
  });
}

export function withTenantSession<T extends object>(service: T): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;

      // Only wrap genuinely async methods. Seeding the tenant row requires an
      // await, so wrapping a synchronous helper would turn its return value into
      // a Promise and break specs that compare it directly. Synchronous methods
      // are pure helpers here — they do not write, so they need no session.
      if (value.constructor?.name !== "AsyncFunction")
        return value.bind(target);

      return async (...args: unknown[]) => {
        const tenantId = typeof args[0] === "string" ? args[0] : undefined;
        if (!tenantId) return value.apply(target, args);

        await ensureTenant(tenantId);
        return runWithTenantSession(
          { tenantId, userId: "test-user" },
          () => value.apply(target, args) as unknown,
        );
      };
    },
  });
}

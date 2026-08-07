import { describe, it, expect, beforeAll } from "vitest";
import { prisma, runWithTenantSession } from "@unerp/database";
import { Prisma, PrismaClient } from "@prisma/client";
import { ExtensionSchemaService } from "../extension-schema.service";
import { extensionTableName } from "@unerp/extension-api";

/**
 * The same database, reached as the `NOBYPASSRLS` application role.
 *
 * `unerp_api` is created by migration `20260718100000_create_unerp_api_role`,
 * so it exists anywhere the migrations have been applied. Only the credentials
 * change; host, port and database name are taken from `DATABASE_URL` so this
 * follows the environment rather than assuming one.
 */
function appRoleUrlFrom(ownerUrl: string | undefined): string {
  const url = new URL(
    ownerUrl ?? "postgresql://unerp:unerp_password@localhost:5432/unerp_dev",
  );
  url.username = "unerp_api";
  url.password = "unerp_api_password";
  // This client is extra and the suite runs several forks, so bound its pool
  // for the same reason vitest.config.ts bounds the main one.
  url.searchParams.set("schema", "public");
  url.searchParams.set("connection_limit", "2");
  url.searchParams.set("pool_timeout", "20");
  return url.toString();
}

/**
 * § 8.2 — generated extension tables must be indistinguishable from first-party
 * tables where it counts: tenant_id, RLS ENABLED and FORCED, and a policy. The
 * point of these tests is that the guarantee is checked in the catalogue and
 * against real rows, not asserted in a comment.
 */
describe("ExtensionSchemaService", () => {
  const service = new ExtensionSchemaService();
  const extensionId = "spec-widget";
  const entity = "note";
  const table = extensionTableName(extensionId, entity);

  const schema = {
    entities: [
      {
        name: entity,
        fields: [
          {
            name: "title",
            type: "string" as const,
            required: true,
            indexed: true,
          },
          {
            name: "amount",
            type: "decimal" as const,
            required: false,
            indexed: false,
          },
        ],
      },
    ],
  };

  beforeAll(async () => {
    await prisma.$executeRaw(Prisma.raw(`DROP TABLE IF EXISTS "${table}"`));
    await service.provision(extensionId, service.parse(schema));
  });

  it("creates the table inside the extension namespace, never a core name", async () => {
    expect(table).toBe("ext_spec_widget_note");
    const tables = await service.listTables(extensionId);
    expect(tables).toContain(table);
  });

  it("gives the generated table tenant_id, RLS ENABLED, FORCED and a policy", async () => {
    const [meta] = await prisma.$queryRaw<
      Array<{
        enabled: boolean;
        forced: boolean;
        policies: bigint;
        has_tenant: bigint;
      }>
    >(Prisma.sql`
      SELECT c.relrowsecurity AS enabled,
             c.relforcerowsecurity AS forced,
             (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) AS policies,
             (SELECT count(*) FROM information_schema.columns col
               WHERE col.table_name = c.relname AND col.column_name = 'tenant_id') AS has_tenant
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = ${table}
    `);
    expect(meta.enabled).toBe(true);
    expect(meta.forced).toBe(true);
    expect(Number(meta.policies)).toBeGreaterThan(0);
    expect(Number(meta.has_tenant)).toBe(1);
  });

  it("maps a decimal field to Decimal(19,4), not a float", async () => {
    const [col] = await prisma.$queryRaw<
      Array<{
        data_type: string;
        numeric_precision: number;
        numeric_scale: number;
      }>
    >(Prisma.sql`
      SELECT data_type, numeric_precision, numeric_scale
        FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ${table} AND column_name = 'amount'
    `);
    expect(col.data_type).toBe("numeric");
    expect(col.numeric_precision).toBe(19);
    expect(col.numeric_scale).toBe(4);
  });

  it("refuses an entity that redeclares a platform-supplied column", () => {
    expect(() =>
      service.parse({
        entities: [
          { name: "bad", fields: [{ name: "tenant_id", type: "string" }] },
        ],
      }),
    ).toThrow(/reserved column/);
  });

  it("refuses a name that could not be a safe SQL identifier", () => {
    expect(() =>
      service.parse({
        entities: [
          {
            name: "drop table users;--",
            fields: [{ name: "a", type: "string" }],
          },
        ],
      }),
    ).toThrow();
    expect(() => extensionTableName("../../etc", "x")).toThrow(
      /Unsafe extension id/,
    );
  });

  it("is idempotent and additive across re-provisioning", async () => {
    await service.provision(extensionId, service.parse(schema));
    const withExtra = {
      entities: [
        {
          name: entity,
          fields: [
            ...schema.entities[0].fields,
            {
              name: "note_body",
              type: "text" as const,
              required: false,
              indexed: false,
            },
          ],
        },
      ],
    };
    await service.provision(extensionId, service.parse(withExtra));
    const cols = await prisma.$queryRaw<
      Array<{ column_name: string }>
    >(Prisma.sql`
      SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ${table}
    `);
    const names = cols.map((c) => c.column_name);
    expect(names).toContain("title");
    expect(names).toContain("note_body");
  });

  it("isolates rows between tenants at the database, not in application code", async () => {
    // This assertion MUST run as the application role, not as the owner.
    //
    // The migration/seed role (`unerp`) is a Postgres SUPERUSER, and a
    // superuser bypasses row-level security outright — `FORCE` does not apply
    // to it. Asserting isolation over the owner connection therefore proves
    // nothing: the first draft of this test did exactly that, saw both tenants'
    // rows, and looked like an RLS bug when it was a test-configuration bug.
    // `unerp_api` is NOBYPASSRLS, which is the role the API actually runs as,
    // so this is the configuration whose behaviour matters.
    //
    // The connection is DERIVED rather than hardcoded, and that is the second
    // half of the same lesson. The old fallback named a literal
    // `…@localhost:5432/unerp_dev` — the local database. CI's is
    // `unierp_test`, so on a runner this failed with P1003 "Database
    // `unerp_dev` does not exist", which means the one assertion that proves
    // RLS at the database had never run in CI, while the job step called "RLS /
    // tenant-isolation verification" reported success beside it. § 5.1 calls a
    // two-tenant test that does not exercise the app role "worse than no test,
    // because it reports a guarantee it never checked"; one that cannot connect
    // at all is that failure wearing a different error code.
    //
    // Swapping only the credentials keeps host, port and database correct
    // wherever this runs, so whoever renames the database next does not need to
    // know this test exists.
    const appUrl =
      process.env.DATABASE_APP_URL ?? appRoleUrlFrom(process.env.DATABASE_URL);
    const appClient = new PrismaClient({
      datasources: { db: { url: appUrl } },
    });

    try {
      // Assert the connection before asserting isolation over it.
      //
      // § 5.1: "a two-tenant test that runs as the owner will pass on a table
      // with no policy at all, which makes it worse than no test — it reports a
      // guarantee it never checked." A derivation bug, a changed password, or a
      // future edit to `appRoleUrlFrom` could silently hand this test the owner
      // connection again, and every assertion below would still pass. Checking
      // the catalogue makes that vacuous pass impossible rather than merely
      // unlikely.
      const [role] = await appClient.$queryRaw<
        Array<{ rolname: string; rolsuper: boolean; rolbypassrls: boolean }>
      >(
        Prisma.sql`SELECT rolname, rolsuper, rolbypassrls
                   FROM pg_roles WHERE rolname = current_user`,
      );
      expect(role?.rolname).toBe("unerp_api");
      expect(role?.rolsuper).toBe(false);
      expect(role?.rolbypassrls).toBe(false);

      const insert = (tenantId: string, title: string) =>
        runWithTenantSession({ tenantId, userId: "spec" }, async () =>
          prisma.$executeRaw(
            Prisma.sql`INSERT INTO ${Prisma.raw(`"${table}"`)} ("id", "tenant_id", "title")
                       VALUES (${`${tenantId}-${title}`}, ${tenantId}, ${title})
                       ON CONFLICT ("id") DO NOTHING`,
          ),
        );

      await insert("ext-tenant-a", "a-row");
      await insert("ext-tenant-b", "b-row");

      const seenByA = await appClient.$transaction(async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`SELECT set_config('app.current_tenant_id', ${"ext-tenant-a"}, true)`,
        );
        return tx.$queryRaw<Array<{ title: string }>>(
          Prisma.sql`SELECT title FROM ${Prisma.raw(`"${table}"`)}`,
        );
      });

      const titles = seenByA.map((r) => r.title);
      expect(titles).toContain("a-row");
      expect(titles).not.toContain("b-row");
    } finally {
      await appClient.$disconnect();
    }
  });
});

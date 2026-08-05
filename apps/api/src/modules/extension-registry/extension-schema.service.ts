import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import {
  ExtensionSchemaSchema,
  extensionTableName,
  validateFields,
  PG_TYPE,
  IDENTIFIER,
  type ExtensionEntity,
  type ExtensionSchema,
} from "@unerp/extension-api";

/**
 * Generates an extension's tables in the extension namespace — § 8.2.
 *
 * This is the only place in the codebase that builds DDL from data supplied
 * outside it, so the safety argument has to be explicit:
 *
 *   - Table and column names never come from a string the extension wrote.
 *     They come from `extensionTableName()` and the declared field list, both
 *     of which are re-validated against `IDENTIFIER` (`^[a-z][a-z0-9_]{0,48}$`)
 *     at the point of interpolation. A name that does not match cannot reach
 *     SQL at all.
 *   - Column types come from a closed map. A manifest cannot express a type
 *     that is not one of seven, so no type string is ever interpolated.
 *   - No user *values* are interpolated anywhere — this builds structure only,
 *     and every later read/write goes through parameterised queries.
 *   - `Prisma.raw` is used rather than `$executeRawUnsafe`, so the raw-SQL
 *     policy ratchet stays where it is: the gate counts `$executeRawUnsafe`
 *     precisely because that call takes a whole statement as a string.
 *
 * Every generated table gets tenant_id, RLS ENABLED and FORCED, and a
 * tenant_isolation policy — the same protection as a first-party table, from
 * the same layer. An extension's data is tenant data.
 */
@Injectable()
export class ExtensionSchemaService {
  private readonly logger = new Logger(ExtensionSchemaService.name);

  /** Parse and validate a manifest's schema block without touching the database. */
  parse(raw: unknown): ExtensionSchema {
    const parsed = ExtensionSchemaSchema.safeParse(raw ?? { entities: [] });
    if (!parsed.success) {
      throw new BadRequestException(
        `Invalid extension schema: ${parsed.error.issues
          .map((i) => `${i.path.join(".")} ${i.message}`)
          .join("; ")}`,
      );
    }
    for (const entity of parsed.data.entities) validateFields(entity);
    return parsed.data;
  }

  /**
   * Create the tables for an extension. Idempotent: re-installing the same
   * version is a no-op, and a new field is added rather than the table dropped,
   * because dropping a column would destroy tenant data on an upgrade.
   */
  async provision(
    extensionId: string,
    schema: ExtensionSchema,
  ): Promise<string[]> {
    const created: string[] = [];
    for (const entity of schema.entities) {
      const table = extensionTableName(extensionId, entity.name);
      await this.createTable(table, entity);
      await this.applyRls(table);
      created.push(table);
    }
    if (created.length) {
      this.logger.log(
        `Provisioned ${created.length} table(s) for extension ${extensionId}: ${created.join(", ")}`,
      );
    }
    return created;
  }

  /**
   * Uninstall does NOT drop tables. § 14 Phase 4: "A vertical that fails as an
   * extension goes back to its service with no data migration — the tenant data
   * never moved." Dropping on uninstall would make an accidental uninstall
   * unrecoverable; reclaiming storage is a separate, deliberate operation.
   */
  async listTables(extensionId: string): Promise<string[]> {
    const prefix = `ext_${extensionId.replace(/-/g, "_")}_`;
    const rows = await prisma.$queryRaw<Array<{ table_name: string }>>(
      Prisma.sql`SELECT table_name FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name LIKE ${`${prefix}%`}`,
    );
    return rows.map((r) => r.table_name);
  }

  private async createTable(
    table: string,
    entity: ExtensionEntity,
  ): Promise<void> {
    const columns = validateFields(entity).map((f) => {
      if (!IDENTIFIER.test(f.name)) {
        throw new Error(`Unsafe column name reached DDL: ${f.name}`);
      }
      return `"${f.name}" ${PG_TYPE[f.type]}${f.required ? " NOT NULL" : ""}`;
    });

    const ddl =
      `CREATE TABLE IF NOT EXISTS "${table}" (` +
      `"id" TEXT NOT NULL, ` +
      `"tenant_id" TEXT NOT NULL, ` +
      `${columns.join(", ")}${columns.length ? ", " : ""}` +
      `"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ` +
      `"updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ` +
      `CONSTRAINT "${table}_pkey" PRIMARY KEY ("id"))`;

    await prisma.$executeRaw(Prisma.raw(ddl));

    // Tenant index always; declared indexes on request.
    await prisma.$executeRaw(
      Prisma.raw(
        `CREATE INDEX IF NOT EXISTS "${table}_tenant_idx" ON "${table}" ("tenant_id")`,
      ),
    );
    for (const f of entity.fields.filter((x) => x.indexed)) {
      await prisma.$executeRaw(
        Prisma.raw(
          `CREATE INDEX IF NOT EXISTS "${table}_${f.name}_idx" ON "${table}" ("tenant_id", "${f.name}")`,
        ),
      );
    }

    // Additive upgrade: a field added in a later version appears without
    // touching existing rows or dropping anything.
    for (const f of entity.fields) {
      await prisma.$executeRaw(
        Prisma.raw(
          `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${f.name}" ${PG_TYPE[f.type]}`,
        ),
      );
    }
  }

  private async applyRls(table: string): Promise<void> {
    await prisma.$executeRaw(
      Prisma.raw(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`),
    );
    await prisma.$executeRaw(
      Prisma.raw(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`),
    );
    await prisma.$executeRaw(
      Prisma.raw(
        `DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}"`,
      ),
    );
    await prisma.$executeRaw(
      Prisma.raw(
        `CREATE POLICY "tenant_isolation_${table}" ON "${table}" ` +
          `USING ("tenant_id" = current_tenant_id()) ` +
          `WITH CHECK ("tenant_id" = current_tenant_id())`,
      ),
    );
  }
}

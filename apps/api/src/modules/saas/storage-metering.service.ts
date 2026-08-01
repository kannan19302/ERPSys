import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { TRACKED_MODELS, ownerForModel } from "../../common/app-data-ownership";

interface TableStat {
  relname: string;
  n_live_tup: bigint;
  total_bytes: bigint;
}

/**
 * Computes per-app storage usage from live PostgreSQL statistics.
 *
 * For each tracked Prisma model, queries pg_stat_user_tables for the tenant's
 * row count and table size, multiplies by the actual average row size, and
 * writes per-app aggregates into AppStorageUsage.
 *
 * Unmapped models are aggregated into the "platform" bucket.
 */
@Injectable()
export class StorageMeteringService {
  private readonly logger = new Logger(StorageMeteringService.name);

  /**
   * Recompute storage for a single tenant. Called on-demand from the SaaS
   * Portal and by the nightly scheduled job.
   */
  async recomputeTenant(tenantId: string): Promise<{
    perApp: Record<string, { rowCount: number; estimatedBytes: number }>;
    totalBytes: number;
  }> {
    // Map table name <-> model name: Prisma uses snake_case for table names
    // matching the @@map() value. Look up by convention: model FooBar → foo_bar.
    // pg_stat_user_tables sees the physical table name (= @@map).
    const tableStats = await this.getTableStats();

    const perApp: Record<string, { rowCount: number; estimatedBytes: number }> =
      {};

    for (const stat of tableStats) {
      const modelName = this.tableNameToModelName(stat.relname);
      if (!modelName || !TRACKED_MODELS.has(modelName)) {
        continue;
      }

      // Estimated bytes for this table across ALL tenants.
      // Row-per-tenant approximation: if the table has N total rows and
      // total_bytes / MAX(N, 1) avg bytes per row, multiply by the counts.
      // We get the tenant-specific row count separately.
      const tenantRowCount = await this.getTenantRowCount(modelName, tenantId);
      if (tenantRowCount === 0) continue;

      const avgRowSize =
        stat.n_live_tup > 0n
          ? Number(stat.total_bytes) / Number(stat.n_live_tup)
          : 0;
      const estimatedBytes = Math.round(tenantRowCount * avgRowSize);
      const appSlug = ownerForModel(modelName);

      if (!perApp[appSlug]) {
        perApp[appSlug] = { rowCount: 0, estimatedBytes: 0 };
      }
      perApp[appSlug].rowCount += tenantRowCount;
      perApp[appSlug].estimatedBytes += estimatedBytes;
    }

    // Write AppStorageUsage rows
    let totalBytes = 0;
    for (const [appSlug, usage] of Object.entries(perApp)) {
      totalBytes += usage.estimatedBytes;
      await prisma.appStorageUsage.upsert({
        where: { tenantId_appSlug: { tenantId, appSlug } },
        update: {
          rowCount: usage.rowCount,
          estimatedBytes: usage.estimatedBytes,
        },
        create: {
          tenantId,
          appSlug,
          rowCount: usage.rowCount,
          estimatedBytes: usage.estimatedBytes,
        },
      });
    }

    // Write tenant-wide STORAGE_MB into UsageRecord for quota checks
    const storageMb = Math.round(totalBytes / (1024 * 1024));
    const existing = await prisma.usageRecord.findUnique({
      where: { tenantId_metric: { tenantId, metric: "STORAGE_MB" } },
    });
    if (existing) {
      await prisma.usageRecord.update({
        where: { id: existing.id },
        data: { currentValue: storageMb },
      });
    }

    return { perApp, totalBytes };
  }

  /**
   * Recompute storage for ALL tenants. Called by the nightly scheduled job.
   */
  async recomputeAllTenants(): Promise<number> {
    const tenantIds = await prisma.tenant.findMany({
      select: { id: true },
      where: { status: "ACTIVE" },
    });
    let count = 0;
    for (const t of tenantIds) {
      try {
        await this.recomputeTenant(t.id);
        count++;
      } catch (err) {
        this.logger.warn(
          `Storage metering failed for tenant ${t.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    this.logger.log(`Storage metering completed for ${count} tenants`);
    return count;
  }

  /** Returns per-app storage rows for a tenant. */
  async getTenantUsage(tenantId: string) {
    return prisma.appStorageUsage.findMany({
      where: { tenantId },
      orderBy: { estimatedBytes: "desc" },
    });
  }

  // ── Private helpers ──

  private async getTableStats(): Promise<TableStat[]> {
    const rows = await prisma.$queryRaw<
      Array<{
        relname: string;
        n_live_tup: bigint;
        total_bytes: bigint;
      }>
    >`
      SELECT
        relname,
        n_live_tup,
        pg_total_relation_size(relid) AS total_bytes
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND n_live_tup > 0
      ORDER BY total_bytes DESC
    `;
    return rows;
  }

  private async getTenantRowCount(
    modelName: string,
    tenantId: string,
  ): Promise<number> {
    try {
      // Build a raw count query scoped by tenant_id column with strict identifier validation
      const tableName = this.modelNameToTableName(modelName);
      if (!/^[a-z0-9_]+$/i.test(tableName)) {
        return 0;
      }
      const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*)::bigint AS count FROM "${tableName}" WHERE tenant_id = $1`,
        tenantId,
      );
      return Number(rows[0]?.count || 0n);
    } catch {
      // Table may not exist for this tenant
      return 0;
    }
  }

  private modelNameToTableName(model: string): string {
    // Prisma default: PascalCase → snake_case
    return model
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()
      .replace(/^_/, "");
  }

  private tableNameToModelName(table: string): string {
    // snake_case → PascalCase
    return table
      .split("_")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
  }
}

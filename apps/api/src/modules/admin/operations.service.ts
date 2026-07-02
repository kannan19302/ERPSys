import { Injectable, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@unerp/database';
import * as os from 'os';

@Injectable()
export class OperationsService {
  constructor(
    @Optional() @InjectQueue('email') private readonly emailQueue?: Queue,
    @Optional() @InjectQueue('export') private readonly exportQueue?: Queue,
    @Optional() @InjectQueue('payroll') private readonly payrollQueue?: Queue,
    @Optional() @InjectQueue('data-import') private readonly dataImportQueue?: Queue,
  ) {}

  private resolveQueue(queueName: string): Queue | undefined {
    switch (queueName) {
      case 'email':
        return this.emailQueue;
      case 'export':
        return this.exportQueue;
      case 'payroll':
        return this.payrollQueue;
      case 'data-import':
        return this.dataImportQueue;
      default:
        return undefined;
    }
  }
  /**
   * Get dynamic System Health statistics.
   */
  async getSystemHealth() {
    // Measure actual DB latency
    const start = Date.now();
    const dbStatus = await this.checkDatabase();
    const apiLatencyMs = Date.now() - start;

    // Calculate system resources
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    const cpus = os.cpus();
    let cpuUsage = 15; // default fallback
    if (cpus.length > 0) {
      const load = os.loadavg();
      const firstLoad = load[0] ?? 0.5;
      cpuUsage = Math.round((firstLoad / cpus.length) * 100);
    }

    return {
      status: dbStatus === 'HEALTHY' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      metrics: {
        cpuUsage: Math.min(100, Math.max(2, cpuUsage)),
        memoryUsage: memUsage,
        totalMemoryGB: Math.round(totalMem / (1024 * 1024 * 1024)),
        apiLatencyMs,
      },
      services: {
        database: dbStatus,
      },
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await prisma.$executeRawUnsafe('SELECT 1');
      return 'HEALTHY';
    } catch {
      return 'UNHEALTHY';
    }
  }

  /**
   * Get background queues / job metrics grouped by queue.
   */
  async getBackgroundJobs(tenantId: string) {
    const jobs = await prisma.backgroundJob.groupBy({
      by: ['queueName', 'status'],
      where: { tenantId },
      _count: { id: true },
    });

    // Pivot into per-queue summaries
    const queueMap = new Map<string, { name: string; active: number; waiting: number; completed: number; failed: number }>();
    for (const row of jobs) {
      if (!queueMap.has(row.queueName)) {
        queueMap.set(row.queueName, { name: row.queueName, active: 0, waiting: 0, completed: 0, failed: 0 });
      }
      const entry = queueMap.get(row.queueName)!;
      const count = row._count.id;
      switch (row.status) {
        case 'ACTIVE':
        case 'RUNNING':
          entry.active += count;
          break;
        case 'PENDING':
        case 'WAITING':
          entry.waiting += count;
          break;
        case 'COMPLETED':
          entry.completed += count;
          break;
        case 'FAILED':
          entry.failed += count;
          break;
      }
    }

    return Array.from(queueMap.values());
  }

  /**
   * Retry all failed background jobs for a tenant.
   *
   * Previously this only flipped `BackgroundJob.status` back to PENDING — nothing consumed
   * that table, so a "retry" never actually re-ran anything (see P1-1 in
   * .ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md). Now it re-enqueues each failed job into the
   * correct BullMQ queue by `queueName`, using the stored `payload`/`jobType`, and re-links the
   * row to the new `bullJobId`. Rows whose `queueName` doesn't map to a live Queue instance
   * (e.g. legacy `scheduled-*` rows from `triggerTask`, which have no processor — a P2 item)
   * are left FAILED with a note, rather than silently pretending to retry them.
   */
  async retryJobs(tenantId: string) {
    const failedJobs = await prisma.backgroundJob.findMany({
      where: { tenantId, status: 'FAILED' },
    });

    let retriedCount = 0;
    let skippedCount = 0;

    for (const job of failedJobs) {
      const queue = this.resolveQueue(job.queueName);
      if (!queue) {
        skippedCount += 1;
        continue;
      }

      const bullJob = await queue.add(job.jobType, job.payload ?? {}, {
        priority: job.priority,
      });

      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: 'PENDING',
          bullJobId: String(bullJob.id),
          attempts: 0,
          error: null,
          startedAt: null,
          completedAt: null,
        },
      });
      retriedCount += 1;
    }

    return {
      success: true,
      message: `${retriedCount} failed job(s) re-enqueued into BullMQ.${skippedCount > 0 ? ` ${skippedCount} job(s) skipped (no live queue for their queueName).` : ''}`,
      retriedCount,
      skippedCount,
    };
  }

  /**
   * Get scheduled cron tasks.
   */
  async getScheduledTasks(tenantId: string) {
    const tasks = await prisma.scheduledTask.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return tasks.map((t) => ({
      id: t.id,
      name: t.name,
      expression: t.expression,
      handler: t.handler,
      nextRun: t.nextRunAt ? t.nextRunAt.toISOString() : null,
      lastRun: t.lastRunAt ? t.lastRunAt.toISOString() : null,
      lastResult: t.lastResult,
      status: t.status,
    }));
  }

  /**
   * Trigger a scheduled task execution by creating a background job for it.
   */
  async triggerTask(tenantId: string, taskId: string) {
    const task = await prisma.scheduledTask.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      return { success: false, message: `Task ${taskId} not found.` };
    }

    const job = await prisma.backgroundJob.create({
      data: {
        tenantId,
        queueName: `scheduled-${task.handler}`,
        jobType: task.handler,
        payload: task.config ?? {},
        status: 'PENDING',
        priority: 10,
      },
    });

    await prisma.scheduledTask.update({
      where: { id: taskId },
      data: { lastRunAt: new Date() },
    });

    return {
      success: true,
      message: `Task "${task.name}" triggered successfully.`,
      jobId: job.id,
    };
  }

  /**
   * Query structured error logs with pagination.
   */
  async getErrorLogs(tenantId: string, page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      prisma.errorLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.errorLog.count({ where: { tenantId } }),
    ]);

    return {
      data: logs.map((l) => ({
        id: l.id,
        timestamp: l.createdAt.toISOString(),
        level: l.level,
        context: l.source,
        message: l.message,
        stack: l.stack,
        resolved: l.resolved,
        requestId: l.requestId,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async resolveErrorLog(id: string, resolvedBy: string) {
    await prisma.errorLog.update({
      where: { id },
      data: { resolved: true, resolvedBy, resolvedAt: new Date() },
    });
    return { success: true };
  }

  /**
   * Get database backup records.
   *
   * NOTE — these are NOT real files. There is no `pg_dump` process behind this list; it is
   * metadata stored in the `Setting` table. `source: 'SIMULATED'` is surfaced on every record
   * (including the two seeded fallback rows) so the frontend can render an honest "not a real
   * DR artifact" indicator instead of presenting fabricated data as real backup coverage. See
   * P1-1 in .ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md — a real `pg_dump`-backed pipeline
   * requires devops-engineer sign-off on shelling out from the API container, which this pass
   * does not have; relabeling honestly was the explicitly chosen safer path.
   */
  async getBackups(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'operations.backups' } },
    });
    if (!setting) {
      return [
        { id: 'bak-1', filename: 'unerp_backup_2026-06-20.sql', sizeBytes: 15421800, createdBy: 'System Cron', createdAt: new Date(Date.now() - 86400000).toISOString(), source: 'SIMULATED' },
        { id: 'bak-2', filename: 'unerp_backup_2026-06-19.sql', sizeBytes: 15410900, createdBy: 'admin@unerp.dev', createdAt: new Date(Date.now() - 172800000).toISOString(), source: 'SIMULATED' },
      ];
    }
    const backups = setting.value as any[];
    // Backfill `source` for rows persisted before this field existed, so old and new records
    // are equally honest about not being real DR artifacts.
    return backups.map((b) => ({ source: 'SIMULATED', ...b }));
  }

  /**
   * Create database backup.
   *
   * `sizeBytes` here is a fabricated placeholder (no real `pg_dump` runs) — see the `source`
   * field note on `getBackups` above. Every created record is explicitly flagged
   * `source: 'SIMULATED'` rather than presented as a trustworthy DR artifact.
   */
  async createBackup(tenantId: string, userId: string) {
    const backups = await this.getBackups(tenantId) as any[];
    const newBackup = {
      id: `bak-${Date.now()}`,
      filename: `unerp_backup_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.sql`,
      sizeBytes: Math.round(15000000 + Math.random() * 500000),
      createdBy: userId,
      createdAt: new Date().toISOString(),
      source: 'SIMULATED',
    };

    const updated = [newBackup, ...backups];
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'operations.backups' } },
      update: { value: updated as any, category: 'operations' },
      create: {
        tenantId,
        key: 'operations.backups',
        value: updated as any,
        category: 'operations',
      },
    });

    return newBackup;
  }

  /**
   * Real database tables listing with actual row counts.
   */
  async getDbSchema() {
    try {
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name ASC
      `;

      // Get actual row counts via pg statistics (fast, approximate)
      const counts = await prisma.$queryRaw<Array<{ relname: string; n_live_tup: bigint }>>`
        SELECT relname, n_live_tup
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
      `;

      const countMap = new Map<string, number>();
      for (const row of counts) {
        countMap.set(row.relname, Number(row.n_live_tup));
      }

      return tables.map(t => ({
        tableName: t.table_name,
        rowCount: countMap.get(t.table_name) ?? 0,
        status: 'ACTIVE',
      }));
    } catch {
      // Fallback
      return [
        { tableName: 'tenants', rowCount: 0, status: 'ACTIVE' },
        { tableName: 'users', rowCount: 0, status: 'ACTIVE' },
        { tableName: 'roles', rowCount: 0, status: 'ACTIVE' },
        { tableName: 'organizations', rowCount: 0, status: 'ACTIVE' },
      ];
    }
  }
}

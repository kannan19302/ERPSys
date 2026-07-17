import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

type Environment = 'DRAFT' | 'STAGING' | 'PRODUCTION';

export interface EnvironmentConfig {
  environment: Environment;
  releaseId: string | null;
  version: string | null;
  promotedAt: Date | null;
  promotedBy: string | null;
}

@Injectable()
export class BuilderGovernanceService {

  async getModuleEnvironments(tenantId: string, moduleId: string): Promise<EnvironmentConfig[]> {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const releases = await prisma.appRelease.findMany({
      where: { moduleId, tenantId },
      orderBy: { publishedAt: 'desc' },
    });

    const production = releases.find((r) => r.channel === 'PRODUCTION' && r.status === 'PUBLISHED');
    const staging = releases.find((r) => r.channel === 'STAGING' && r.status === 'PUBLISHED');

    return [
      {
        environment: 'DRAFT',
        releaseId: null,
        version: mod.version,
        promotedAt: null,
        promotedBy: null,
      },
      {
        environment: 'STAGING',
        releaseId: staging?.id || null,
        version: staging?.version || null,
        promotedAt: staging?.publishedAt || null,
        promotedBy: staging?.publishedBy || null,
      },
      {
        environment: 'PRODUCTION',
        releaseId: production?.id || null,
        version: production?.version || null,
        promotedAt: production?.publishedAt || null,
        promotedBy: production?.publishedBy || null,
      },
    ];
  }

  async promoteToStaging(tenantId: string, moduleId: string, userId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const currentRelease = mod.currentReleaseId
      ? await prisma.appRelease.findFirst({ where: { id: mod.currentReleaseId } })
      : null;

    if (!currentRelease) throw new BadRequestException('No published release to promote');

    await prisma.appRelease.update({
      where: { id: currentRelease.id },
      data: { channel: 'STAGING', publishedBy: userId },
    });

    return { moduleId, version: currentRelease.version, promotedTo: 'STAGING', promotedBy: userId };
  }

  async promoteToProduction(tenantId: string, moduleId: string, userId: string) {
    const stagingRelease = await prisma.appRelease.findFirst({
      where: { moduleId, tenantId, channel: 'STAGING', status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
    });

    if (!stagingRelease) throw new BadRequestException('No staging release to promote. Promote to staging first.');

    // Mark old production releases as superseded
    await prisma.appRelease.updateMany({
      where: { moduleId, tenantId, channel: 'PRODUCTION', status: 'PUBLISHED' },
      data: { status: 'SUPERSEDED' },
    });

    await prisma.appRelease.update({
      where: { id: stagingRelease.id },
      data: { channel: 'PRODUCTION', publishedBy: userId, publishedAt: new Date() },
    });

    await prisma.builderModule.update({
      where: { id: moduleId },
      data: { currentReleaseId: stagingRelease.id, publishedAt: new Date() },
    });

    return { moduleId, version: stagingRelease.version, promotedTo: 'PRODUCTION', promotedBy: userId };
  }

  // ════════════════════════════════════════════════
  // Permission scoping per builder app
  // ════════════════════════════════════════════════

  async getModulePermissions(tenantId: string, moduleId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const permissions = (mod.permissions && typeof mod.permissions === 'object')
      ? mod.permissions as Record<string, unknown>
      : {};

    return {
      moduleId,
      moduleName: mod.name,
      permissions: {
        allowedRoles: (permissions as any).allowedRoles || ['Super Admin', 'Admin'],
        dataAccess: (permissions as any).dataAccess || 'TENANT_SCOPED',
        canExportData: (permissions as any).canExportData ?? true,
        canDeleteRecords: (permissions as any).canDeleteRecords ?? false,
        maxRecords: (permissions as any).maxRecords || 10000,
        apiAccess: (permissions as any).apiAccess ?? true,
      },
    };
  }

  async updateModulePermissions(
    tenantId: string,
    moduleId: string,
    permissions: {
      allowedRoles?: string[];
      dataAccess?: 'TENANT_SCOPED' | 'ORG_SCOPED' | 'USER_SCOPED';
      canExportData?: boolean;
      canDeleteRecords?: boolean;
      maxRecords?: number;
      apiAccess?: boolean;
    },
  ) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const existing = (mod.permissions && typeof mod.permissions === 'object')
      ? mod.permissions as Record<string, unknown>
      : {};

    const merged = { ...existing, ...permissions };

    await prisma.builderModule.update({
      where: { id: moduleId },
      data: { permissions: merged as any },
    });

    return { moduleId, permissions: merged };
  }

  async checkModuleAccess(tenantId: string, moduleId: string, userRoles: string[]): Promise<boolean> {
    const perms = await this.getModulePermissions(tenantId, moduleId);
    const allowed = perms.permissions.allowedRoles as string[];

    if (allowed.includes('*')) return true;
    if (userRoles.includes('Super Admin')) return true;

    return userRoles.some((role) => allowed.includes(role));
  }

  // ════════════════════════════════════════════════
  // Version comparison & diff
  // ════════════════════════════════════════════════

  async compareVersions(tenantId: string, moduleId: string, fromReleaseId: string, toReleaseId: string) {
    const [fromRelease, toRelease] = await Promise.all([
      prisma.appRelease.findFirst({ where: { id: fromReleaseId, moduleId, tenantId } }),
      prisma.appRelease.findFirst({ where: { id: toReleaseId, moduleId, tenantId } }),
    ]);

    if (!fromRelease || !toRelease) throw new NotFoundException('Release not found');

    const fromSnap = (fromRelease.snapshot || {}) as Record<string, unknown>;
    const toSnap = (toRelease.snapshot || {}) as Record<string, unknown>;

    const changes: Array<{ type: string; entity: string; action: 'ADDED' | 'REMOVED' | 'MODIFIED' }> = [];

    for (const key of ['forms', 'workflows', 'dashboards', 'pages', 'dataModels'] as const) {
      const fromItems = (fromSnap[key] || []) as Array<{ id: string }>;
      const toItems = (toSnap[key] || []) as Array<{ id: string }>;
      const fromIds = new Set(fromItems.map((i) => i.id));
      const toIds = new Set(toItems.map((i) => i.id));

      for (const id of toIds) {
        if (!fromIds.has(id)) changes.push({ type: key, entity: id, action: 'ADDED' });
      }
      for (const id of fromIds) {
        if (!toIds.has(id)) changes.push({ type: key, entity: id, action: 'REMOVED' });
      }
    }

    return {
      fromVersion: fromRelease.version,
      toVersion: toRelease.version,
      changeCount: changes.length,
      changes,
    };
  }

  // --- Summary ---
  async getGovernanceSummary(tenantId: string) {
    const [releases, logs, connectors] = await Promise.all([
      prisma.appRelease.count({ where: { tenantId } }),
      prisma.runLog.count({ where: { tenantId } }),
      prisma.thirdPartyConnector.count({ where: { tenantId } }),
    ]);
    return {
      releases,
      runLogsCount: logs,
      connectorsCount: connectors,
      environmentState: 'HEALTHY'
    };
  }

  // --- Run Logs ---
  async getRunLogs(tenantId: string, level?: string, search?: string) {
    const where: any = { tenantId };
    if (level && level !== 'ALL') {
      where.level = level;
    }
    if (search) {
      where.message = { contains: search, mode: 'insensitive' };
    }

    // Seed mock logs if the table is currently empty
    const count = await prisma.runLog.count({ where: { tenantId } });
    if (count === 0) {
      await prisma.runLog.createMany({
        data: [
          { tenantId, level: 'INFO', message: 'Sync CRM leads to ERP module: Completed successfully.', payload: { duration: '342ms' } },
          { tenantId: tenantId, level: 'WARN', message: 'Slow DB query detected: SELECT * FROM invoice WHERE status = \'PAID\'', stackTrace: 'Explain plan cost: 420.50' },
          { tenantId: tenantId, level: 'ERROR', message: 'Sync failed: Connection timed out to external API endpoint.', stackTrace: 'TimeoutException at fetch()' }
        ]
      });
    }

    return prisma.runLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 50
    });
  }

  // --- Connectors ---
  async getConnectors(tenantId: string) {
    // Seed default mock connectors if empty
    const count = await prisma.thirdPartyConnector.count({ where: { tenantId } });
    if (count === 0) {
      await prisma.thirdPartyConnector.createMany({
        data: [
          { tenantId, name: 'Shopify Storefront Connector', type: 'REST', config: { url: 'https://shopify.com/api/v2', auth: 'Bearer token' } },
          { tenantId, name: 'Salesforce Sync Stream', type: 'GraphQL', config: { url: 'https://salesforce.com/graphql', auth: 'OAuth2' } }
        ]
      });
    }
    return prisma.thirdPartyConnector.findMany({ where: { tenantId } });
  }

  async saveConnector(tenantId: string, name: string, type: string, config: any) {
    return prisma.thirdPartyConnector.create({
      data: { tenantId, name, type, config }
    });
  }

  async deleteConnector(tenantId: string, id: string) {
    return prisma.thirdPartyConnector.deleteMany({ where: { id, tenantId } });
  }

  // --- Permissions Management ---
  async getAllPermissions(tenantId: string) {
    const list = await prisma.studioPermission.findMany({ where: { tenantId } });
    if (list.length === 0) {
      await prisma.studioPermission.createMany({
        data: [
          { tenantId, roleId: 'System Manager', moduleSlug: 'inventory', canRead: true, canWrite: true },
          { tenantId, roleId: 'Sales User', moduleSlug: 'crm', canRead: true, canWrite: false },
          { tenantId, roleId: 'HR Manager', moduleSlug: 'hr', canRead: true, canWrite: true }
        ]
      });
      return prisma.studioPermission.findMany({ where: { tenantId } });
    }
    return list;
  }

  async saveStudioPermission(tenantId: string, roleId: string, moduleSlug: string, canRead: boolean, canWrite: boolean) {
    return prisma.studioPermission.upsert({
      where: {
        tenantId_roleId_moduleSlug: { tenantId, roleId, moduleSlug }
      },
      update: { canRead, canWrite },
      create: { tenantId, roleId, moduleSlug, canRead, canWrite }
    });
  }

  async deleteStudioPermission(tenantId: string, id: string) {
    return prisma.studioPermission.deleteMany({ where: { id, tenantId } });
  }

  // --- Marketplace ---
  async getMarketplaceList() {
    return [
      { id: '1', name: 'Fleet Maintenance Template', description: 'Complete system tracking service orders, gas expenses, and logs.', author: 'UniERP Team', downloads: 1420 },
      { id: '2', name: 'Stripe Payment Gateway Plugin', description: 'Enable visual checkout forms directly bound to invoices.', author: 'Community Partner', downloads: 890 },
      { id: '3', name: 'Healthcare EMR Extension', description: 'Adds EHR files, encounter trackers, and scheduler overlays.', author: 'MedTech Labs', downloads: 650 }
    ];
  }
}


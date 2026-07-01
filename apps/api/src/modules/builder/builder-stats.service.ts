import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * Cross-module analytics for the Builder home: platform-wide KPI rollups,
 * per-app custom-record counts and trends, and recent-activity feeds. Read-only
 * aggregation across many domain tables; failures degrade gracefully per source.
 */
@Injectable()
export class BuilderStatsService {
  private readonly logger = new Logger(BuilderStatsService.name);

  async getGlobalPerformanceStats(tenantId: string) {
    let totalRevenue = 0;
    let pendingInvoices = 0;
    let activeEmployees = 0;
    let stockAlerts = 0;
    let totalLeads = 0;

    try {
      const invoices = await prisma.invoice.findMany({
        where: { tenantId },
        select: { totalAmount: true, status: true }
      });
      if (invoices.length > 0) {
        totalRevenue = invoices
          .filter(inv => inv.status === 'PAID' || inv.status === 'Paid')
          .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        pendingInvoices = invoices
          .filter(inv => inv.status === 'UNPAID' || inv.status === 'Unpaid' || inv.status === 'Draft' || inv.status === 'Pending')
          .length;
      }
    } catch (err) {
      this.logger.error('Error fetching invoices for global stats', err);
    }

    try {
      const empCount = await prisma.employee.count({
        where: { tenantId, deletedAt: null, status: 'ACTIVE' }
      });
      activeEmployees = empCount;
    } catch (err) {
      this.logger.error('Error fetching employees for global stats', err);
    }

    try {
      const leadCount = await prisma.lead.count({
        where: { tenantId }
      });
      totalLeads = leadCount;
    } catch (err) {
      this.logger.error('Error fetching leads for global stats', err);
    }

    try {
      const items = await prisma.inventoryItem.findMany({
        where: { tenantId },
        select: { quantity: true, reorderPoint: true }
      });
      stockAlerts = items.filter(item => {
        const q = Number(item.quantity || 0);
        const rp = item.reorderPoint ? Number(item.reorderPoint) : 0;
        return q <= rp;
      }).length;
    } catch (err) {
      this.logger.error('Error fetching stock alerts for global stats', err);
    }

    // Custom Apps / Modules Details
    let customApps: any[] = [];
    let totalCustomApps = 0;
    let totalCustomRecords = 0;

    try {
      const modules = await prisma.builderModule.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          version: true,
          status: true,
          pages: true,
          components: true,
          dataModels: true
        }
      });

      totalCustomApps = modules.length;

      // Count custom records grouped by schemaRegistry.module
      const schemas = await prisma.schemaRegistry.findMany({
        where: { tenantId },
        select: {
          id: true,
          slug: true,
          module: true,
          name: true,
          _count: {
            select: { customRecords: true }
          }
        }
      });

      totalCustomRecords = schemas.reduce((sum, s) => sum + s._count.customRecords, 0);

      // Map moduleSlug to count
      const moduleRecordCountMap = new Map<string, number>();
      for (const s of schemas) {
        const modKey = s.module.toLowerCase();
        moduleRecordCountMap.set(modKey, (moduleRecordCountMap.get(modKey) || 0) + s._count.customRecords);
      }

      customApps = modules.map(m => {
        const mSlug = m.slug.toLowerCase();
        const pagesArr = Array.isArray(m.pages) ? m.pages : [];
        const componentsArr = Array.isArray(m.components) ? m.components : [];
        const dmsArr = Array.isArray(m.dataModels) ? m.dataModels : [];

        return {
          id: m.id,
          name: m.name,
          slug: m.slug,
          category: m.category || 'Operations',
          version: m.version,
          status: m.status,
          pagesCount: pagesArr.length,
          formsCount: componentsArr.filter((c: any) => c.type === 'form').length,
          dataModelsCount: dmsArr.length,
          submissionsCount: moduleRecordCountMap.get(mSlug) || 0
        };
      });
    } catch (err) {
      this.logger.error('Error fetching custom apps for global stats', err);
    }

    // Fetch recent custom records submissions across all custom apps
    let recentSubmissions: any[] = [];
    try {
      const records = await prisma.customRecord.findMany({
        where: { tenantId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          schemaRegistry: {
            select: {
              name: true,
              slug: true,
              module: true
            }
          }
        }
      });

      recentSubmissions = records.map(r => {
        return {
          id: r.id,
          appSlug: r.schemaRegistry.module,
          appName: r.schemaRegistry.module.toUpperCase() + ' App',
          schemaSlug: r.schemaRegistry.slug,
          schemaName: r.schemaRegistry.name,
          createdAt: r.createdAt,
          data: r.data
        };
      });
    } catch (err) {
      this.logger.error('Error fetching recent submissions for global stats', err);
    }

    // Analytics Chart Data
    const submissionsByApp = customApps.map(app => ({
      appName: app.name,
      count: app.submissionsCount
    }));

    // Dynamic month grouping from actual records
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = new Map<string, number>();
    months.forEach(m => trendMap.set(m, 0));

    try {
      const allRecords = await prisma.customRecord.findMany({
        where: { tenantId },
        select: { createdAt: true }
      });
      allRecords.forEach(r => {
        const date = new Date(r.createdAt);
        const monthName = months[date.getMonth()];
        if (monthName) {
          trendMap.set(monthName, (trendMap.get(monthName) || 0) + 1);
        }
      });
    } catch (err) {
      this.logger.error('Error fetching trend records for global stats', err);
    }

    const monthlySubmissionsTrend = months.map(m => ({
      month: m,
      count: trendMap.get(m) || 0
    }));

    return {
      metrics: {
        totalRevenue,
        activeEmployees,
        totalCustomApps,
        totalCustomRecords,
        pendingInvoices,
        stockAlerts,
        totalLeads
      },
      customApps,
      recentSubmissions,
      charts: {
        submissionsByApp,
        monthlySubmissionsTrend
      }
    };
  }

  async getStats(tenantId: string) {
    const [forms, workflows, dashboards, modules, rules, imports, webPages, blogPosts, webAssets, webTemplates, webMenus, webSeo] = await Promise.all([
      prisma.builderForm.count({ where: { tenantId } }),
      prisma.builderWorkflow.count({ where: { tenantId } }),
      prisma.builderDashboard.count({ where: { tenantId } }),
      prisma.builderModule.count({ where: { tenantId } }),
      prisma.automationRule.count({ where: { tenantId } }),
      prisma.dataImportJob.count({ where: { tenantId } }),
      prisma.webPage.count({ where: { tenantId } }),
      prisma.blogPost.count({ where: { tenantId } }),
      prisma.webAsset.count({ where: { tenantId } }),
      prisma.webTemplate.count({ where: { tenantId } }),
      prisma.webMenu.count({ where: { tenantId } }),
      prisma.webSeo.count({ where: { tenantId } }),
    ]);

    const activeRules = await prisma.automationRule.count({ where: { tenantId, status: 'ACTIVE' } });
    const publishedPages = await prisma.webPage.count({ where: { tenantId, status: 'PUBLISHED' } });
    const publishedPosts = await prisma.blogPost.count({ where: { tenantId, status: 'PUBLISHED' } });

    return {
      erp: {
        forms,
        workflows,
        dashboards,
        modules,
        automationRules: rules,
        activeRules,
        dataImports: imports,
      },
      web: {
        pages: webPages,
        publishedPages,
        blogPosts,
        publishedPosts,
        assets: webAssets,
        templates: webTemplates,
        menus: webMenus,
        seo: webSeo,
      },
    };
  }

  async getRecentItems(tenantId: string) {
    const [forms, workflows, dashboards, pages, posts] = await Promise.all([
      prisma.builderForm.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, name: true, status: true, updatedAt: true }
      }),
      prisma.builderWorkflow.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, name: true, status: true, updatedAt: true }
      }),
      prisma.builderDashboard.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, name: true, status: true, updatedAt: true }
      }),
      prisma.webPage.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, name: true, status: true, updatedAt: true }
      }),
      prisma.blogPost.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { id: true, title: true, status: true, updatedAt: true }
      })
    ]);

    const mapped = [
      ...forms.map(f => ({ id: f.id, name: f.name, type: 'erp', path: `/builder/erp/forms`, status: f.status, updatedAt: f.updatedAt })),
      ...workflows.map(w => ({ id: w.id, name: w.name, type: 'erp', path: `/builder/erp/workflows`, status: w.status, updatedAt: w.updatedAt })),
      ...dashboards.map(d => ({ id: d.id, name: d.name, type: 'erp', path: `/builder/erp/dashboards`, status: d.status, updatedAt: d.updatedAt })),
      ...pages.map(p => ({ id: p.id, name: p.name, type: 'web', path: `/builder/web/pages`, status: p.status, updatedAt: p.updatedAt })),
      ...posts.map(p => ({ id: p.id, name: p.title, type: 'web', path: `/builder/web/blog-posts`, status: p.status, updatedAt: p.updatedAt }))
    ];

    mapped.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return mapped.slice(0, 6);
  }
}

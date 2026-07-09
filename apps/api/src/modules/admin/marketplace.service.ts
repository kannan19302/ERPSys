import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { BundleStoreService } from '../marketplace/bundle-store.service';
import { AppProvisioningService } from '../marketplace/app-provisioning.service';
import { VendorService } from '../marketplace/vendor.service';
import { validateManifest } from '../marketplace/manifest';
import { HEALTHCARE_BUNDLES } from '../marketplace/healthcare-bundles';
import { isUninstallable } from '../../common/module-tiers';
import { ServiceRegistryService } from '../ext-gateway/service-registry.service';
import { ExtProxyService } from '../ext-gateway/ext-proxy.service';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly bundleStore: BundleStoreService,
    private readonly provisioning: AppProvisioningService,
    private readonly vendors: VendorService,
    private readonly serviceRegistry: ServiceRegistryService,
    private readonly extProxy: ExtProxyService,
  ) {}

  // ─── App Browsing ───

  async getApps(opts: {
    category?: string;
    search?: string;
    tags?: string[];
    pricing?: string;
    featured?: boolean;
    sort?: 'popular' | 'rating' | 'newest' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
  }) {
    const { category, search, pricing, featured, sort = 'popular', page = 1, limit = 24 } = opts;
    const where: any = { status: 'PUBLISHED' };
    if (category) where.category = category;
    if (pricing) where.pricing = pricing;
    if (featured !== undefined) where.featured = featured;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { array_contains: search } },
      ];
    }

    const orderBy: any =
      sort === 'rating' ? [{ rating: 'desc' }, { reviewCount: 'desc' }] :
      sort === 'newest' ? { createdAt: 'desc' } :
      sort === 'price_asc' ? { price: 'asc' } :
      sort === 'price_desc' ? { price: 'desc' } :
      { installs: 'desc' };

    const [apps, total] = await Promise.all([
      prisma.marketplaceApp.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.marketplaceApp.count({ where }),
    ]);

    return { apps, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAppBySlug(slug: string) {
    const app = await prisma.marketplaceApp.findUnique({
      where: { slug },
      include: {
        reviews: { take: 5, orderBy: { createdAt: 'desc' } },
        changelogs: { take: 5, orderBy: { publishedAt: 'desc' } },
      },
    });
    if (!app) throw new NotFoundException('App not found');

    const ratingDistribution = await prisma.appReview.groupBy({
      by: ['rating'],
      where: { appId: app.id },
      _count: true,
    });

    const related = await prisma.marketplaceApp.findMany({
      where: { category: app.category, slug: { not: slug }, status: 'PUBLISHED' },
      orderBy: { rating: 'desc' },
      take: 4,
    });

    return {
      ...app,
      ratingDistribution: ratingDistribution.map(r => ({ rating: r.rating, count: r._count })),
      relatedApps: related,
    };
  }

  async getRelatedApps(slug: string) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug } });
    if (!app) throw new NotFoundException('App not found');
    return prisma.marketplaceApp.findMany({
      where: { category: app.category, slug: { not: slug }, status: 'PUBLISHED' },
      orderBy: { rating: 'desc' },
      take: 6,
    });
  }

  async getStats() {
    const [totalApps, totalInstalls, categories, topApps] = await Promise.all([
      prisma.marketplaceApp.count({ where: { status: 'PUBLISHED' } }),
      prisma.marketplaceApp.aggregate({ _sum: { installs: true } }),
      prisma.marketplaceApp.groupBy({ by: ['category'], where: { status: 'PUBLISHED' }, _count: true }),
      prisma.marketplaceApp.findMany({ where: { status: 'PUBLISHED' }, orderBy: { installs: 'desc' }, take: 5 }),
    ]);
    return {
      totalApps,
      totalInstalls: totalInstalls._sum.installs || 0,
      categories: categories.map(c => ({ category: c.category, count: c._count })),
      topApps,
    };
  }

  // ─── Install / Uninstall ───

  async getInstalledApps(tenantId: string) {
    return prisma.installedApp.findMany({
      where: { tenantId },
      orderBy: { installedAt: 'desc' },
    });
  }

  /**
   * Install an app into a tenant. For bundle-backed apps this fetches the published
   * bundle, extracts it into a per-tenant directory of real files, validates the
   * manifest, and provisions it into the dynamic runtime. Core in-house modules are
   * activated as a simple gating row (they are code-resident, not bundles).
   */
  async installApp(tenantId: string, appSlug: string, userId: string, _chain: string[] = []) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });
    if (!app) throw new NotFoundException('App not found');

    const appId = `marketplace:${app.id}`;

    // Auto-install prerequisites first (recursively, in dependency order). Guards
    // against missing apps and circular requires.
    const requires = Array.isArray(app.requiresApps) ? (app.requiresApps as string[]) : [];
    for (const dep of requires) {
      if (_chain.includes(dep)) continue; // cycle guard
      const depApp = await prisma.marketplaceApp.findUnique({ where: { slug: dep } });
      if (!depApp) throw new BadRequestException(`Required app "${dep}" is not available in the marketplace`);
      const depInstalled =
        (await prisma.installedApp.findFirst({ where: { tenantId, appId: `marketplace:${depApp.id}` } })) ||
        (await prisma.installedApp.findFirst({ where: { tenantId, appSlug: dep } }));
      if (!depInstalled) {
        await this.installApp(tenantId, dep, userId, [..._chain, appSlug]);
      }
    }

    // ── Core modules: code-resident, no bundle/files ──
    if (app.isCore || !app.bundleId) {
      const existing = await prisma.installedApp.findFirst({ where: { tenantId, appSlug } });
      if (existing) return existing;
      const installed = await prisma.installedApp.create({
        data: { tenantId, appId, appSlug, appName: app.name, installedVersion: app.version, status: 'ACTIVE', installedBy: userId, source: 'CATALOG', config: {} },
      });
      await prisma.marketplaceApp.update({ where: { slug: appSlug }, data: { installs: { increment: 1 } } });
      return installed;
    }

    // ── Bundle-backed apps: extract real files + provision runtime ──
    const bundle = await prisma.appBundle.findUnique({ where: { id: app.bundleId } });
    if (!bundle || bundle.status !== 'PUBLISHED') throw new BadRequestException('App has no published bundle to install');

    const archive = await this.bundleStore.getBundle(bundle.blobKey);
    const manifest = validateManifest(archive.manifest);

    // Out-of-process service apps: verify the service is reachable before
    // provisioning, so a broken install never leaves dead routes in the UI.
    let serviceConfig: any = null;
    if (manifest.runtime === 'declarative+service' && manifest.service) {
      serviceConfig = { ...manifest.service, routePrefix: manifest.service.routePrefix || manifest.slug };
      const baseUrl =
        (serviceConfig.baseUrlEnv && process.env[serviceConfig.baseUrlEnv]) ||
        process.env[`${appSlug.replace(/-/g, '_').toUpperCase()}_SERVICE_URL`] ||
        serviceConfig.defaultBaseUrl;
      if (!baseUrl) {
        throw new BadRequestException(
          `App "${appSlug}" requires its service to be deployed (set ${serviceConfig.baseUrlEnv || 'its service URL env var'})`,
        );
      }
      const healthy = await this.extProxy.healthCheck({
        appSlug, baseUrl: String(baseUrl).replace(/\/+$/, ''), scopes: serviceConfig.scopes || [],
        timeoutMs: serviceConfig.timeoutMs || 15000, healthcheck: serviceConfig.healthcheck,
      });
      if (!healthy) {
        throw new BadRequestException(
          `App "${appSlug}" service at ${baseUrl} failed its health check (${serviceConfig.healthcheck}). Start the service and retry.`,
        );
      }
    }

    // Clean any prior provisioning + files (idempotent re-install / update).
    const prior = await prisma.installedApp.findUnique({ where: { tenantId_appId: { tenantId, appId } } });
    if (prior) {
      await this.provisioning.teardown(tenantId, prior.provisioned as any);
      await this.bundleStore.removeDir(prior.installPath);
    }

    const installPath = await this.bundleStore.extractToInstallDir(tenantId, archive);
    const provisioned = await this.provisioning.provision(tenantId, manifest, app.name);

    // Preserve any prior module enable/disable choices across a re-install / update.
    const priorModules = ((prior?.config as any)?.modules || {}) as Record<string, { enabled?: boolean }>;
    const moduleMap = provisioned.moduleMap;
    for (const slug of Object.keys(moduleMap)) {
      const entry = moduleMap[slug];
      const prev = priorModules[slug];
      if (entry && prev && typeof prev.enabled === 'boolean') entry.enabled = prev.enabled;
    }
    const config = { modules: moduleMap };
    const provisionedJson = { schemaRegistryIds: provisioned.schemaRegistryIds, pageRegistryIds: provisioned.pageRegistryIds, automationRuleIds: provisioned.automationRuleIds };

    const installed = await prisma.installedApp.upsert({
      where: { tenantId_appId: { tenantId, appId } },
      update: {
        appSlug, appName: app.name, installedVersion: bundle.version, status: 'ACTIVE', installedBy: userId,
        source: 'MARKETPLACE', bundleId: bundle.id, installPath, config: config as any,
        provisioned: provisionedJson as any, serviceConfig,
      },
      create: {
        tenantId, appId, appSlug, appName: app.name, installedVersion: bundle.version, status: 'ACTIVE', installedBy: userId,
        source: 'MARKETPLACE', bundleId: bundle.id, installPath, config: config as any,
        provisioned: provisionedJson as any, serviceConfig,
      },
    });
    this.serviceRegistry?.invalidate(tenantId, appSlug);

    if (!prior) await prisma.marketplaceApp.update({ where: { slug: appSlug }, data: { installs: { increment: 1 } } });

    return { ...installed, entry: provisioned.entry, installPath, routes: provisioned.pageRegistryIds.length };
  }

  /**
   * Uninstall an app: tear down provisioned DB rows AND delete the extracted bundle
   * directory from disk in real time. Core/system apps are protected.
   */
  async uninstallApp(tenantId: string, appSlug: string) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });
    // Kernel apps (Dashboard, Admin, Studio, API Platform, SaaS, …) are locked so the
    // user always retains an admin surface to re-install everything else. Gated business
    // modules and bundle-backed industry apps may be uninstalled.
    if (app && !isUninstallable(app)) {
      throw new ForbiddenException('This is a core platform module and cannot be uninstalled');
    }

    // A tenant can hold several rows for the same app (a legacy gating row from
    // when the module was code-resident plus the marketplace-bundle row), so
    // tear down every match — otherwise uninstall leaves the app half-alive.
    const installedRows = await prisma.installedApp.findMany({
      where: { tenantId, OR: [{ appSlug }, { appId: appSlug }, ...(app ? [{ appId: `marketplace:${app.id}` }] : [])] },
    });
    if (installedRows.length === 0) throw new NotFoundException('App not installed');

    let filesRemoved = false;
    for (const installed of installedRows) {
      // Bundle apps tear down provisioned rows + files; code-resident business modules
      // simply drop the install row (data in real Prisma tables is preserved for re-install).
      if (installed.provisioned || installed.installPath) {
        try {
          if (installed.provisioned) await this.provisioning.teardown(tenantId, installed.provisioned as any);
        } finally {
          if (installed.installPath) {
            await this.bundleStore.removeDir(installed.installPath);
            filesRemoved = true;
          }
        }
      }
      await prisma.installedApp.delete({ where: { id: installed.id } });
    }
    // Ext-gateway routes for this app 404 from the next request onward.
    this.serviceRegistry?.invalidate(tenantId, appSlug);
    if (app) {
      await prisma.marketplaceApp.updateMany({ where: { slug: appSlug, installs: { gt: 0 } }, data: { installs: { decrement: 1 } } });
    }

    return { success: true, filesRemoved };
  }

  async getAppConfig(tenantId: string, appSlug: string) {
    const installed = await prisma.installedApp.findFirst({ where: { tenantId, appSlug } });
    if (!installed) throw new NotFoundException('App not installed');
    return { config: installed.config, configSchema: null };
  }

  async updateAppConfig(tenantId: string, appSlug: string, config: Record<string, any>) {
    const installed = await prisma.installedApp.findFirst({ where: { tenantId, appSlug } });
    if (!installed) throw new NotFoundException('App not installed');
    return prisma.installedApp.update({ where: { id: installed.id }, data: { config } });
  }

  // ─── Industry-app shell: modules + in-app admin console ───

  /**
   * Returns an installed app's runtime shell: its sub-modules (with enabled flags
   * from config) and the pages under each. Powers the in-app home + admin console.
   */
  async getInstalledAppModules(tenantId: string, appSlug: string) {
    const installed = await prisma.installedApp.findFirst({ where: { tenantId, appSlug } });
    if (!installed) throw new NotFoundException('App not installed');
    const listing = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });

    const cfgModules = ((installed.config as any)?.modules || {}) as Record<string, any>;
    const moduleSlugs = Object.keys(cfgModules);

    // All provisioned pages for this app (module === appSlug).
    const pages = await prisma.pageRegistry.findMany({
      where: { tenantId, module: appSlug },
      select: { slug: true, title: true, type: true },
      orderBy: { createdAt: 'asc' },
    });

    const modules = moduleSlugs.length
      ? moduleSlugs.map((slug) => ({
          slug,
          name: cfgModules[slug].name || slug,
          description: cfgModules[slug].description || null,
          icon: cfgModules[slug].icon || null,
          enabled: cfgModules[slug].enabled !== false,
          roles: (cfgModules[slug].roles || []) as string[],
          pages: (cfgModules[slug].pages || []) as { slug: string; title: string; type: string }[],
        }))
      : // Single-module app with no declared modules: expose all pages as one group.
        [{ slug: 'main', name: listing?.name || appSlug, description: null, icon: null, enabled: true, pages }];

    return {
      app: { slug: appSlug, name: listing?.name || installed.appName || appSlug, icon: listing?.icon || null, description: listing?.description || null, version: installed.installedVersion },
      modules,
    };
  }

  /**
   * Live computed metrics for an installed app's dashboards (the `kpi` widget).
   * Returns generic per-schema record counts plus a set of computed clinical/RCM
   * KPIs derived from the tenant's custom records.
   */
  async getInstalledAppMetrics(tenantId: string, appSlug: string) {
    const installed = await prisma.installedApp.findFirst({ where: { tenantId, appSlug } });
    if (!installed) throw new NotFoundException('App not installed');

    const schemas = await prisma.schemaRegistry.findMany({ where: { tenantId, module: appSlug }, select: { id: true, slug: true } });
    const metrics: Record<string, number> = {};
    const idByClean: Record<string, string> = {};
    const prefix = `${appSlug.toLowerCase()}_`;

    for (const s of schemas) {
      const clean = s.slug.startsWith(prefix) ? s.slug.slice(prefix.length) : s.slug;
      idByClean[clean] = s.id;
      metrics[`count:${clean}`] = await prisma.customRecord.count({ where: { tenantId, schemaId: s.id } });
    }

    // Load records for the entities used by computed KPIs (only those present).
    const recs = async (clean: string): Promise<any[]> => {
      const id = idByClean[clean];
      if (!id) return [];
      const rows = await prisma.customRecord.findMany({ where: { tenantId, schemaId: id }, select: { data: true } });
      return rows.map((r) => (r.data || {}) as any);
    };

    const isToday = (v: any) => { if (!v) return false; const d = new Date(v); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); };

    // Scheduling
    const appts = await recs('appointment');
    if (idByClean['appointment']) {
      metrics['todays_appointments'] = appts.filter((a) => isToday(a.start_time)).length;
      metrics['no_shows'] = appts.filter((a) => a.status === 'No Show').length;
    }
    // RCM / claims
    const claims = await recs('claim');
    if (idByClean['claim']) {
      metrics['pending_claims'] = claims.filter((c) => c.status === 'Submitted' || c.status === 'Accepted').length;
      metrics['denied_claims'] = claims.filter((c) => c.status === 'Denied').length;
    }
    const invoices = await recs('invoice');
    if (idByClean['invoice']) {
      metrics['open_invoices'] = invoices.filter((i) => i.status === 'Open' || i.status === 'Partially Paid').length;
      metrics['ar_total'] = Math.round(invoices.filter((i) => i.status !== 'Paid' && i.status !== 'Written Off').reduce((s, i) => s + (Number(i.amount) || 0), 0));
    }
    // Pharmacy low stock (Σ batch qty < drug.reorder_level)
    if (idByClean['drug'] && idByClean['stock-batch']) {
      const drugs = await recs('drug');
      const batches = await recs('stock-batch');
      const onHand: Record<string, number> = {};
      for (const b of batches) onHand[b.drug] = (onHand[b.drug] || 0) + (Number(b.quantity) || 0);
      metrics['low_stock_drugs'] = drugs.filter((d) => (onHand[d.name] || 0) < (Number(d.reorder_level) || 0)).length;
    }
    // Labs
    const labs = await recs('lab-result');
    if (idByClean['lab-result']) {
      metrics['critical_labs'] = labs.filter((l) => l.flag === 'Critical').length;
      metrics['abnormal_labs'] = labs.filter((l) => l.flag && l.flag !== 'Normal').length;
    }
    // Inpatient census / occupancy
    if (idByClean['bed']) {
      const beds = await recs('bed');
      const occ = beds.filter((b) => b.status === 'Occupied').length;
      metrics['active_inpatients'] = occ;
      metrics['bed_occupancy_pct'] = beds.length ? Math.round((occ / beds.length) * 100) : 0;
    }

    return { app: appSlug, metrics };
  }

  /** Enable/disable a sub-module from the app's in-app admin console. */
  async setModuleEnabled(tenantId: string, appSlug: string, moduleSlug: string, enabled: boolean) {
    const installed = await prisma.installedApp.findFirst({ where: { tenantId, appSlug } });
    if (!installed) throw new NotFoundException('App not installed');
    const config = (installed.config as any) || {};
    const modules = config.modules || {};
    if (!modules[moduleSlug]) throw new NotFoundException(`Module "${moduleSlug}" not found in this app`);
    modules[moduleSlug] = { ...modules[moduleSlug], enabled };
    config.modules = modules;
    await prisma.installedApp.update({ where: { id: installed.id }, data: { config } });
    return { slug: moduleSlug, enabled };
  }

  // ─── Reviews ───

  async getReviews(appSlug: string, page = 1, limit = 10) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });
    if (!app) throw new NotFoundException('App not found');

    const [reviews, total] = await Promise.all([
      prisma.appReview.findMany({
        where: { appId: app.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appReview.count({ where: { appId: app.id } }),
    ]);

    return { reviews, total, page, limit };
  }

  async createReview(appSlug: string, userId: string, userName: string, tenantId: string, data: { rating: number; title?: string; body?: string }) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });
    if (!app) throw new NotFoundException('App not found');

    const isInstalled = await prisma.installedApp.findFirst({ where: { tenantId, appSlug } });

    const review = await prisma.appReview.create({
      data: {
        appId: app.id,
        userId,
        userName,
        tenantId,
        rating: Math.min(5, Math.max(1, data.rating)),
        title: data.title || null,
        body: data.body || null,
        verifiedPurchase: !!isInstalled,
      },
    });

    const agg = await prisma.appReview.aggregate({
      where: { appId: app.id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.marketplaceApp.update({
      where: { id: app.id },
      data: {
        rating: agg._avg.rating || 0,
        reviewCount: agg._count,
      },
    });

    return review;
  }

  async updateReview(reviewId: string, userId: string, data: { rating?: number; title?: string; body?: string }) {
    const review = await prisma.appReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Cannot edit another user\'s review');

    const updated = await prisma.appReview.update({
      where: { id: reviewId },
      data: {
        ...(data.rating !== undefined && { rating: Math.min(5, Math.max(1, data.rating)) }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.body !== undefined && { body: data.body }),
      },
    });

    const agg = await prisma.appReview.aggregate({
      where: { appId: review.appId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.marketplaceApp.update({
      where: { id: review.appId },
      data: { rating: agg._avg.rating || 0, reviewCount: agg._count },
    });

    return updated;
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await prisma.appReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Cannot delete another user\'s review');

    await prisma.appReview.delete({ where: { id: reviewId } });

    const agg = await prisma.appReview.aggregate({
      where: { appId: review.appId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.marketplaceApp.update({
      where: { id: review.appId },
      data: { rating: agg._avg.rating || 0, reviewCount: agg._count },
    });

    return { success: true };
  }

  async markReviewHelpful(reviewId: string) {
    const review = await prisma.appReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    return prisma.appReview.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
    });
  }

  // ─── Changelogs ───

  async getChangelogs(appSlug: string) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });
    if (!app) throw new NotFoundException('App not found');
    return prisma.appChangelog.findMany({
      where: { appId: app.id },
      orderBy: { publishedAt: 'desc' },
    });
  }

  // ─── Collections ───

  async getCollections() {
    return prisma.appCollection.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: { app: true },
          take: 8,
        },
      },
    });
  }

  async getCollectionBySlug(slug: string) {
    const collection = await prisma.appCollection.findUnique({
      where: { slug },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: { app: true },
        },
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async createCollection(data: { name: string; slug: string; description?: string; icon?: string; coverImage?: string; featured?: boolean }) {
    return prisma.appCollection.create({ data });
  }

  async updateCollection(id: string, data: { name?: string; description?: string; icon?: string; coverImage?: string; featured?: boolean; sortOrder?: number }) {
    return prisma.appCollection.update({ where: { id }, data });
  }

  async deleteCollection(id: string) {
    await prisma.appCollection.delete({ where: { id } });
    return { success: true };
  }

  async addAppToCollection(collectionId: string, appId: string, sortOrder = 0) {
    return prisma.appCollectionItem.create({
      data: { collectionId, appId, sortOrder },
    });
  }

  async removeAppFromCollection(collectionId: string, appId: string) {
    await prisma.appCollectionItem.deleteMany({
      where: { collectionId, appId },
    });
    return { success: true };
  }

  // ─── Favorites ───

  async getFavorites(userId: string) {
    return prisma.appFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { app: true },
    });
  }

  async addFavorite(userId: string, tenantId: string, appSlug: string) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });
    if (!app) throw new NotFoundException('App not found');
    try {
      return await prisma.appFavorite.create({
        data: { userId, tenantId, appId: app.id },
      });
    } catch {
      return { alreadyFavorited: true };
    }
  }

  async removeFavorite(userId: string, appSlug: string) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });
    if (!app) throw new NotFoundException('App not found');
    await prisma.appFavorite.deleteMany({ where: { userId, appId: app.id } });
    return { success: true };
  }

  // ─── Submissions ───

  async getSubmissions(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return prisma.appSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubmission(tenantId: string, submittedBy: string, submitterName: string, data: {
    name: string; slug: string; description: string; longDescription?: string;
    category: string; icon?: string; version?: string; pricing?: string;
    price?: number; features?: any[]; screenshots?: any[]; tags?: string[];
    supportUrl?: string;
  }) {
    const existing = await prisma.marketplaceApp.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('An app with this slug already exists');

    return prisma.appSubmission.create({
      data: {
        tenantId,
        submittedBy,
        submitterName,
        name: data.name,
        slug: data.slug,
        description: data.description,
        longDescription: data.longDescription,
        category: data.category,
        icon: data.icon,
        version: data.version || '1.0.0',
        pricing: data.pricing || 'FREE',
        price: data.price,
        features: data.features || [],
        screenshots: data.screenshots || [],
        tags: data.tags || [],
        supportUrl: data.supportUrl,
      },
    });
  }

  async approveSubmission(id: string, reviewedBy: string) {
    const submission = await prisma.appSubmission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status !== 'PENDING') throw new ConflictException('Submission already reviewed');

    const app = await prisma.marketplaceApp.create({
      data: {
        slug: submission.slug,
        name: submission.name,
        description: submission.description,
        longDescription: submission.longDescription,
        category: submission.category,
        icon: submission.icon,
        version: submission.version,
        pricing: submission.pricing,
        price: submission.price,
        features: submission.features as any,
        screenshots: submission.screenshots as any,
        tags: submission.tags as any,
        supportUrl: submission.supportUrl,
        publisher: submission.submitterName,
        status: 'PUBLISHED',
      },
    });

    await prisma.appSubmission.update({
      where: { id },
      data: { status: 'APPROVED', reviewedBy, reviewedAt: new Date() },
    });

    return app;
  }

  async rejectSubmission(id: string, reviewedBy: string, reviewNotes: string) {
    const submission = await prisma.appSubmission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status !== 'PENDING') throw new ConflictException('Submission already reviewed');

    return prisma.appSubmission.update({
      where: { id },
      data: { status: 'REJECTED', reviewedBy, reviewedAt: new Date(), reviewNotes },
    });
  }

  // ─── Seed Data ───

  async seedDefaultApps() {
    const systemApps = [
      {
        slug: 'dashboard', name: 'Dashboard',
        description: 'Overview of key metrics and KPIs across all modules.',
        longDescription: 'The UniERP Dashboard provides a centralized overview of your entire business. Access real-time widgets, key performance indicators (KPIs), and critical notifications in one place. Customize layout widgets for finance, HR, inventory, and sales to keep your finger on the pulse of your operations.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Real-time KPI cards', 'Activity feed monitoring', 'Custom widget layout', 'In-app notification center'],
        tags: ['dashboard', 'home', 'overview', 'kpi'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'finance', name: 'Finance & Accounting',
        description: 'Double-entry bookkeeping, ledger, invoices, payments, and financial reporting.',
        longDescription: 'Manage your company\'s financial health with our comprehensive double-entry accounting engine. Features include accounts receivable, accounts payable, general ledger posting, bank reconciliation, multi-currency transactions, and real-time generation of balance sheets, profit & loss statements, and tax returns.',
        category: 'Finance', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Double-entry bookkeeping', 'General Ledger', 'Invoices & Payments', 'Financial statements (P&L, Balance Sheet)'],
        tags: ['finance', 'accounting', 'ledger', 'invoice', 'payments'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'hr', name: 'Human Resources',
        description: 'Employee directory, department structures, leave management, and attendance.',
        longDescription: 'Streamline employee lifecycle management and operations. Keep a centralized directory of employee records, contracts, departments, and roles. Manage leave requests, shift calendars, holidays, and attendance tracking seamlessly integrated with payroll processing.',
        category: 'HR', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Employee directory', 'Org chart & department hierarchy', 'Leave management workflow', 'Attendance tracking'],
        tags: ['hr', 'employees', 'leaves', 'attendance', 'people'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'crm', name: 'CRM & Sales',
        description: 'Customer profiles, lead tracking, opportunities, and pipeline management.',
        longDescription: 'Empower your sales team to close more deals. Manage customer registers, log contact details, track sales leads, and manage pipelines through multiple custom stages. Leverage interaction logging (calls, emails, meetings) to build strong customer relationships.',
        category: 'Sales', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Customer & contact management', 'Lead intake and scoring', 'Opportunity pipeline management', 'Activity tracking (meetings, calls)'],
        tags: ['crm', 'sales', 'leads', 'pipeline', 'customers'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'inventory', name: 'Inventory & Stock',
        description: 'Warehouse locations, product catalogs, stock valuation, and serial/batch tracking.',
        longDescription: 'Take control of your physical stock levels. Define warehouses with bin locations, track product units of measurement, configure automatic reorder thresholds, and trace inventory movements with FIFO, LIFO, or moving average valuation.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Multi-warehouse management', 'SKU & barcode catalog', 'Stock movements & ledger', 'Reorder level automation'],
        tags: ['inventory', 'stock', 'warehouse', 'products', 'sku'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'procurement', name: 'Procurement',
        description: 'Vendor registry, RFQs, purchase orders, and goods receipts.',
        longDescription: 'Manage the procure-to-pay workflow easily. Register vendors and track performance. Raise Requests for Quotations (RFQs), issue Purchase Orders (POs), and record Goods Receipt Notes (GRN) to automatically update warehouse inventory levels.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Vendor management', 'Request for Quotation (RFQ)', 'Purchase Order generation', 'Goods Receipt Notes (GRN)'],
        tags: ['procurement', 'purchase', 'vendors', 'po', 'goods-receipt'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'sales', name: 'Sales & Orders',
        description: 'Quotations, sales orders, delivery notes, and invoicing workflows.',
        longDescription: 'Complete your order-to-cash lifecycle efficiently. Generate and email quotes to clients, convert approved quotes to Sales Orders, issue Delivery Notes to logistics, and trigger invoice creation automatically upon delivery.',
        category: 'Sales', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Client quotations', 'Sales Orders pipeline', 'Delivery Notes', 'Auto invoice creation'],
        tags: ['sales', 'orders', 'quotations', 'billing', 'delivery'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'supply-chain', name: 'Supply Chain',
        description: 'Shipment tracking, carrier management, and demand forecasting.',
        longDescription: 'Optimize distribution and logistics pipelines. Monitor outbound shipments, assign carriers, calculate logistics rates, and leverage historical demand data to forecast future inventory stocking requirements.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Outbound shipment tracking', 'Logistics carrier registry', 'Shipping cost calculations', 'Demand forecasting models'],
        tags: ['shipping', 'supply-chain', 'logistics', 'carriers', 'forecasting'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'projects', name: 'Project Management',
        description: 'Projects, tasks, Gantt charts, timesheets, and budget monitoring.',
        longDescription: 'Track time-bound operations and client services. Create projects with milestones and tasks. Plan visual schedules using Gantt charts, record employee work hours on timesheets, and manage actual vs. budgeted project costs.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Project milestones & tasks', 'Interactive Gantt charts', 'Employee timesheets', 'Budget & cost tracking'],
        tags: ['projects', 'tasks', 'gantt', 'timesheets', 'budgeting'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'manufacturing', name: 'Manufacturing',
        description: 'Bill of Materials (BOM), work orders, production routing, and MRP.',
        longDescription: 'Plan and execute raw material conversion workflows. Define multi-level Bills of Materials (BOM), set up workstations and resource capacity, issue Work Orders, and run Manufacturing Resource Planning (MRP) calculations to generate purchase requisitions.',
        category: 'Manufacturing', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Bill of Materials (BOM)', 'Workstation & capacity planning', 'Work Order routing', 'MRP calculations'],
        tags: ['manufacturing', 'mrp', 'bom', 'production', 'workstations'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'analytics', name: 'Business Intelligence',
        description: 'Custom reporting, pivots, visual dashboards, and automated exports.',
        longDescription: 'Unlock hidden potential in your database. Construct visual charts and dashboards via a drag-and-drop builder, build custom spreadsheet-like pivot tables, and schedule reports to be automatically emailed in PDF or CSV formats.',
        category: 'Analytics', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Drag-and-drop dashboard widgets', 'Pivot table matrices', 'Query builder filters', 'Scheduled email exports (PDF/CSV)'],
        tags: ['analytics', 'reporting', 'bi', 'dashboards', 'charts'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'drive', name: 'Drive',
        description: 'Centralized document library, folder sharing, and version control.',
        longDescription: 'Manage files and compliance documentation in a unified workspace. Organize documents in hierarchies, customize permissions per folder, view version histories, and share time-expiring external links safely.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['File & folder structure', 'Version history tracking', 'Expiring share links', 'Access permissions control'],
        tags: ['drive', 'storage', 'files', 'documents', 'sharing'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'communication', name: 'Connect',
        description: 'Internal messaging spaces, group chat, calendar, and meetings.',
        longDescription: 'Bridge internal collaboration gaps. Join discussion channels, start thread replies, send direct messages (DMs), schedule company-wide calendars, and launch unified meetings directly from your ERP dashboard.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Chat spaces & channels', 'Direct messaging & threads', 'Company-wide calendar', 'Web meetings integration'],
        tags: ['connect', 'chat', 'messaging', 'calendar', 'collaboration'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'pos', name: 'POS & Retail',
        description: 'Point-of-Sale terminal checkout, registers, barcode scanners, and shifts.',
        longDescription: 'Run physical retail frontends with ease. Launch retail terminals, scan product barcodes, manage cash register draw limits, track employee register shifts, print receipts, and sync inventory counts in real-time.',
        category: 'Sales', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Retail checkout interface', 'Barcode scanning support', 'Cash register drawer control', 'Shift management'],
        tags: ['pos', 'retail', 'terminal', 'checkout', 'billing'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'api-keys', name: 'API Platform',
        description: 'Developer public keys, webhooks subscriptions, and rate limiting.',
        longDescription: 'Integrate external tools with the UniERP API ecosystem. Developers can create public API keys, configure event webhook subscriptions (e.g. order.created, invoice.paid), and monitor rate limits and webhook delivery logs.',
        category: 'AI & Automation', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['API key generation & rotation', 'Webhooks subscriptions manager', 'Webhook delivery logging', 'Rate limit rules config'],
        tags: ['api', 'webhooks', 'developer', 'integrations'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'saas', name: 'SaaS Portal',
        description: 'SaaS tenant subscription billing, plans, and resource utilization counters.',
        longDescription: 'For SaaS deployments: manage billing, upgrade or downgrade pricing packages, review active Stripe subscription statuses, and monitor resource usage counters (users count, storage MB, api calls count).',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Billing subscription status', 'Usage metrics monitoring', 'Plan upgrades & options'],
        tags: ['saas', 'billing', 'subscription', 'usage', 'stripe'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'admin', name: 'Admin Console',
        description: 'RBAC authorization, workflow builders, system logging, and settings.',
        longDescription: 'Central command for your ERP instance. Configure tenants, manage users, assign security roles and permissions, construct approval workflows, view system logs, verify data backups, and customize look-and-feel branding.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['User & role RBAC matrix', 'Workflow approval engines', 'System configurations', 'Audit log registries'],
        tags: ['admin', 'settings', 'security', 'backup', 'rbac'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
      {
        slug: 'builder', name: 'Studio',
        description: 'No-code visual page builder, schema creator, and CMS designer.',
        longDescription: 'Empower non-technical users to build custom modules. Visually design forms and layouts using a drag-and-drop editor, construct new database tables, define relationships, and deploy custom pages instantly without writing code.',
        category: 'AI & Automation', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true, featured: false,
        features: ['Visual form layout editor', 'Dynamic schema architect', 'Page registry deployments', 'No-code workflows'],
        tags: ['builder', 'no-code', 'studio', 'pages', 'forms'],
        screenshots: [],
        metadata: { isSystem: true }, isCore: true,
      },
    ];

    // Core in-house modules only. Third-party apps now come from published bundles
    // (see the Healthcare vertical below + the vendor publishing pipeline).
    const apps = [...systemApps];
    for (const appData of apps) {
      const d = appData as any;
      await prisma.marketplaceApp.upsert({
        where: { slug: d.slug },
        update: {
          name: d.name,
          description: d.description,
          longDescription: d.longDescription,
          category: d.category,
          publisher: d.publisher,
          version: d.version,
          pricing: d.pricing,
          price: d.price,
          rating: d.rating,
          verified: d.verified,
          featured: d.featured,
          features: d.features as any,
          tags: d.tags as any,
          metadata: d.metadata as any,
          isCore: d.isCore ?? false,
        },
        create: d,
      });
    }

    // ── Publish the Healthcare vertical as real third-party bundles ──
    const healthtech = await this.vendors.ensureVendor('healthtech', {
      name: 'HealthTech', description: 'Healthcare applications for clinics and hospitals.', websiteUrl: 'https://healthtech.example', verified: true,
    });
    for (const manifest of HEALTHCARE_BUNDLES) {
      await this.vendors.seedPublishedApp(
        { id: healthtech.id, slug: healthtech.slug, name: healthtech.name, websiteUrl: healthtech.websiteUrl, verified: healthtech.verified },
        manifest,
      );
    }

    // Auto-install seeded system apps for all existing tenants
    const tenants = await prisma.tenant.findMany();
    const systemSlugs = [
      'dashboard', 'finance', 'hr', 'crm', 'inventory', 'procurement',
      'sales', 'supply-chain', 'projects', 'manufacturing', 'analytics',
      'drive', 'communication', 'pos', 'api-keys', 'saas', 'admin', 'builder'
    ];
    const dbSystemApps = await prisma.marketplaceApp.findMany({
      where: { slug: { in: systemSlugs } }
    });

    for (const tenant of tenants) {
      for (const app of dbSystemApps) {
        await prisma.installedApp.upsert({
          where: {
            tenantId_appId: {
              tenantId: tenant.id,
              appId: app.slug,
            },
          },
          update: {
            appSlug: app.slug,
            appName: app.name,
            installedVersion: app.version,
            status: 'ACTIVE',
          },
          create: {
            tenantId: tenant.id,
            appId: app.slug,
            appSlug: app.slug,
            appName: app.name,
            installedVersion: app.version,
            status: 'ACTIVE',
          },
        });
      }
    }

    return { message: `Seeded ${apps.length} core modules and ${HEALTHCARE_BUNDLES.length} healthcare apps (published as bundles)` };
  }
}

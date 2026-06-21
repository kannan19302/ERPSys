import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class MarketplaceService {
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
    const { category, search, tags, pricing, featured, sort = 'popular', page = 1, limit = 24 } = opts;
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

  async installApp(tenantId: string, appSlug: string, userId: string) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });
    if (!app) throw new NotFoundException('App not found');

    const existing = await prisma.installedApp.findFirst({
      where: { tenantId, appSlug },
    });
    if (existing) return existing;

    const installed = await prisma.installedApp.create({
      data: {
        tenantId,
        appId: app.id,
        appSlug,
        appName: app.name,
        installedVersion: app.version,
        status: 'ACTIVE',
        installedBy: userId,
        config: {},
      },
    });

    await prisma.marketplaceApp.update({
      where: { slug: appSlug },
      data: { installs: { increment: 1 } },
    });

    return installed;
  }

  async uninstallApp(tenantId: string, appSlug: string) {
    const installed = await prisma.installedApp.findFirst({
      where: { tenantId, appSlug },
    });
    if (!installed) throw new NotFoundException('App not installed');

    await prisma.installedApp.delete({ where: { id: installed.id } });
    await prisma.marketplaceApp.update({
      where: { slug: appSlug },
      data: { installs: { decrement: 1 } },
    });

    return { success: true };
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
    const count = await prisma.marketplaceApp.count();
    if (count > 0) return { message: 'Apps already seeded', count };

    const apps = [
      {
        slug: 'advanced-analytics', name: 'Advanced Analytics',
        description: 'Interactive dashboards with pivot tables, trend analysis, and custom KPI tracking.',
        longDescription: 'Transform your raw data into actionable insights with Advanced Analytics. Build interactive dashboards featuring pivot tables, drill-down analysis, and custom KPI tracking. Supports scheduled report generation with PDF/Excel export, automated email distribution, and role-based dashboard sharing.\n\nIncludes 50+ pre-built chart types, custom formula builder, and real-time data refresh. Connect to multiple data sources and create cross-module reports that span finance, HR, inventory, and sales.',
        category: 'Analytics', publisher: 'UniERP', version: '2.1.0', pricing: 'FREE', rating: 4.8, installs: 1250, verified: true, featured: true,
        features: ['Pivot tables & drill-down', 'Custom KPI dashboards', 'Scheduled PDF/Excel reports', 'Real-time data refresh', '50+ chart types', 'Role-based sharing', 'Formula builder', 'Email distribution'],
        tags: ['analytics', 'reporting', 'dashboard', 'kpi', 'charts'],
        screenshots: [
          { url: '/assets/marketplace/analytics-dashboard.png', caption: 'Main analytics dashboard with KPI cards' },
          { url: '/assets/marketplace/analytics-pivot.png', caption: 'Interactive pivot table builder' },
          { url: '/assets/marketplace/analytics-charts.png', caption: 'Custom chart configuration' },
        ],
      },
      {
        slug: 'ai-document-ocr', name: 'AI Document OCR',
        description: 'Automatically extract data from invoices, receipts, and purchase orders using AI-powered OCR.',
        longDescription: 'Eliminate manual data entry with AI-powered document recognition. Simply upload or scan invoices, receipts, purchase orders, and bills — the OCR engine extracts vendor details, line items, amounts, tax, and dates with 99%+ accuracy.\n\nSupports 40+ languages, handwritten text recognition, and batch processing. Extracted data auto-populates your finance module with suggested GL codes based on historical patterns.',
        category: 'AI & Automation', publisher: 'UniERP', version: '1.5.0', pricing: 'PAID', price: 29.99, rating: 4.6, installs: 890, verified: true,
        features: ['Invoice & receipt scanning', 'PO data extraction', 'Handwriting recognition', '40+ languages', 'Batch processing', 'Auto GL code suggestion', 'API integration', 'Audit trail'],
        tags: ['ai', 'ocr', 'automation', 'invoices', 'document-processing'],
        screenshots: [
          { url: '/assets/marketplace/ocr-upload.png', caption: 'Document upload and scanning interface' },
          { url: '/assets/marketplace/ocr-extract.png', caption: 'Extracted data with confidence scores' },
        ],
      },
      {
        slug: 'payroll-engine', name: 'Payroll Processing Engine',
        description: 'Full payroll calculation with tax tables, deductions, benefits, and multi-country compliance.',
        longDescription: 'Complete payroll management supporting complex salary structures, tax computation, statutory deductions, and benefits administration. Process payroll for unlimited employees across multiple pay frequencies (weekly, bi-weekly, monthly).\n\nIncludes pre-built tax tables for 15+ countries, automatic statutory compliance updates, employee self-service payslip portal, and integration with banking for direct deposits. Supports retro-pay calculations, bonuses, commissions, and overtime rules.',
        category: 'HR', publisher: 'UniERP', version: '3.0.0', pricing: 'PAID', price: 49.99, rating: 4.9, installs: 2100, verified: true, featured: true,
        features: ['Multi-country tax tables', 'Benefits administration', 'Payslip generation', 'Direct deposit integration', 'Retro-pay calculation', 'Overtime rules engine', 'Employee self-service', 'Statutory compliance'],
        tags: ['payroll', 'hr', 'tax', 'benefits', 'salary'],
        screenshots: [
          { url: '/assets/marketplace/payroll-run.png', caption: 'Payroll processing dashboard' },
          { url: '/assets/marketplace/payroll-payslip.png', caption: 'Employee payslip template' },
          { url: '/assets/marketplace/payroll-tax.png', caption: 'Tax configuration panel' },
        ],
      },
      {
        slug: 'ecommerce-connector', name: 'E-Commerce Connector',
        description: 'Sync products, orders, and inventory with Shopify, WooCommerce, and Amazon.',
        longDescription: 'Seamlessly connect your ERP with major e-commerce platforms. Bi-directional sync keeps products, inventory levels, pricing, and orders in perfect alignment. Supports Shopify, WooCommerce, Amazon Seller Central, and Magento.\n\nReal-time webhook-driven updates ensure stock levels are always accurate across all channels. Automatic order import, fulfillment status sync, and returns processing reduce manual work by 90%.',
        category: 'Integrations', publisher: 'Community', version: '1.8.0', pricing: 'FREE', rating: 4.3, installs: 650,
        features: ['Shopify sync', 'WooCommerce sync', 'Amazon FBA integration', 'Real-time inventory', 'Order auto-import', 'Fulfillment sync', 'Multi-channel pricing', 'Returns processing'],
        tags: ['ecommerce', 'shopify', 'woocommerce', 'amazon', 'integration'],
        screenshots: [
          { url: '/assets/marketplace/ecom-channels.png', caption: 'Connected sales channels overview' },
          { url: '/assets/marketplace/ecom-sync.png', caption: 'Sync status and history' },
        ],
      },
      {
        slug: 'project-management', name: 'Project Management Pro',
        description: 'Gantt charts, kanban boards, time tracking, and resource allocation for project teams.',
        longDescription: 'Enterprise project management with interactive Gantt charts, drag-and-drop kanban boards, built-in time tracking, and intelligent resource allocation. Create project templates, manage dependencies, track milestones, and generate progress reports.\n\nIncludes project budgeting with actual vs. planned cost tracking, risk registers, and automated notifications for overdue tasks. Integrates with HR for resource availability and Finance for project billing.',
        category: 'Operations', publisher: 'UniERP', version: '2.3.0', pricing: 'FREE', rating: 4.7, installs: 1800, verified: true,
        features: ['Interactive Gantt charts', 'Kanban boards', 'Time tracking', 'Resource allocation', 'Budget tracking', 'Risk registers', 'Project templates', 'Milestone tracking'],
        tags: ['project', 'management', 'gantt', 'kanban', 'time-tracking'],
        screenshots: [
          { url: '/assets/marketplace/project-gantt.png', caption: 'Interactive Gantt chart with dependencies' },
          { url: '/assets/marketplace/project-kanban.png', caption: 'Kanban board view' },
          { url: '/assets/marketplace/project-dashboard.png', caption: 'Project portfolio dashboard' },
        ],
      },
      {
        slug: 'quality-control', name: 'Quality Control & Inspection',
        description: 'Inspection checklists, non-conformance tracking, and quality metrics for manufacturing.',
        longDescription: 'ISO-compliant quality management with configurable inspection checklists, automated sampling plans, and statistical process control (SPC) charts. Track non-conformance reports (NCRs), corrective/preventive actions (CAPA), and supplier quality ratings.\n\nIntegrates with manufacturing for in-line quality gates and with procurement for incoming material inspection. Supports barcode-driven inspections on mobile devices.',
        category: 'Manufacturing', publisher: 'UniERP', version: '1.2.0', pricing: 'PAID', price: 19.99, rating: 4.4, installs: 420, verified: true,
        features: ['Inspection checklists', 'NCR tracking', 'SPC charts', 'CAPA management', 'Sampling plans', 'Supplier quality', 'Mobile inspections', 'ISO compliance'],
        tags: ['quality', 'manufacturing', 'inspection', 'iso', 'spc'],
        screenshots: [
          { url: '/assets/marketplace/qc-checklist.png', caption: 'Inspection checklist builder' },
          { url: '/assets/marketplace/qc-spc.png', caption: 'Statistical process control charts' },
        ],
      },
      {
        slug: 'fleet-management', name: 'Fleet Management',
        description: 'Vehicle tracking, maintenance scheduling, fuel monitoring, and driver management.',
        longDescription: 'Complete fleet operations management with GPS vehicle tracking, preventive maintenance scheduling, fuel consumption analytics, and driver performance scoring. Track vehicle utilization, insurance renewals, and registration compliance.\n\nIncludes route optimization, trip logging, and cost-per-kilometer analysis. Mobile app for drivers to log trips, fuel stops, and report issues.',
        category: 'Operations', publisher: 'Community', version: '1.0.0', pricing: 'FREE', rating: 4.1, installs: 310,
        features: ['GPS tracking', 'Maintenance alerts', 'Fuel logs', 'Driver management', 'Route optimization', 'Cost analysis', 'Compliance tracking', 'Mobile driver app'],
        tags: ['fleet', 'vehicles', 'logistics', 'gps', 'maintenance'],
        screenshots: [
          { url: '/assets/marketplace/fleet-map.png', caption: 'Live fleet tracking map' },
          { url: '/assets/marketplace/fleet-maintenance.png', caption: 'Maintenance schedule calendar' },
        ],
      },
      {
        slug: 'expense-management', name: 'Expense Management',
        description: 'Employee expense claims, receipt capture, approval workflows, and reimbursement tracking.',
        longDescription: 'Streamline employee expense management from submission to reimbursement. Employees photograph receipts, categorize expenses, and submit claims from web or mobile. Configurable approval workflows route claims through managers with policy violation alerts.\n\nAutomatic per-diem calculations, mileage tracking, credit card reconciliation, and multi-currency support. Integrates with Finance for GL posting and Payroll for reimbursement.',
        category: 'Finance', publisher: 'UniERP', version: '2.0.0', pricing: 'FREE', rating: 4.5, installs: 1500, verified: true,
        features: ['Receipt capture', 'Approval workflow', 'Policy enforcement', 'Per-diem calculator', 'Mileage tracking', 'Credit card reconciliation', 'Multi-currency', 'GL integration'],
        tags: ['expense', 'finance', 'reimbursement', 'claims', 'receipts'],
        screenshots: [
          { url: '/assets/marketplace/expense-submit.png', caption: 'Expense claim submission form' },
          { url: '/assets/marketplace/expense-approval.png', caption: 'Approval workflow dashboard' },
        ],
      },
      {
        slug: 'asset-management', name: 'Fixed Asset Management',
        description: 'Asset lifecycle tracking, depreciation calculation, maintenance scheduling, and disposal management.',
        longDescription: 'Track fixed assets from acquisition through disposal with automated depreciation calculations (straight-line, declining balance, units of production). Maintain asset registers with barcode/QR code tracking, location management, and custody assignment.\n\nIncludes asset maintenance scheduling, insurance tracking, revaluation support, and disposal/write-off workflows. Generates statutory depreciation reports and integrates with Finance for GL entries.',
        category: 'Finance', publisher: 'UniERP', version: '1.6.0', pricing: 'PAID', price: 24.99, rating: 4.6, installs: 780, verified: true,
        features: ['Depreciation calculation', 'Barcode tracking', 'Maintenance schedule', 'Location management', 'Custody tracking', 'Insurance management', 'Disposal workflows', 'Statutory reports'],
        tags: ['assets', 'finance', 'depreciation', 'maintenance', 'barcode'],
        screenshots: [
          { url: '/assets/marketplace/asset-register.png', caption: 'Asset register with filters' },
          { url: '/assets/marketplace/asset-depreciation.png', caption: 'Depreciation schedule view' },
        ],
      },
      {
        slug: 'bi-connector', name: 'BI Connector (Power BI / Tableau)',
        description: 'Connect your ERP data to Power BI, Tableau, or Looker for advanced business intelligence.',
        longDescription: 'Enterprise BI integration that exposes your ERP data through optimized connectors for Power BI, Tableau, Looker, and Google Data Studio. Pre-built data models and semantic layers ensure consistent metrics across all BI tools.\n\nSupports real-time data streaming, incremental refresh, and row-level security. Includes 20+ pre-built report templates for common ERP metrics that can be imported directly into your BI tool.',
        category: 'Analytics', publisher: 'UniERP', version: '1.3.0', pricing: 'PAID', price: 39.99, rating: 4.7, installs: 560, verified: true,
        features: ['Power BI connector', 'Tableau connector', 'Looker connector', 'Real-time sync', 'Semantic layer', 'Row-level security', 'Pre-built templates', 'Incremental refresh'],
        tags: ['bi', 'powerbi', 'tableau', 'looker', 'analytics', 'reporting'],
        screenshots: [
          { url: '/assets/marketplace/bi-setup.png', caption: 'Connector setup wizard' },
          { url: '/assets/marketplace/bi-templates.png', caption: 'Pre-built report templates' },
        ],
      },
      {
        slug: 'multi-currency', name: 'Multi-Currency & FX',
        description: 'Real-time exchange rates, multi-currency invoicing, and automatic FX gain/loss calculation.',
        longDescription: 'Handle international business with confidence using real-time exchange rates from multiple providers (ECB, Fixer, Open Exchange Rates). Issue invoices, purchase orders, and payments in any currency with automatic conversion.\n\nAutomatic FX gain/loss calculation on settlements, revaluation reports for month-end closing, and historical rate lookups. Supports over 170 currencies with configurable rate sources and rounding rules.',
        category: 'Finance', publisher: 'UniERP', version: '2.2.0', pricing: 'FREE', rating: 4.8, installs: 1900, verified: true, featured: true,
        features: ['Real-time rates', 'Auto conversion', 'FX gain/loss', '170+ currencies', 'Revaluation reports', 'Multiple rate sources', 'Historical lookups', 'Rounding rules'],
        tags: ['currency', 'forex', 'finance', 'international', 'exchange-rates'],
        screenshots: [
          { url: '/assets/marketplace/fx-rates.png', caption: 'Live exchange rate monitor' },
          { url: '/assets/marketplace/fx-revaluation.png', caption: 'Month-end revaluation report' },
        ],
      },
      {
        slug: 'crm-email-campaigns', name: 'Email Campaign Manager',
        description: 'Create, schedule, and track email marketing campaigns with templates, A/B testing, and analytics.',
        longDescription: 'Professional email marketing integrated with your CRM contacts. Build beautiful emails using the drag-and-drop template builder, segment audiences based on CRM data, and schedule campaigns with timezone optimization.\n\nA/B testing for subject lines and content, real-time open/click tracking, bounce management, and GDPR-compliant unsubscribe handling. Campaign performance reports with revenue attribution.',
        category: 'Sales', publisher: 'Community', version: '1.4.0', pricing: 'FREEMIUM', rating: 4.2, installs: 720,
        features: ['Drag-and-drop builder', 'A/B testing', 'Campaign analytics', 'Audience segmentation', 'Timezone scheduling', 'Bounce management', 'GDPR compliance', 'Revenue attribution'],
        tags: ['email', 'marketing', 'campaigns', 'crm', 'automation'],
        screenshots: [
          { url: '/assets/marketplace/email-builder.png', caption: 'Email template builder' },
          { url: '/assets/marketplace/email-analytics.png', caption: 'Campaign performance dashboard' },
        ],
      },
      // ─── Additional apps to reach 30+ ───
      {
        slug: 'warehouse-management', name: 'Warehouse Management System',
        description: 'Bin locations, pick/pack/ship workflows, barcode scanning, and wave planning.',
        longDescription: 'Advanced warehouse operations with configurable bin locations, zone management, and multi-warehouse support. Optimize pick paths with wave planning, batch picking, and zone picking strategies.\n\nBarcode and RFID scanning integration for receiving, put-away, picking, packing, and shipping. Real-time inventory visibility with cycle counting and automated replenishment triggers.',
        category: 'Operations', publisher: 'UniERP', version: '2.0.0', pricing: 'PAID', price: 34.99, rating: 4.7, installs: 920, verified: true,
        features: ['Bin location management', 'Pick/pack/ship', 'Barcode scanning', 'Wave planning', 'Cycle counting', 'Multi-warehouse', 'Replenishment rules', 'RFID support'],
        tags: ['warehouse', 'wms', 'inventory', 'barcode', 'logistics'],
        screenshots: [
          { url: '/assets/marketplace/wms-layout.png', caption: 'Warehouse layout designer' },
          { url: '/assets/marketplace/wms-picking.png', caption: 'Pick list with barcode scanning' },
        ],
      },
      {
        slug: 'contract-management', name: 'Contract Lifecycle Management',
        description: 'Contract creation, negotiation tracking, e-signatures, and renewal alerts.',
        longDescription: 'Manage the entire contract lifecycle from creation through renewal or termination. Template-based contract generation with clause libraries, version tracking, and redline comparison.\n\nIntegrated e-signature workflows, obligation tracking, milestone alerts, and automated renewal notifications. Full audit trail with approval history and compliance reporting.',
        category: 'Operations', publisher: 'UniERP', version: '1.4.0', pricing: 'PAID', price: 29.99, rating: 4.5, installs: 540, verified: true,
        features: ['Contract templates', 'Clause library', 'E-signature integration', 'Renewal alerts', 'Version comparison', 'Obligation tracking', 'Approval workflows', 'Compliance reports'],
        tags: ['contracts', 'legal', 'e-signature', 'compliance', 'clm'],
        screenshots: [
          { url: '/assets/marketplace/clm-editor.png', caption: 'Contract editor with clause library' },
          { url: '/assets/marketplace/clm-timeline.png', caption: 'Contract lifecycle timeline' },
        ],
      },
      {
        slug: 'helpdesk-support', name: 'Helpdesk & Support Tickets',
        description: 'Customer support tickets, SLA management, knowledge base, and customer portal.',
        longDescription: 'Full-featured helpdesk with multi-channel ticket intake (email, web form, API), automated routing, SLA tracking, and escalation rules. Built-in knowledge base with article versioning and search.\n\nCustomer self-service portal for ticket submission, status tracking, and knowledge base access. Agent dashboard with workload balancing, canned responses, and performance analytics.',
        category: 'Operations', publisher: 'UniERP', version: '1.8.0', pricing: 'FREE', rating: 4.6, installs: 1100, verified: true,
        features: ['Multi-channel intake', 'SLA tracking', 'Knowledge base', 'Customer portal', 'Auto-routing', 'Escalation rules', 'Canned responses', 'Agent analytics'],
        tags: ['helpdesk', 'support', 'tickets', 'sla', 'knowledge-base'],
        screenshots: [
          { url: '/assets/marketplace/helpdesk-queue.png', caption: 'Ticket queue with SLA indicators' },
          { url: '/assets/marketplace/helpdesk-kb.png', caption: 'Knowledge base article editor' },
        ],
      },
      {
        slug: 'approval-workflow-engine', name: 'Approval Workflow Engine',
        description: 'Configurable multi-level approval workflows for any document type.',
        longDescription: 'Create custom approval workflows for purchase orders, invoices, leave requests, expense claims, or any document type. Visual workflow designer with conditional branching, parallel approvals, delegation rules, and auto-escalation.\n\nSupports amount-based routing, department-based routing, and role-based approval chains. Real-time notification via email and in-app alerts with mobile approval capability.',
        category: 'Operations', publisher: 'UniERP', version: '2.1.0', pricing: 'FREE', rating: 4.8, installs: 1650, verified: true, featured: true,
        features: ['Visual workflow designer', 'Conditional branching', 'Parallel approvals', 'Delegation rules', 'Auto-escalation', 'Amount-based routing', 'Mobile approval', 'Audit trail'],
        tags: ['workflow', 'approval', 'automation', 'bpm'],
        screenshots: [
          { url: '/assets/marketplace/workflow-designer.png', caption: 'Visual workflow builder' },
          { url: '/assets/marketplace/workflow-pending.png', caption: 'Pending approvals dashboard' },
        ],
      },
      {
        slug: 'document-management', name: 'Document Management System',
        description: 'Centralized file storage with version control, access permissions, and full-text search.',
        longDescription: 'Enterprise document management with folder hierarchies, metadata tagging, and automatic file versioning. Full-text search across all document types including PDFs, Word, and Excel files.\n\nRole-based access control, document check-out/check-in, audit trail, and retention policies. Supports document templates, merge fields, and bulk operations. Integrates with all ERP modules for contextual document attachment.',
        category: 'Operations', publisher: 'UniERP', version: '1.5.0', pricing: 'FREE', rating: 4.4, installs: 870, verified: true,
        features: ['Version control', 'Full-text search', 'Access permissions', 'Retention policies', 'Check-out/check-in', 'Metadata tagging', 'Template engine', 'Bulk operations'],
        tags: ['documents', 'dms', 'files', 'storage', 'search'],
        screenshots: [
          { url: '/assets/marketplace/dms-browser.png', caption: 'Document browser with preview' },
          { url: '/assets/marketplace/dms-version.png', caption: 'Version history comparison' },
        ],
      },
      {
        slug: 'bank-reconciliation', name: 'Bank Reconciliation',
        description: 'Automatic bank statement import, matching, and reconciliation with AI-powered suggestions.',
        longDescription: 'Import bank statements via OFX, CSV, or API connections. AI-powered matching engine automatically matches transactions to invoices, payments, and journal entries with 95%+ accuracy.\n\nManual review interface for unmatched items, recurring pattern learning, and multi-account reconciliation. Generates reconciliation reports with variance analysis for month-end close.',
        category: 'Finance', publisher: 'UniERP', version: '1.7.0', pricing: 'PAID', price: 19.99, rating: 4.7, installs: 1020, verified: true,
        features: ['Auto statement import', 'AI matching engine', 'Multi-account support', 'Pattern learning', 'Variance analysis', 'OFX/CSV/API import', 'Reconciliation reports', 'Month-end close'],
        tags: ['banking', 'reconciliation', 'finance', 'automation', 'ai'],
        screenshots: [
          { url: '/assets/marketplace/bank-match.png', caption: 'Transaction matching interface' },
          { url: '/assets/marketplace/bank-report.png', caption: 'Reconciliation summary report' },
        ],
      },
      {
        slug: 'budgeting-forecasting', name: 'Budgeting & Forecasting',
        description: 'Annual budgets, rolling forecasts, what-if scenarios, and variance analysis.',
        longDescription: 'Comprehensive budgeting with top-down and bottom-up approaches, departmental budget allocation, and approval workflows. Rolling forecasts with automatic trend-based projections.\n\nWhat-if scenario modeling lets you compare multiple forecast versions. Real-time budget vs. actual dashboards with drill-down to individual transactions. Supports capital budgets, operating budgets, and cash flow forecasting.',
        category: 'Finance', publisher: 'UniERP', version: '1.3.0', pricing: 'PAID', price: 34.99, rating: 4.5, installs: 680, verified: true,
        features: ['Annual budgeting', 'Rolling forecasts', 'What-if scenarios', 'Variance analysis', 'Department budgets', 'Cash flow forecast', 'Capital budgets', 'Approval workflow'],
        tags: ['budget', 'forecast', 'finance', 'planning', 'scenario'],
        screenshots: [
          { url: '/assets/marketplace/budget-plan.png', caption: 'Budget planning grid' },
          { url: '/assets/marketplace/budget-variance.png', caption: 'Budget vs actual variance chart' },
        ],
      },
      {
        slug: 'hr-performance', name: 'Performance Management',
        description: 'Goals, OKRs, 360° reviews, performance appraisals, and talent development.',
        longDescription: 'Complete performance management with goal setting (OKRs and KPIs), continuous feedback, 360-degree reviews, and formal appraisal cycles. Configurable review forms, rating scales, and calibration sessions.\n\nTalent 9-box matrix, succession planning, individual development plans, and competency frameworks. Analytics dashboard showing team performance trends, goal completion rates, and review participation.',
        category: 'HR', publisher: 'UniERP', version: '1.6.0', pricing: 'PAID', price: 24.99, rating: 4.5, installs: 760, verified: true,
        features: ['OKR tracking', '360° reviews', 'Appraisal cycles', '9-box matrix', 'Succession planning', 'Competency frameworks', 'Continuous feedback', 'Development plans'],
        tags: ['performance', 'hr', 'okr', 'reviews', 'talent'],
        screenshots: [
          { url: '/assets/marketplace/perf-goals.png', caption: 'Goal tracking dashboard' },
          { url: '/assets/marketplace/perf-review.png', caption: '360° review form' },
        ],
      },
      {
        slug: 'time-attendance', name: 'Time & Attendance',
        description: 'Clock in/out, shift scheduling, overtime tracking, and biometric integration.',
        longDescription: 'Track employee attendance with web-based clock in/out, mobile GPS check-in, and biometric device integration. Flexible shift scheduling with drag-and-drop roster planning and shift swap requests.\n\nAutomatic overtime calculations based on configurable rules, late/early departure tracking, and absence management. Real-time attendance dashboards and integration with Payroll for accurate time-based compensation.',
        category: 'HR', publisher: 'UniERP', version: '2.0.0', pricing: 'FREE', rating: 4.6, installs: 1340, verified: true,
        features: ['Web clock in/out', 'Mobile GPS check-in', 'Biometric integration', 'Shift scheduling', 'Overtime calculation', 'Absence management', 'Shift swap requests', 'Payroll integration'],
        tags: ['attendance', 'hr', 'time-tracking', 'shifts', 'biometric'],
        screenshots: [
          { url: '/assets/marketplace/time-roster.png', caption: 'Shift roster planner' },
          { url: '/assets/marketplace/time-dashboard.png', caption: 'Real-time attendance dashboard' },
        ],
      },
      {
        slug: 'crm-lead-scoring', name: 'CRM Lead Scoring & Automation',
        description: 'AI-powered lead scoring, pipeline automation, and sales forecasting.',
        longDescription: 'Supercharge your sales pipeline with machine learning-based lead scoring. Automatically score and rank leads based on engagement, demographics, firmographics, and behavioral signals.\n\nSales automation triggers nurture sequences, task assignments, and stage transitions. Predictive forecasting models estimate deal closure probability and expected revenue. Includes funnel analytics and win/loss analysis.',
        category: 'Sales', publisher: 'UniERP', version: '1.2.0', pricing: 'PAID', price: 39.99, rating: 4.4, installs: 480, verified: true,
        features: ['AI lead scoring', 'Pipeline automation', 'Sales forecasting', 'Nurture sequences', 'Win/loss analysis', 'Funnel analytics', 'Deal probability', 'Auto task assignment'],
        tags: ['crm', 'sales', 'lead-scoring', 'ai', 'automation', 'forecasting'],
        screenshots: [
          { url: '/assets/marketplace/lead-scores.png', caption: 'Lead scoring dashboard' },
          { url: '/assets/marketplace/lead-pipeline.png', caption: 'Automated pipeline view' },
        ],
      },
      {
        slug: 'production-planning', name: 'Production Planning (MRP II)',
        description: 'Material requirements planning, capacity scheduling, and shop floor control.',
        longDescription: 'Advanced manufacturing resource planning with multi-level BOM explosion, MRP calculations, and capacity requirements planning. Master production scheduling with finite and infinite capacity modes.\n\nShop floor control with work order tracking, operation sequencing, and real-time production monitoring. Supports make-to-order, make-to-stock, and engineer-to-order manufacturing strategies.',
        category: 'Manufacturing', publisher: 'UniERP', version: '2.2.0', pricing: 'PAID', price: 44.99, rating: 4.8, installs: 590, verified: true,
        features: ['MRP calculations', 'Capacity planning', 'Shop floor control', 'BOM management', 'Work order tracking', 'Production scheduling', 'MTO/MTS/ETO support', 'Real-time monitoring'],
        tags: ['manufacturing', 'mrp', 'production', 'planning', 'shop-floor'],
        screenshots: [
          { url: '/assets/marketplace/mrp-schedule.png', caption: 'Production schedule Gantt' },
          { url: '/assets/marketplace/mrp-shopfloor.png', caption: 'Shop floor monitoring dashboard' },
        ],
      },
      {
        slug: 'vendor-portal', name: 'Vendor Portal',
        description: 'Self-service portal for vendors to manage POs, invoices, and compliance documents.',
        longDescription: 'Give your vendors a branded self-service portal to view purchase orders, submit invoices, update delivery schedules, and upload compliance documents. Reduces procurement team workload by 60%.\n\nVendors can track payment status, respond to RFQs, and update their company profiles and certifications. Includes vendor performance scorecards and communication messaging.',
        category: 'Integrations', publisher: 'UniERP', version: '1.3.0', pricing: 'PAID', price: 19.99, rating: 4.3, installs: 440, verified: true,
        features: ['PO visibility', 'Invoice submission', 'Payment tracking', 'RFQ response', 'Document upload', 'Performance scorecards', 'Profile management', 'Messaging'],
        tags: ['vendor', 'portal', 'procurement', 'self-service', 'supplier'],
        screenshots: [
          { url: '/assets/marketplace/vendor-dashboard.png', caption: 'Vendor self-service dashboard' },
          { url: '/assets/marketplace/vendor-invoice.png', caption: 'Invoice submission form' },
        ],
      },
      {
        slug: 'pos-restaurant', name: 'POS - Restaurant Edition',
        description: 'Table management, kitchen display, split billing, and menu modifier support.',
        longDescription: 'Purpose-built POS for restaurants and food service with table layout management, order-to-kitchen flow, kitchen display system (KDS), and split billing. Supports menu modifiers, combo meals, and daily specials.\n\nIncludes tip management, customer tabs, take-out/delivery modes, and integration with delivery platforms. Real-time sales analytics and inventory deduction for recipe-based items.',
        category: 'Sales', publisher: 'Community', version: '1.5.0', pricing: 'PAID', price: 29.99, rating: 4.3, installs: 350,
        features: ['Table management', 'Kitchen display (KDS)', 'Split billing', 'Menu modifiers', 'Tip management', 'Delivery integration', 'Combo meals', 'Recipe inventory'],
        tags: ['pos', 'restaurant', 'food', 'kitchen', 'billing'],
        screenshots: [
          { url: '/assets/marketplace/pos-table.png', caption: 'Table layout with status indicators' },
          { url: '/assets/marketplace/pos-kds.png', caption: 'Kitchen display system' },
        ],
      },
      {
        slug: 'compliance-audit', name: 'Compliance & Audit Trail',
        description: 'SOX/SOC2 compliance tracking, internal audit management, and control testing.',
        longDescription: 'Comprehensive compliance management for SOX, SOC2, ISO 27001, and GDPR. Define control frameworks, map controls to business processes, and schedule periodic testing.\n\nInternal audit management with audit planning, fieldwork tracking, finding documentation, and remediation workflows. Continuous monitoring dashboards and automated evidence collection from ERP transactions.',
        category: 'Finance', publisher: 'UniERP', version: '1.1.0', pricing: 'PAID', price: 44.99, rating: 4.6, installs: 320, verified: true,
        features: ['SOX compliance', 'SOC2 controls', 'Audit planning', 'Control testing', 'Evidence collection', 'Remediation tracking', 'Continuous monitoring', 'Framework mapping'],
        tags: ['compliance', 'audit', 'sox', 'soc2', 'governance'],
        screenshots: [
          { url: '/assets/marketplace/audit-controls.png', caption: 'Control framework dashboard' },
          { url: '/assets/marketplace/audit-testing.png', caption: 'Control testing schedule' },
        ],
      },
      {
        slug: 'slack-integration', name: 'Slack Integration',
        description: 'Push ERP notifications to Slack channels and approve requests from Slack.',
        longDescription: 'Connect your ERP notifications to Slack channels. Get alerts for new orders, low stock, overdue invoices, leave requests, and approval tasks directly in Slack.\n\nInteractive approval buttons let managers approve POs, leave requests, and expense claims without leaving Slack. Slash commands for quick ERP lookups (/erp-invoice, /erp-stock, /erp-order).',
        category: 'Integrations', publisher: 'Community', version: '1.6.0', pricing: 'FREE', rating: 4.5, installs: 980,
        features: ['Channel notifications', 'Interactive approvals', 'Slash commands', 'Configurable alerts', 'Multi-workspace', 'Thread replies', 'Rich formatting', 'DM support'],
        tags: ['slack', 'integration', 'notifications', 'chat', 'messaging'],
        screenshots: [
          { url: '/assets/marketplace/slack-notif.png', caption: 'ERP notifications in Slack channel' },
          { url: '/assets/marketplace/slack-approve.png', caption: 'Interactive approval buttons' },
        ],
      },
      {
        slug: 'zapier-connector', name: 'Zapier & Webhook Connector',
        description: 'Connect to 5,000+ apps via Zapier triggers and actions, plus custom webhooks.',
        longDescription: 'No-code integration with 5,000+ third-party apps via Zapier. Pre-built triggers fire on ERP events (new order, customer created, invoice paid) and actions push data into your ERP.\n\nCustom webhook endpoints for point-to-point integrations without Zapier. Includes retry logic, payload transformation, and detailed delivery logs. Supports both inbound and outbound webhooks.',
        category: 'Integrations', publisher: 'Community', version: '1.2.0', pricing: 'FREE', rating: 4.4, installs: 1150,
        features: ['5,000+ app connections', 'Pre-built triggers', 'Pre-built actions', 'Custom webhooks', 'Retry logic', 'Payload transformation', 'Delivery logs', 'Inbound/outbound'],
        tags: ['zapier', 'webhook', 'integration', 'automation', 'no-code'],
        screenshots: [
          { url: '/assets/marketplace/zapier-setup.png', caption: 'Zapier connection wizard' },
          { url: '/assets/marketplace/zapier-logs.png', caption: 'Webhook delivery logs' },
        ],
      },
      {
        slug: 'data-import-export', name: 'Data Import/Export Pro',
        description: 'Bulk import from CSV/Excel, field mapping, data validation, and scheduled exports.',
        longDescription: 'Professional data migration and ongoing import/export tool. Upload CSV or Excel files, map columns to ERP fields with drag-and-drop, preview transformations, and validate data before importing.\n\nScheduled exports to SFTP, S3, or email. Import templates for common scenarios (customers, products, chart of accounts). Rollback capability for failed imports and detailed error reporting.',
        category: 'Operations', publisher: 'UniERP', version: '1.9.0', pricing: 'FREE', rating: 4.3, installs: 1400, verified: true,
        features: ['CSV/Excel import', 'Field mapping', 'Data validation', 'Scheduled exports', 'Import templates', 'Rollback support', 'SFTP/S3 export', 'Error reporting'],
        tags: ['import', 'export', 'data', 'migration', 'csv', 'excel'],
        screenshots: [
          { url: '/assets/marketplace/import-map.png', caption: 'Column mapping interface' },
          { url: '/assets/marketplace/import-validate.png', caption: 'Data validation preview' },
        ],
      },
      {
        slug: 'custom-reports-builder', name: 'Custom Report Builder',
        description: 'Drag-and-drop report designer with parameters, grouping, and PDF/Excel output.',
        longDescription: 'Build pixel-perfect reports with the drag-and-drop designer. Select data sources, define parameters, apply filters, and configure grouping and sorting. Preview reports in real-time.\n\nSupports sub-reports, calculated fields, conditional formatting, and cross-tab reports. Output to PDF, Excel, CSV, or HTML. Schedule reports for automatic generation and email delivery.',
        category: 'Analytics', publisher: 'UniERP', version: '1.4.0', pricing: 'PAID', price: 14.99, rating: 4.5, installs: 820, verified: true,
        features: ['Drag-and-drop designer', 'Parameters & filters', 'Grouping & sorting', 'PDF/Excel output', 'Sub-reports', 'Calculated fields', 'Conditional formatting', 'Scheduled generation'],
        tags: ['reports', 'analytics', 'designer', 'pdf', 'custom'],
        screenshots: [
          { url: '/assets/marketplace/report-designer.png', caption: 'Report layout designer' },
          { url: '/assets/marketplace/report-preview.png', caption: 'Report preview with parameters' },
        ],
      },
      {
        slug: 'customer-portal', name: 'Customer Self-Service Portal',
        description: 'Branded portal for customers to view invoices, place orders, and track shipments.',
        longDescription: 'Give customers a white-labeled self-service portal to view their account, download invoices, make payments, place repeat orders, and track shipments. Reduces support inquiries by up to 70%.\n\nConfigurable portal themes, custom domain support, and SSO integration. Customers can update their profiles, manage addresses, view order history, and submit support requests.',
        category: 'Sales', publisher: 'UniERP', version: '1.7.0', pricing: 'PAID', price: 24.99, rating: 4.6, installs: 610, verified: true,
        features: ['Invoice viewing', 'Online payments', 'Order placement', 'Shipment tracking', 'Custom branding', 'SSO integration', 'Address management', 'Support requests'],
        tags: ['portal', 'customer', 'self-service', 'b2b', 'ecommerce'],
        screenshots: [
          { url: '/assets/marketplace/portal-dashboard.png', caption: 'Customer portal dashboard' },
          { url: '/assets/marketplace/portal-orders.png', caption: 'Order history and reorder' },
        ],
      },
    ];

    const changelogs: { appSlug: string; entries: { version: string; changes: string }[] }[] = [
      { appSlug: 'advanced-analytics', entries: [
        { version: '2.1.0', changes: '• Added custom formula builder\n• New waterfall chart type\n• Improved export performance by 3x\n• Fixed timezone handling in date filters' },
        { version: '2.0.0', changes: '• Complete UI redesign with dark mode\n• Added 20 new chart types\n• Real-time data refresh\n• Role-based dashboard sharing' },
        { version: '1.5.0', changes: '• Added pivot table support\n• Email report scheduling\n• PDF export improvements' },
      ]},
      { appSlug: 'payroll-engine', entries: [
        { version: '3.0.0', changes: '• Added support for 5 new countries\n• Complete tax engine rewrite for accuracy\n• Employee self-service payslip portal\n• Direct deposit via banking API' },
        { version: '2.5.0', changes: '• Retro-pay calculation engine\n• Commission and bonus support\n• Improved overtime rule configuration' },
        { version: '2.0.0', changes: '• Multi-pay frequency support\n• Benefits enrollment module\n• Statutory compliance auto-updates' },
      ]},
      { appSlug: 'multi-currency', entries: [
        { version: '2.2.0', changes: '• Added 30 more currencies (now 170+)\n• Configurable rounding rules per currency\n• Historical rate lookup API\n• Batch revaluation for month-end' },
        { version: '2.0.0', changes: '• Real-time rate streaming\n• Multiple rate source support\n• FX gain/loss journal auto-posting' },
      ]},
      { appSlug: 'approval-workflow-engine', entries: [
        { version: '2.1.0', changes: '• Parallel approval support\n• Mobile approval push notifications\n• Delegation with date ranges\n• Auto-escalation after configurable timeout' },
        { version: '2.0.0', changes: '• Visual workflow designer\n• Conditional branching\n• Amount-based routing rules' },
      ]},
    ];

    for (const appData of apps) {
      await prisma.marketplaceApp.create({ data: appData as any });
    }

    for (const { appSlug, entries } of changelogs) {
      const app = await prisma.marketplaceApp.findUnique({ where: { slug: appSlug } });
      if (app) {
        for (const entry of entries) {
          await prisma.appChangelog.create({
            data: { appId: app.id, version: entry.version, changes: entry.changes },
          });
        }
      }
    }

    const collections = [
      { slug: 'staff-picks', name: 'Staff Picks', description: 'Hand-picked by our team for maximum productivity.', icon: '⭐', featured: true, sortOrder: 1 },
      { slug: 'getting-started', name: 'Getting Started Essentials', description: 'Must-have apps for new ERP deployments.', icon: '🚀', featured: true, sortOrder: 2 },
      { slug: 'finance-suite', name: 'Finance Power Suite', description: 'Everything you need for world-class financial management.', icon: '💰', featured: false, sortOrder: 3 },
      { slug: 'manufacturing-toolkit', name: 'Manufacturing Toolkit', description: 'Complete manufacturing operations management.', icon: '🏭', featured: false, sortOrder: 4 },
      { slug: 'integration-hub', name: 'Integration Hub', description: 'Connect your ERP to the tools you already use.', icon: '🔗', featured: false, sortOrder: 5 },
    ];

    for (const col of collections) {
      const collection = await prisma.appCollection.create({ data: col });
      const appSlugsForCollection: Record<string, string[]> = {
        'staff-picks': ['advanced-analytics', 'payroll-engine', 'multi-currency', 'approval-workflow-engine', 'helpdesk-support'],
        'getting-started': ['expense-management', 'data-import-export', 'document-management', 'time-attendance', 'helpdesk-support'],
        'finance-suite': ['multi-currency', 'bank-reconciliation', 'budgeting-forecasting', 'expense-management', 'asset-management', 'compliance-audit'],
        'manufacturing-toolkit': ['production-planning', 'quality-control', 'warehouse-management'],
        'integration-hub': ['ecommerce-connector', 'slack-integration', 'zapier-connector', 'bi-connector', 'vendor-portal'],
      };

      const slugs = appSlugsForCollection[col.slug] || [];
      for (let i = 0; i < slugs.length; i++) {
        const app = await prisma.marketplaceApp.findUnique({ where: { slug: slugs[i] } });
        if (app) {
          await prisma.appCollectionItem.create({
            data: { collectionId: collection.id, appId: app.id, sortOrder: i },
          });
        }
      }
    }

    return { message: `Seeded ${apps.length} marketplace apps, ${changelogs.length} changelogs, and ${collections.length} collections` };
  }
}

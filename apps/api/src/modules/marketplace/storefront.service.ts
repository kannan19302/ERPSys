import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class StorefrontService {

  async getStorefrontListings(params: {
    category?: string;
    search?: string;
    pricing?: string;
    sortBy?: 'POPULAR' | 'RECENT' | 'RATING' | 'NAME';
    page?: number;
    limit?: number;
  } = {}) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    if (params.category) where.category = params.category;
    if (params.pricing) where.pricing = params.pricing;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    if (params.sortBy === 'RECENT') orderBy.updatedAt = 'desc';
    else if (params.sortBy === 'NAME') orderBy.name = 'asc';
    else orderBy.installCount = 'desc';

    const [apps, total] = await Promise.all([
      prisma.appPackage.findMany({
        where: where as any,
        include: {
          vendor: { select: { id: true, name: true, slug: true, verified: true } },
          _count: { select: { bundles: true } },
        },
        orderBy: orderBy as any,
        skip,
        take: limit,
      }),
      prisma.appPackage.count({ where: where as any }),
    ]);

    return {
      apps: apps.map((app) => ({
        id: app.id,
        slug: app.slug,
        name: app.name,
        description: app.description,
        icon: app.icon,
        category: app.category,
        pricing: app.pricing,
        price: app.price ? Number(app.price) : 0,
        tags: app.tags,
        screenshots: app.screenshots,
        vendorName: app.vendor?.name,
        vendorVerified: app.vendor?.verified ?? false,
        installCount: (app as any).installCount || 0,
        avgRating: (app as any).avgRating || 0,
        reviewCount: (app as any).reviewCount || 0,
        bundleCount: app._count.bundles,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAppDetail(slug: string) {
    const app = await prisma.appPackage.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        vendor: true,
        bundles: { where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!app) throw new NotFoundException('App not found');

    const reviews = await (prisma as any).appReview?.findMany?.({
      where: { packageId: app.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }) ?? [];

    return {
      ...app,
      reviews,
      latestVersion: app.bundles[0]?.version || '1.0.0',
    };
  }

  async getCategories() {
    const categories = await prisma.appPackage.groupBy({
      by: ['category'],
      where: { status: 'PUBLISHED' },
      _count: { id: true },
    });

    return categories.map((c) => ({
      name: c.category,
      count: c._count.id,
    }));
  }

  async submitReview(
    tenantId: string,
    userId: string,
    packageSlug: string,
    dto: { rating: number; title: string; body: string },
  ) {
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

    const app = await prisma.appPackage.findFirst({ where: { slug: packageSlug } });
    if (!app) throw new NotFoundException('App not found');

    // Check if user already reviewed
    const existing = await (prisma as any).appReview?.findFirst?.({
      where: { packageId: app.id, userId },
    });
    if (existing) throw new BadRequestException('You have already reviewed this app');

    const review = await (prisma as any).appReview?.create?.({
      data: {
        packageId: app.id,
        tenantId,
        userId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
      },
    });

    return review || { packageId: app.id, rating: dto.rating, title: dto.title, status: 'SUBMITTED' };
  }

  async getFeaturedApps() {
    return prisma.appPackage.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        vendor: { select: { name: true, verified: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });
  }

  async getAppsByVendor(vendorSlug: string) {
    const vendor = await prisma.appVendor.findFirst({ where: { slug: vendorSlug } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const apps = await prisma.appPackage.findMany({
      where: { vendorId: vendor.id, status: 'PUBLISHED' },
      orderBy: { name: 'asc' },
    });

    return { vendor, apps };
  }

  async getDeveloperDashboard(vendorId: string) {
    const packages = await prisma.appPackage.findMany({
      where: { vendorId },
      include: {
        bundles: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { bundles: true } },
      },
    });

    const totalInstalls = packages.reduce((s, p) => s + ((p as any).installCount || 0), 0);

    return {
      vendorId,
      appCount: packages.length,
      publishedCount: packages.filter((p) => p.status === 'PUBLISHED').length,
      draftCount: packages.filter((p) => p.status === 'DRAFT').length,
      totalInstalls,
      apps: packages.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        latestVersion: p.bundles[0]?.version || 'N/A',
        installCount: (p as any).installCount || 0,
      })),
    };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { prisma, runWithTenantSession } from "@unerp/database";

@Injectable()
export class MarketplaceDeepService {
  private readonly logger = new Logger(MarketplaceDeepService.name);

  /* ──────────────── App Reviews & Ratings ──────────────── */

  async getAppReviews(appId: string, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const [items, total, aggregate] = await Promise.all([
      prisma.appReview.findMany({
        where: { appId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appReview.count({ where: { appId } }),
      prisma.appReview.aggregate({
        where: { appId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);
    const distribution = await prisma.appReview.groupBy({
      by: ["rating"],
      where: { appId },
      _count: true,
    });
    const ratingDist = Object.fromEntries(
      distribution.map((r) => [r.rating, r._count]),
    );
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      aggregate: {
        avgRating: aggregate._avg.rating ?? 0,
        totalReviews: aggregate._count.rating,
      },
      distribution: ratingDist,
    };
  }

  async createAppReview(
    appId: string,
    userId: string,
    userName: string,
    tenantId: string,
    data: { rating: number; title?: string; body?: string },
  ) {
    const existing = await prisma.appReview.findUnique({
      where: { userId_appId: { userId, appId } },
    });
    if (existing)
      throw new BadRequestException("You have already reviewed this app");
    const review = await prisma.appReview.create({
      data: {
        tenantId,
        userId,
        userName,
        appId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        verifiedPurchase: false,
      },
    });
    await this.recalcAppRating(appId);
    return review;
  }

  async updateAppReview(
    tenantId: string,
    userId: string,
    reviewId: string,
    data: { rating?: number; title?: string; body?: string },
  ) {
    const review = await prisma.appReview.findFirst({
      where: { id: reviewId, userId, tenantId },
    });
    if (!review) throw new NotFoundException("Review not found");
    const updated = await prisma.appReview.update({
      where: { id: reviewId },
      data,
    });
    await this.recalcAppRating(review.appId);
    return updated;
  }

  async deleteAppReview(tenantId: string, userId: string, reviewId: string) {
    const review = await prisma.appReview.findFirst({
      where: { id: reviewId, userId, tenantId },
    });
    if (!review) throw new NotFoundException("Review not found");
    await prisma.appReview.delete({ where: { id: reviewId } });
    await this.recalcAppRating(review.appId);
    return { message: "Review deleted" };
  }

  private async recalcAppRating(appId: string) {
    const agg = await prisma.appReview.aggregate({
      where: { appId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.marketplaceApp.update({
      where: { id: appId },
      data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count },
    });
  }

  /* ──────────────── App Version History ──────────────── */

  async getAppVersions(appId: string) {
    return prisma.marketplaceAppVersion.findMany({
      where: { appId },
      orderBy: { publishedAt: "desc" },
    });
  }

  async createAppVersion(
    appId: string,
    data: { version: string; changelog?: string; fileUrl?: string },
  ) {
    const existing = await prisma.marketplaceAppVersion.findUnique({
      where: { appId_version: { appId, version: data.version } },
    });
    if (existing) throw new BadRequestException("Version already exists");
    return prisma.marketplaceAppVersion.create({ data: { appId, ...data } });
  }

  /* ──────────────── Developer Submission Workflow ──────────────── */

  async listSubmissions(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return prisma.marketplaceDeveloperSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createSubmission(
    tenantId: string,
    developerId: string,
    data: {
      name: string;
      slug: string;
      description: string;
      category: string;
      icon?: string;
    },
  ) {
    return prisma.marketplaceDeveloperSubmission.create({
      data: { tenantId, developerId, ...data },
    });
  }

  async reviewSubmission(
    tenantId: string,
    submissionId: string,
    reviewerId: string,
    action: "APPROVED" | "REJECTED",
    notes?: string,
  ) {
    const submission = await prisma.marketplaceDeveloperSubmission.findFirst({
      where: { id: submissionId, tenantId },
    });
    if (!submission) throw new NotFoundException("Submission not found");
    if (submission.status !== "PENDING" && submission.status !== "IN_REVIEW")
      throw new BadRequestException("Submission is not pending review");
    return prisma.marketplaceDeveloperSubmission.update({
      where: { id: submissionId },
      data: {
        status: action,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        submissionNotes: notes,
      },
    });
  }

  /* ──────────────── Marketplace Analytics ──────────────── */

  async getAnalytics(query: {
    from?: string;
    to?: string;
    appId?: string;
    top?: number;
  }) {
    const where: any = {};
    if (query.appId) where.appId = query.appId;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }
    const sortBy = query.top
      ? { installs: "desc" as const }
      : { date: "desc" as const };
    const limit = Math.min(query.top ?? 20, 100);
    const items = await prisma.marketplaceAnalytics.findMany({
      where,
      orderBy: sortBy,
      take: limit,
    });
    const totals = await prisma.marketplaceAnalytics.aggregate({
      where,
      _sum: { installs: true, uninstalls: true, revenue: true },
    });
    return {
      items,
      totals: {
        installs: totals._sum.installs ?? 0,
        uninstalls: totals._sum.uninstalls ?? 0,
        revenue: totals._sum.revenue ?? 0,
      },
    };
  }

  async logAnalyticsEvent(
    appId: string,
    event: "install" | "uninstall",
    revenue?: number,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.marketplaceAnalytics.findUnique({
      where: { appId_date: { appId, date: today } },
    });
    if (existing) {
      await prisma.marketplaceAnalytics.update({
        where: { id: existing.id },
        data: {
          installs:
            event === "install" ? existing.installs + 1 : existing.installs,
          uninstalls:
            event === "uninstall"
              ? existing.uninstalls + 1
              : existing.uninstalls,
          revenue: revenue
            ? Number(existing.revenue) + revenue
            : existing.revenue,
        },
      });
    } else {
      await prisma.marketplaceAnalytics.create({
        data: {
          appId,
          date: today,
          installs: event === "install" ? 1 : 0,
          uninstalls: event === "uninstall" ? 1 : 0,
          revenue: revenue ?? 0,
        },
      });
    }
  }
}

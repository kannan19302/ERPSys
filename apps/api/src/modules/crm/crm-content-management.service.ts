import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { z } from "zod";

const db = prisma as any;

export const createContentCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const createContentItemSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fileUrl: z.string().optional(),
  status: z.string().optional(),
});

@Injectable()
export class CrmContentManagementService {
  async getContentCategories(tenantId = "tenant-1") {
    return db.contentCategory.findMany({
      where: { tenantId },
      include: { _count: { select: { items: true } } },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createCategory(tenantId = "tenant-1", dto: any = {}) {
    return db.contentCategory.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(tenantId = "tenant-1", id = "", dto: any = {}) {
    const cat = await db.contentCategory.findFirst({ where: { id, tenantId } });
    if (!cat) throw new NotFoundException("Category not found");
    return db.contentCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(tenantId = "tenant-1", id = "") {
    const cat = await db.contentCategory.findFirst({ where: { id, tenantId } });
    if (!cat) throw new NotFoundException("Category not found");
    const count = await db.contentItem.count({ where: { categoryId: id } });
    if (count > 0)
      throw new BadRequestException("Cannot delete category with items");
    return db.contentCategory.delete({ where: { id } });
  }

  async getContentItems(
    tenantId = "tenant-1",
    params: {
      page?: number;
      limit?: number;
      type?: string;
      category?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (params.type) where.type = params.type;
    if (params.category) where.categoryId = params.category;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [data, totalCount] = await Promise.all([
      db.contentItem.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
      }),
      db.contentItem.count({ where }),
    ]);

    return { data, totalCount, page, limit };
  }

  async createContentItem(
    tenantId = "tenant-1",
    userId = "user-1",
    dto: any = {},
  ) {
    const item = await db.contentItem.create({
      data: {
        tenantId,
        createdBy: userId,
        title: dto.title,
        type: dto.type,
        categoryId: dto.categoryId,
        tags: dto.tags ?? [],
        fileUrl: dto.fileUrl,
        status: dto.status ?? "DRAFT",
      },
    });

    await db.contentAnalytics.create({
      data: {
        contentId: item.id,
        viewCount: 0,
        downloadCount: 0,
        shareCount: 0,
      },
    });

    return db.contentItem.findUnique({
      where: { id: item.id },
      include: { category: true },
    });
  }

  async updateContentItem(tenantId = "tenant-1", id = "", dto: any = {}) {
    const item = await db.contentItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException("Content item not found");
    return db.contentItem.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
      include: { category: true },
    });
  }

  async deleteContentItem(tenantId = "tenant-1", id = "") {
    const item = await db.contentItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException("Content item not found");
    await db.contentAnalytics.deleteMany({ where: { contentId: id } });
    return db.contentItem.delete({ where: { id } });
  }

  async getContentItemById(tenantId = "tenant-1", id = "") {
    const item = await db.contentItem.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
    if (!item) throw new NotFoundException("Content item not found");
    return item;
  }

  async recordContentView(tenantId = "tenant-1", contentId = "") {
    const item = await db.contentItem.findFirst({
      where: { id: contentId, tenantId },
    });
    if (!item) throw new NotFoundException("Content item not found");
    const analytics = await db.contentAnalytics.findFirst({
      where: { contentId },
    });
    if (analytics) {
      return db.contentAnalytics.update({
        where: { id: analytics.id },
        data: {
          viewCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });
    }
  }

  async recordContentDownload(tenantId = "tenant-1", contentId = "") {
    const item = await db.contentItem.findFirst({
      where: { id: contentId, tenantId },
    });
    if (!item) throw new NotFoundException("Content item not found");
    const analytics = await db.contentAnalytics.findFirst({
      where: { contentId },
    });
    if (analytics) {
      return db.contentAnalytics.update({
        where: { id: analytics.id },
        data: { downloadCount: { increment: 1 } },
      });
    }
  }

  async recordContentShare(tenantId = "tenant-1", contentId = "") {
    const item = await db.contentItem.findFirst({
      where: { id: contentId, tenantId },
    });
    if (!item) throw new NotFoundException("Content item not found");
    const analytics = await db.contentAnalytics.findFirst({
      where: { contentId },
    });
    if (analytics) {
      return db.contentAnalytics.update({
        where: { id: analytics.id },
        data: { shareCount: { increment: 1 } },
      });
    }
  }

  async getContentAnalytics(contentId = "") {
    const analytics = await db.contentAnalytics.findFirst({
      where: { contentId },
    });
    if (!analytics) throw new NotFoundException("Analytics not found");
    return analytics;
  }

  async getContentDashboard(tenantId = "tenant-1") {
    const [totalItems, publishedItems, agg, topViewed] = await Promise.all([
      db.contentItem.count({ where: { tenantId } }),
      db.contentItem.count({ where: { tenantId, status: "PUBLISHED" } }),
      db.contentAnalytics.aggregate({
        _sum: { viewCount: true, downloadCount: true, shareCount: true },
      }),
      db.contentItem.findMany({ where: { tenantId }, take: 5 }),
    ]);

    return {
      totalItems,
      publishedItems,
      totalViews: agg._sum?.viewCount ?? 0,
      totalDownloads: agg._sum?.downloadCount ?? 0,
      totalShares: agg._sum?.shareCount ?? 0,
      topViewed,
    };
  }

  async searchContent(tenantId = "tenant-1", search = "") {
    return db.contentItem.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      },
    });
  }

  async getContentRecommendations(
    tenantId = "tenant-1",
    entityType = "",
    entityId = "",
  ) {
    const lead = await db.lead.findFirst({ where: { id: entityId, tenantId } });
    const items = await db.contentItem.findMany({ where: { tenantId } });
    return items;
  }
}

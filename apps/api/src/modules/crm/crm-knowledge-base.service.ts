import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const createKbCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type CreateKbCategoryInput = z.infer<typeof createKbCategorySchema>;

export const updateKbCategorySchema = createKbCategorySchema.partial();
export type UpdateKbCategoryInput = z.infer<typeof updateKbCategorySchema>;

export const createKbArticleSchema = z.object({
  categoryId: z.string().optional().nullable(),
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  tags: z.array(z.string()).default([]),
  isInternal: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
export type CreateKbArticleInput = z.infer<typeof createKbArticleSchema>;

export const updateKbArticleSchema = createKbArticleSchema.partial();
export type UpdateKbArticleInput = z.infer<typeof updateKbArticleSchema>;

@Injectable()
export class CrmKnowledgeBaseService {
  async getCategories(tenantId: string) {
    return prisma.knowledgeBaseCategory.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { articles: { where: { deletedAt: null } } } } },
    });
  }

  async getCategory(tenantId: string, id: string) {
    const cat = await prisma.knowledgeBaseCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        children: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        articles: { where: { deletedAt: null, status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, take: 50 },
      },
    });
    if (!cat) throw new NotFoundException("Category not found");
    return cat;
  }

  async createCategory(tenantId: string, orgId: string | undefined, dto: CreateKbCategoryInput) {
    return prisma.knowledgeBaseCategory.create({
      data: { ...dto, tenantId, orgId: orgId || "" },
    });
  }

  async updateCategory(tenantId: string, id: string, dto: UpdateKbCategoryInput) {
    const existing = await prisma.knowledgeBaseCategory.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Category not found");
    return prisma.knowledgeBaseCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(tenantId: string, id: string) {
    const existing = await prisma.knowledgeBaseCategory.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Category not found");
    const count = await prisma.knowledgeBaseArticle.count({ where: { categoryId: id, deletedAt: null } });
    if (count > 0) throw new BadRequestException("Cannot delete category with assigned articles");
    return prisma.knowledgeBaseCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getArticles(
    tenantId: string,
    filters: {
      categoryId?: string; status?: string; search?: string; isInternal?: boolean;
      page?: number; limit?: number; sortBy?: string; sortOrder?: "asc" | "desc";
    } = {},
  ) {
    const where: Prisma.KnowledgeBaseArticleWhereInput = { tenantId, deletedAt: null };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status) where.status = filters.status;
    if (filters.isInternal !== undefined) where.isInternal = filters.isInternal;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { content: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const orderBy: Prisma.KnowledgeBaseArticleOrderByWithRelationInput = {};
    if (filters.sortBy) {
      (orderBy as any)[filters.sortBy] = filters.sortOrder || "desc";
    } else {
      orderBy.sortOrder = "asc";
    }
    const [data, totalCount] = await Promise.all([
      prisma.knowledgeBaseArticle.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy, include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.knowledgeBaseArticle.count({ where }),
    ]);
    return { data, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
  }

  async getArticle(tenantId: string, id: string) {
    const article = await prisma.knowledgeBaseArticle.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        versions: { orderBy: { version: "desc" }, take: 10 },
      },
    });
    if (!article) throw new NotFoundException("Article not found");
    await prisma.knowledgeBaseArticle.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return article;
  }

  async createArticle(tenantId: string, orgId: string | undefined, userId: string, dto: CreateKbArticleInput) {
    const article = await prisma.knowledgeBaseArticle.create({
      data: { ...dto, tenantId, orgId: orgId || "", authorId: userId },
    });
    if (dto.status === "PUBLISHED") {
      await prisma.knowledgeBaseArticle.update({
        where: { id: article.id },
        data: { publishedAt: new Date() },
      });
    }
    await prisma.knowledgeBaseArticleVersion.create({
      data: { tenantId, articleId: article.id, version: 1, title: dto.title, content: dto.content, authorId: userId },
    });
    return prisma.knowledgeBaseArticle.findUnique({ where: { id: article.id }, include: { category: true } });
  }

  async updateArticle(tenantId: string, id: string, userId: string, dto: UpdateKbArticleInput) {
    const existing = await prisma.knowledgeBaseArticle.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Article not found");
    if (dto.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      (dto as any).publishedAt = new Date();
    }
    const updated = await prisma.knowledgeBaseArticle.update({ where: { id }, data: dto });
    if (dto.title || dto.content) {
      const lastVersion = await prisma.knowledgeBaseArticleVersion.findFirst({
        where: { articleId: id }, orderBy: { version: "desc" },
      });
      await prisma.knowledgeBaseArticleVersion.create({
        data: {
          tenantId, articleId: id, version: (lastVersion?.version || 0) + 1,
          title: dto.title || existing.title, content: dto.content || existing.content,
          changeLog: dto.status === "PUBLISHED" ? "Published" : "Updated",
          authorId: userId,
        },
      });
    }
    return updated;
  }

  async publishArticle(tenantId: string, id: string) {
    return this.updateArticle(tenantId, id, "", { status: "PUBLISHED" as any });
  }

  async archiveArticle(tenantId: string, id: string) {
    return this.updateArticle(tenantId, id, "", { status: "ARCHIVED" as any });
  }

  async deleteArticle(tenantId: string, id: string) {
    const existing = await prisma.knowledgeBaseArticle.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Article not found");
    return prisma.knowledgeBaseArticle.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async recordFeedback(tenantId: string, id: string, helpful: boolean) {
    const existing = await prisma.knowledgeBaseArticle.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Article not found");
    if (helpful) {
      return prisma.knowledgeBaseArticle.update({ where: { id }, data: { helpfulCount: { increment: 1 } } });
    }
    return prisma.knowledgeBaseArticle.update({ where: { id }, data: { notHelpfulCount: { increment: 1 } } });
  }

  async searchArticles(tenantId: string, query: string, isInternal?: boolean) {
    const where: Prisma.KnowledgeBaseArticleWhereInput = {
      tenantId, deletedAt: null, status: "PUBLISHED",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
      ],
    };
    if (isInternal !== undefined) where.isInternal = isInternal;
    return prisma.knowledgeBaseArticle.findMany({
      where, take: 20, orderBy: { viewCount: "desc" },
      select: { id: true, title: true, slug: true, excerpt: true, categoryId: true, publishedAt: true, viewCount: true },
    });
  }

  async getStats(tenantId: string) {
    const [totalArticles, publishedCount, draftCount, archivedCount, totalViews, totalHelpful, totalNotHelpful] =
      await Promise.all([
        prisma.knowledgeBaseArticle.count({ where: { tenantId, deletedAt: null } }),
        prisma.knowledgeBaseArticle.count({ where: { tenantId, deletedAt: null, status: "PUBLISHED" } }),
        prisma.knowledgeBaseArticle.count({ where: { tenantId, deletedAt: null, status: "DRAFT" } }),
        prisma.knowledgeBaseArticle.count({ where: { tenantId, deletedAt: null, status: "ARCHIVED" } }),
        prisma.knowledgeBaseArticle.aggregate({ where: { tenantId, deletedAt: null }, _sum: { viewCount: true } }),
        prisma.knowledgeBaseArticle.aggregate({ where: { tenantId, deletedAt: null }, _sum: { helpfulCount: true } }),
        prisma.knowledgeBaseArticle.aggregate({ where: { tenantId, deletedAt: null }, _sum: { notHelpfulCount: true } }),
      ]);
    return {
      totalArticles, publishedCount, draftCount, archivedCount,
      totalViews: totalViews._sum.viewCount || 0,
      totalHelpful: totalHelpful._sum.helpfulCount || 0,
      totalNotHelpful: totalNotHelpful._sum.notHelpfulCount || 0,
      helpfulRate: totalHelpful._sum.helpfulCount && totalNotHelpful._sum.notHelpfulCount
        ? (totalHelpful._sum.helpfulCount / (totalHelpful._sum.helpfulCount + totalNotHelpful._sum.notHelpfulCount)) * 100
        : null,
    };
  }
}

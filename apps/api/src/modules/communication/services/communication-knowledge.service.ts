import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class CommunicationKnowledgeService {
  async getArticles(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      categoryId?: string;
      search?: string;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.search)
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { content: { contains: params.search, mode: "insensitive" } },
      ];
    const [data, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        include: { category: true, ratings: true },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.knowledgeArticle.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getArticle(tenantId: string, id: string) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        versions: { orderBy: { version: "desc" }, take: 5 },
        ratings: true,
      },
    });
    if (!article) throw new NotFoundException("Knowledge article not found");
    await prisma.knowledgeArticle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return article;
  }

  async createArticle(
    tenantId: string,
    userId: string,
    dto: {
      title: string;
      content: string;
      categoryId?: string;
      excerpt?: string;
      tags?: string[];
      featured?: boolean;
    },
  ) {
    const slug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const existing = await prisma.knowledgeArticle.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (existing)
      throw new BadRequestException("Article with this title already exists");
    const article = await prisma.knowledgeArticle.create({
      data: {
        tenantId,
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt,
        categoryId: dto.categoryId,
        tags: dto.tags || [],
        featured: dto.featured || false,
        authorId: userId,
      },
    });
    await prisma.knowledgeArticleVersion.create({
      data: {
        tenantId,
        articleId: article.id,
        version: 1,
        title: dto.title,
        content: dto.content,
        authorId: userId,
      },
    });
    return article;
  }

  async updateArticle(
    tenantId: string,
    id: string,
    userId: string,
    dto: {
      title?: string;
      content?: string;
      categoryId?: string;
      excerpt?: string;
      tags?: string[];
      featured?: boolean;
    },
  ) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Knowledge article not found");
    const data: any = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.featured !== undefined) data.featured = dto.featured;
    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data,
    });
    const latestVersion = await prisma.knowledgeArticleVersion.findFirst({
      where: { articleId: id, tenantId },
      orderBy: { version: "desc" },
    });
    await prisma.knowledgeArticleVersion.create({
      data: {
        tenantId,
        articleId: id,
        version: (latestVersion?.version || 0) + 1,
        title: article.title,
        content: article.content,
        authorId: userId,
      },
    });
    return article;
  }

  async publishArticle(tenantId: string, id: string) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Knowledge article not found");
    return prisma.knowledgeArticle.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
  }

  async deleteArticle(tenantId: string, id: string) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Knowledge article not found");
    return prisma.knowledgeArticle.delete({ where: { id } });
  }

  async searchArticles(
    tenantId: string,
    query: string,
    params: { page?: number; limit?: number },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {
      tenantId,
      status: "PUBLISHED",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
      ],
    };
    const [data, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { viewCount: "desc" },
      }),
      prisma.knowledgeArticle.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getArticleVersion(
    tenantId: string,
    articleId: string,
    version: number,
  ) {
    const ver = await prisma.knowledgeArticleVersion.findUnique({
      where: { tenantId_articleId_version: { tenantId, articleId, version } },
    });
    if (!ver) throw new NotFoundException("Version not found");
    return ver;
  }

  async getArticleVersions(tenantId: string, articleId: string) {
    return prisma.knowledgeArticleVersion.findMany({
      where: { tenantId, articleId },
      orderBy: { version: "desc" },
    });
  }

  async rateArticle(
    tenantId: string,
    articleId: string,
    userId: string,
    dto: { rating: number; comment?: string },
  ) {
    if (dto.rating < 1 || dto.rating > 5)
      throw new BadRequestException("Rating must be between 1 and 5");
    const existing = await prisma.knowledgeArticleRating.findUnique({
      where: { tenantId_articleId_userId: { tenantId, articleId, userId } },
    });
    if (existing) {
      return prisma.knowledgeArticleRating.update({
        where: { id: existing.id },
        data: { rating: dto.rating, comment: dto.comment },
      });
    }
    return prisma.knowledgeArticleRating.create({
      data: {
        tenantId,
        articleId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async getCategories(tenantId: string) {
    return prisma.knowledgeCategory.findMany({
      where: { tenantId },
      include: { children: true, _count: { select: { articles: true } } },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createCategory(
    tenantId: string,
    dto: {
      name: string;
      description?: string;
      parentId?: string;
      icon?: string;
      sortOrder?: number;
    },
  ) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return prisma.knowledgeCategory.create({
      data: {
        tenantId,
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId,
        icon: dto.icon,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async deleteCategory(tenantId: string, id: string) {
    const existing = await prisma.knowledgeCategory.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Category not found");
    return prisma.knowledgeCategory.delete({ where: { id } });
  }

  async getKnowledgeDashboard(tenantId: string) {
    const [
      totalArticles,
      publishedCount,
      draftCount,
      totalViews,
      totalRatings,
      avgRating,
      topArticles,
      categoryCount,
    ] = await Promise.all([
      prisma.knowledgeArticle.count({ where: { tenantId } }),
      prisma.knowledgeArticle.count({
        where: { tenantId, status: "PUBLISHED" },
      }),
      prisma.knowledgeArticle.count({ where: { tenantId, status: "DRAFT" } }),
      prisma.knowledgeArticle.aggregate({
        where: { tenantId },
        _sum: { viewCount: true },
      }),
      prisma.knowledgeArticleRating.count({ where: { tenantId } }),
      prisma.knowledgeArticleRating.aggregate({
        where: { tenantId },
        _avg: { rating: true },
      }),
      prisma.knowledgeArticle.findMany({
        where: { tenantId, status: "PUBLISHED" },
        orderBy: { viewCount: "desc" },
        take: 5,
        include: { category: true },
      }),
      prisma.knowledgeCategory.count({ where: { tenantId } }),
    ]);
    return {
      totalArticles,
      publishedCount,
      draftCount,
      totalViews: totalViews._sum.viewCount || 0,
      totalRatings,
      avgRating: avgRating._avg.rating || 0,
      topArticles,
      categoryCount,
    };
  }
}

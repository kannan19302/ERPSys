import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class CommunicationSearchService {
  async fullTextSearch(
    tenantId: string,
    userId: string,
    query: string,
    params: { scope?: string; page?: number; limit?: number },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const scope = params.scope || "ALL";
    const results: any[] = [];

    if (scope === "ALL" || scope === "MESSAGES") {
      const messages = await prisma.message.findMany({
        where: {
          tenantId,
          content: { contains: query, mode: "insensitive" },
          deletedAt: null,
        },
        take: scope === "ALL" ? 5 : limit,
        orderBy: { createdAt: "desc" },
        include: { channel: { select: { name: true } } },
      });
      results.push(
        ...messages.map((m) => ({
          type: "message",
          id: m.id,
          title: m.content.substring(0, 100),
          channel: m.channel.name,
          createdAt: m.createdAt,
          url: `/communication/spaces?message=${m.id}`,
        })),
      );
    }

    if (scope === "ALL" || scope === "KNOWLEDGE") {
      const articles = await prisma.knowledgeArticle.findMany({
        where: {
          tenantId,
          status: "PUBLISHED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        take: scope === "ALL" ? 5 : limit,
        orderBy: { viewCount: "desc" },
        include: { category: { select: { name: true } } },
      });
      results.push(
        ...articles.map((a) => ({
          type: "article",
          id: a.id,
          title: a.title,
          category: a.category?.name,
          createdAt: a.createdAt,
          url: `/communication/knowledge/${a.id}`,
        })),
      );
    }

    if (scope === "ALL" || scope === "TICKETS") {
      const tickets = await prisma.helpdeskTicket.findMany({
        where: {
          tenantId,
          OR: [
            { subject: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: scope === "ALL" ? 5 : limit,
        orderBy: { createdAt: "desc" },
      });
      results.push(
        ...tickets.map((t) => ({
          type: "ticket",
          id: t.id,
          title: t.subject,
          status: t.status,
          createdAt: t.createdAt,
          url: `/communication/helpdesk/${t.id}`,
        })),
      );
    }

    if (scope === "ALL" || scope === "CHANNELS") {
      const channels = await prisma.channel.findMany({
        where: { tenantId, name: { contains: query, mode: "insensitive" } },
        take: scope === "ALL" ? 5 : limit,
      });
      results.push(
        ...channels.map((c) => ({
          type: "channel",
          id: c.id,
          title: `#${c.name}`,
          createdAt: c.createdAt,
          url: `/communication/spaces?channel=${c.id}`,
        })),
      );
    }

    if (scope === "ALL" || scope === "FILES") {
      const files = await prisma.message.findMany({
        where: { tenantId },
        take: scope === "ALL" ? 5 : limit,
        orderBy: { createdAt: "desc" },
      });
      const fileResults = files
        .filter((m) => {
          const atts = (m.attachments as any[]) || [];
          return (
            atts.length > 0 &&
            atts.some((a: any) =>
              (a.name || "").toLowerCase().includes(query.toLowerCase()),
            )
          );
        })
        .map((m) => ({
          type: "file",
          id: m.id,
          title: "File from message",
          createdAt: m.createdAt,
          url: `/communication/spaces?message=${m.id}`,
        }));
      results.push(...fileResults);
    }

    await prisma.searchHistory.create({
      data: { tenantId, userId, query, scope, resultCount: results.length },
    });

    const offset = (page - 1) * limit;
    return {
      data: results.slice(offset, offset + limit),
      total: results.length,
      page,
      limit,
      query,
    };
  }

  async saveSearchQuery(
    tenantId: string,
    userId: string,
    dto: { name: string; query: string; filters?: any; scope?: string },
  ) {
    return prisma.savedSearch.create({
      data: {
        tenantId,
        userId,
        name: dto.name,
        query: dto.query,
        filters: dto.filters || {},
        scope: dto.scope || "ALL",
      },
    });
  }

  async getSavedSearches(tenantId: string, userId: string) {
    return prisma.savedSearch.findMany({
      where: { tenantId, userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async deleteSavedSearch(tenantId: string, userId: string, id: string) {
    const existing = await prisma.savedSearch.findFirst({
      where: { id, tenantId, userId },
    });
    // The lookup above is scoped to this user, so a miss means either "no such
    // saved search" or "it belongs to someone else". Both are a 404 — returning
    // null instead made the endpoint answer 200 for a delete that deleted
    // nothing, and told a caller probing another user's id that the request had
    // succeeded.
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException("Saved search not found");
    }
    // The ownership check is asserted explicitly rather than left entirely to
    // the `where` clause above. If a later refactor drops `userId` from that
    // query — an easy thing to do while "simplifying" a filter — this line is
    // what still stops one user deleting another's saved search.
    return prisma.savedSearch.delete({ where: { id } });
  }

  async getSearchHistory(tenantId: string, userId: string, limit = 20) {
    return prisma.searchHistory.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getSearchAnalytics(tenantId: string) {
    const [totalSearches, topQueries, searchesToday] = await Promise.all([
      prisma.searchHistory.count({ where: { tenantId } }),
      prisma.searchHistory.groupBy({
        by: ["query"],
        where: { tenantId },
        _count: true,
        orderBy: { _count: { query: "desc" } },
        take: 10,
      }),
      prisma.searchHistory.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);
    return { totalSearches, topQueries, searchesToday };
  }

  async reindexEntity(_tenantId: string, entityType: string, entityId: string) {
    return { message: `Reindexing triggered for ${entityType}:${entityId}` };
  }

  async getSynonyms(tenantId: string) {
    return prisma.synonymDictionary.findMany({ where: { tenantId } });
  }

  async createSynonym(
    tenantId: string,
    dto: { term: string; synonyms: string[] },
  ) {
    return prisma.synonymDictionary.create({
      data: { tenantId, term: dto.term, synonyms: dto.synonyms },
    });
  }
}

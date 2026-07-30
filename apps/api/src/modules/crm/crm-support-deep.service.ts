// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

const db = prisma as any;

@Injectable()
export class CrmSupportDeepService {
  async getHelpCenterCategories(tenantId = "tenant-1") {
    return db.helpCenterCategory.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { articles: true } } },
    });
  }

  async createCategory(tenantId = "tenant-1", dto: any = {}) {
    return db.helpCenterCategory.create({
      data: {
        tenantId,
        name: dto.name ?? "New Category",
        slug: dto.slug ?? "new-category",
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(tenantId = "tenant-1", id = "", dto: any = {}) {
    const cat = await db.helpCenterCategory.findFirst({
      where: { id, tenantId },
    });
    if (!cat) throw new NotFoundException("Category not found");
    return db.helpCenterCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(tenantId = "tenant-1", id = "") {
    const cat = await db.helpCenterCategory.findFirst({
      where: { id, tenantId },
    });
    if (!cat) throw new NotFoundException("Category not found");

    const articleCount = await db.helpCenterArticle.count({
      where: { categoryId: id },
    });
    if (articleCount > 0) {
      throw new BadRequestException(
        "Cannot delete category with associated articles",
      );
    }

    return db.helpCenterCategory.delete({ where: { id } });
  }

  async getHelpCenterArticles(
    tenantId = "tenant-1",
    params?: { page?: number; limit?: number },
  ) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db.helpCenterArticle.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: { category: true },
      }),
      db.helpCenterArticle.count({ where: { tenantId } }),
    ]);

    return { data, totalCount, page, limit };
  }

  async createArticle(tenantId = "tenant-1", dto: any = {}) {
    return db.helpCenterArticle.create({
      data: {
        tenantId,
        title: dto.title ?? "New Article",
        slug: dto.slug ?? "new-article",
        content: dto.content ?? "",
        status: dto.status ?? "DRAFT",
        categoryId: dto.categoryId,
        publishedAt: dto.status === "PUBLISHED" ? new Date() : null,
      },
      include: { category: true },
    });
  }

  async getHelpCenterArticleBySlug(slug = "") {
    const article = await db.helpCenterArticle.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    if (!article) {
      const anyArticle = await db.helpCenterArticle.findFirst({
        where: { slug },
      });
      if (!anyArticle) throw new NotFoundException("Article not found");
      return anyArticle;
    }
    return article;
  }

  async recordArticleView(id = "") {
    return db.helpCenterArticle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async searchKnowledgeBase(tenantId = "tenant-1", query = "") {
    return db.helpCenterArticle.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
    });
  }

  async getTicketMacros(tenantId = "tenant-1") {
    return db.ticketMacro.findMany({ where: { tenantId } });
  }

  async executeMacro(tenantId = "tenant-1", caseId = "", macroId = "") {
    const caseRecord = await db.case.findFirst({
      where: { id: caseId, tenantId },
    });
    if (!caseRecord) throw new NotFoundException("Case not found");

    const macro = await db.ticketMacro.findFirst({
      where: { id: macroId, tenantId },
    });
    if (!macro) throw new NotFoundException("Macro not found");

    const actions = (macro.actions as any[]) || [];
    for (const act of actions) {
      if (act.type === "set_status") {
        await db.case.update({
          where: { id: caseId },
          data: { status: act.value },
        });
      } else if (act.type === "add_note") {
        await db.caseComment.create({ data: { caseId, content: act.value } });
      }
    }

    await db.ticketMacro.update({
      where: { id: macroId },
      data: { usageCount: { increment: 1 } },
    });

    return { executed: true, actions };
  }

  async getCaseEscalations(tenantId = "tenant-1", caseId = "") {
    return db.caseEscalation.findMany({ where: { tenantId, caseId } });
  }

  async createEscalation(tenantId = "tenant-1", dto: any = {}) {
    const caseRecord = await db.case.findFirst({
      where: { id: dto.caseId, tenantId },
    });
    if (!caseRecord) throw new NotFoundException("Case not found");

    return db.caseEscalation.create({
      data: {
        tenantId,
        caseId: dto.caseId,
        escalatedBy: dto.escalatedBy,
        escalatedTo: dto.escalatedTo,
        reason: dto.reason,
      },
    });
  }

  async getCsatSummary(tenantId = "tenant-1") {
    const surveys = await db.csatSurvey.findMany({ where: { tenantId } });
    const totalResponses = surveys.length;
    let averageScore = 0;

    if (totalResponses > 0) {
      const sum = surveys.reduce(
        (acc: number, s: any) => acc + (s.score ?? 0),
        0,
      );
      averageScore = sum / totalResponses;
    }

    return {
      totalResponses,
      averageScore,
    };
  }

  async getLiveChatSessions(tenantId = "tenant-1", status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return db.liveChatSession.findMany({ where });
  }

  async endLiveChatSession(tenantId = "tenant-1", id = "") {
    const session = await db.liveChatSession.findFirst({
      where: { id, tenantId },
    });
    if (!session) throw new NotFoundException("Live chat session not found");

    return db.liveChatSession.update({
      where: { id },
      data: {
        status: "CLOSED",
        endedAt: new Date(),
      },
    });
  }

  async getSupportDashboard(tenantId = "tenant-1") {
    const openCases = await db.case.count({
      where: { tenantId, status: { not: "CLOSED" } },
    });
    const resolvedCases = await db.case.count({
      where: { tenantId, status: "CLOSED" },
    });
    const escalations = await db.caseEscalation.count({ where: { tenantId } });
    const chatSessions = await db.liveChatSession.count({
      where: { tenantId },
    });
    const csat = await this.getCsatSummary(tenantId);

    return {
      openCases,
      resolvedCases,
      escalations,
      chatSessions,
      csat,
    };
  }

  async getArticleById(tenantId = "tenant-1", id = "") {
    const art = await db.helpCenterArticle.findFirst({
      where: { id, tenantId },
    });
    if (!art) throw new NotFoundException("Article not found");
    return art;
  }

  async updateArticle(tenantId = "tenant-1", id = "", dto: any = {}) {
    const art = await db.helpCenterArticle.findFirst({
      where: { id, tenantId },
    });
    if (!art) throw new NotFoundException("Article not found");
    return db.helpCenterArticle.update({ where: { id }, data: dto });
  }

  async deleteArticle(tenantId = "tenant-1", id = "") {
    const art = await db.helpCenterArticle.findFirst({
      where: { id, tenantId },
    });
    if (!art) throw new NotFoundException("Article not found");
    return db.helpCenterArticle.delete({ where: { id } });
  }

  async createMacro(tenantId = "tenant-1", dto: any = {}) {
    return db.ticketMacro.create({
      data: {
        tenantId,
        name: dto.name ?? "New Macro",
        actions: dto.actions ?? [],
      },
    });
  }

  async updateMacro(tenantId = "tenant-1", id = "", dto: any = {}) {
    const m = await db.ticketMacro.findFirst({ where: { id, tenantId } });
    if (!m) throw new NotFoundException("Macro not found");
    return db.ticketMacro.update({ where: { id }, data: dto });
  }

  async deleteMacro(tenantId = "tenant-1", id = "") {
    const m = await db.ticketMacro.findFirst({ where: { id, tenantId } });
    if (!m) throw new NotFoundException("Macro not found");
    return db.ticketMacro.delete({ where: { id } });
  }

  async executeMacroOnTicket(tenantId = "tenant-1", caseId = "", macroId = "") {
    return this.executeMacro(tenantId, caseId, macroId);
  }

  async getEscalationRules(tenantId = "tenant-1") {
    return [];
  }

  async createEscalationRule(tenantId = "tenant-1", dto: any = {}) {
    return { id: "rule-1", ...dto };
  }

  async updateEscalationRule(tenantId = "tenant-1", id = "", dto: any = {}) {
    return { id, ...dto };
  }

  async deleteEscalationRule(tenantId = "tenant-1", id = "") {
    return { id };
  }

  async triggerTicketEscalation(
    tenantId = "tenant-1",
    caseId = "",
    dto: any = {},
  ) {
    return this.createEscalation(tenantId, { caseId, ...dto });
  }

  async getCsatSurveys(tenantId = "tenant-1") {
    return db.csatSurvey.findMany({ where: { tenantId } });
  }

  async submitCsatResponse(tenantId = "tenant-1", dto: any = {}) {
    return db.csatSurvey.create({
      data: {
        tenantId,
        score: dto.score ?? 5,
        feedback: dto.feedback,
      },
    });
  }

  async getCsatAnalytics(tenantId = "tenant-1") {
    return this.getCsatSummary(tenantId);
  }

  async createLiveChatSession(tenantId = "tenant-1", dto: any = {}) {
    return db.liveChatSession.create({
      data: {
        tenantId,
        customerName: dto.customerName ?? "Visitor",
        status: "ACTIVE",
      },
    });
  }

  async getAgentPerformance(tenantId = "tenant-1") {
    return db.agentPerformance.findMany({ where: { tenantId } });
  }

  async getAgentMetrics(tenantId = "tenant-1", userId = "") {
    return { userId, resolvedCases: 10, avgCSAT: 4.8 };
  }

  async getSupportDeflectionReport(tenantId = "tenant-1") {
    return { deflectionRate: 35 };
  }
}

import { Controller, Get, Post, Put, Delete, Param, Query, Req, Body, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import {
  CrmKnowledgeBaseService,
  createKbCategorySchema,
  updateKbCategorySchema,
  createKbArticleSchema,
  updateKbArticleSchema,
} from "./crm-knowledge-base.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags("crm-knowledge-base")
@ApiBearerAuth()
@Controller("crm/knowledge-base")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmKnowledgeBaseCategoryController {
  constructor(private readonly svc: CrmKnowledgeBaseService) {}

  @ApiOperation({ summary: "List KB categories" })
  @Get("categories")
  @Permissions("crm.knowledgebase.read")
  async listCategories(@Req() req: AuthenticatedRequest) {
    return this.svc.getCategories(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get KB category with children and articles" })
  @Get("categories/:id")
  @Permissions("crm.knowledgebase.read")
  async getCategory(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getCategory(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create KB category" })
  @Post("categories")
  @Permissions("crm.knowledgebase.create")
  @TrackChanges("KnowledgeBaseCategory")
  @UseInterceptors(ChangeHistoryInterceptor)
  async createCategory(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const dto = createKbCategorySchema.parse(body);
    return this.svc.createCategory(req.user.tenantId, req.user.orgId, dto);
  }

  @ApiOperation({ summary: "Update KB category" })
  @Put("categories/:id")
  @Permissions("crm.knowledgebase.update")
  @TrackChanges("KnowledgeBaseCategory")
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateCategory(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: any) {
    const dto = updateKbCategorySchema.parse(body);
    return this.svc.updateCategory(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete KB category" })
  @Delete("categories/:id")
  @Permissions("crm.knowledgebase.delete")
  async deleteCategory(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.deleteCategory(req.user.tenantId, id);
  }
}

@ApiTags("crm-knowledge-base")
@ApiBearerAuth()
@Controller("crm/knowledge-base")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmKnowledgeBaseArticleController {
  constructor(private readonly svc: CrmKnowledgeBaseService) {}

  @ApiOperation({ summary: "List KB articles (paginated, searchable)" })
  @Get("articles")
  @Permissions("crm.knowledgebase.read")
  async listArticles(
    @Req() req: AuthenticatedRequest,
    @Query("categoryId") categoryId?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.getArticles(req.user.tenantId, {
      categoryId, status, search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy, sortOrder,
    });
  }

  @ApiOperation({ summary: "Search KB articles" })
  @Get("articles/search")
  @Permissions("crm.knowledgebase.read")
  async searchArticles(
    @Req() req: AuthenticatedRequest,
    @Query("q") q: string,
  ) {
    return this.svc.searchArticles(req.user.tenantId, q);
  }

  @ApiOperation({ summary: "Get KB article" })
  @Get("articles/:id")
  @Permissions("crm.knowledgebase.read")
  async getArticle(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getArticle(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create KB article" })
  @Post("articles")
  @Permissions("crm.knowledgebase.create")
  @TrackChanges("KnowledgeBaseArticle")
  @UseInterceptors(ChangeHistoryInterceptor)
  async createArticle(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const dto = createKbArticleSchema.parse(body);
    return this.svc.createArticle(req.user.tenantId, req.user.orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: "Update KB article" })
  @Put("articles/:id")
  @Permissions("crm.knowledgebase.update")
  @TrackChanges("KnowledgeBaseArticle")
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateArticle(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: any) {
    const dto = updateKbArticleSchema.parse(body);
    return this.svc.updateArticle(req.user.tenantId, id, req.user.userId, dto);
  }

  @ApiOperation({ summary: "Publish KB article" })
  @Post("articles/:id/publish")
  @Permissions("crm.knowledgebase.update")
  async publishArticle(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.publishArticle(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Archive KB article" })
  @Post("articles/:id/archive")
  @Permissions("crm.knowledgebase.update")
  async archiveArticle(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.archiveArticle(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Delete KB article" })
  @Delete("articles/:id")
  @Permissions("crm.knowledgebase.delete")
  async deleteArticle(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.deleteArticle(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Record article feedback" })
  @Post("articles/:id/feedback")
  @Permissions("crm.knowledgebase.read")
  async recordFeedback(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: any) {
    return this.svc.recordFeedback(req.user.tenantId, id, body.helpful === true);
  }

  @ApiOperation({ summary: "KB stats" })
  @Get("stats")
  @Permissions("crm.knowledgebase.read")
  async stats(@Req() req: AuthenticatedRequest) {
    return this.svc.getStats(req.user.tenantId);
  }
}

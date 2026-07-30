// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SearchService } from "./search.service";
import { SearchConfigService } from "./search-config.service";
import { SearchSynonymsService } from "./search-synonyms.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const querySchema = z.string().trim().min(2).max(200);

const indexSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  module: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string().min(1),
  filters: z.record(z.any()).optional(),
  scope: z.string().optional(),
});

const indexRuleSchema = z.object({
  entityType: z.string().min(1),
  module: z.string().min(1),
  fields: z.array(z.string()).min(1),
  weight: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

@ApiTags("search")
@ApiBearerAuth()
@Controller("search")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SearchController {
  constructor(
    private readonly service: SearchService,
    private readonly configService: SearchConfigService,
    private readonly synonymsService: SearchSynonymsService,
  ) {}

  @ApiOperation({ summary: "Get search index configs" })
  @Get("index-configs")
  @Permissions("search.rules.read")
  async getIndexConfigs(@Req() req: AuthenticatedRequest) {
    return this.configService.getIndexConfigs(req.user.tenantId);
  }

  @ApiOperation({ summary: "Upsert search index config" })
  @Post("index-configs/:entityType")
  @Permissions("search.rules.create")
  async upsertIndexConfig(
    @Req() req: AuthenticatedRequest,
    @Param("entityType") entityType: string,
    @Body() body: any,
  ) {
    return this.configService.upsertIndexConfig(
      req.user.tenantId,
      entityType,
      body,
    );
  }

  @ApiOperation({ summary: "List synonym groups" })
  @Get("synonyms")
  @Permissions("search.rules.read")
  async getSynonyms(@Req() req: AuthenticatedRequest) {
    return this.synonymsService.getSynonymGroups(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create synonym group" })
  @Post("synonyms")
  @Permissions("search.rules.create")
  async createSynonymGroup(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.synonymsService.createSynonymGroup(req.user.tenantId, body);
  }

  @ApiOperation({
    summary: "Global tenant-scoped entity search (RBAC-filtered per entity)",
  })
  @Get("global")
  @Permissions("search.global.read")
  async global(@Req() req: AuthenticatedRequest, @Query("q") q: string) {
    const parsed = querySchema.safeParse(q ?? "");
    if (!parsed.success) return { data: [] };
    const data = await this.service.globalSearch(
      req.user.tenantId,
      req.user.userId,
      parsed.data,
    );
    return { data };
  }

  @ApiOperation({ summary: "Full-text search across indexed content" })
  @Get("query")
  @Permissions("search.query.read")
  async query(
    @Req() req: AuthenticatedRequest,
    @Query("q") q: string,
    @Query("module") module?: string,
    @Query("entityType") entityType?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const parsed = querySchema.safeParse(q ?? "");
    if (!parsed.success) return { data: [], total: 0 };
    const start = Date.now();
    const result = await this.service.fulltextSearch(
      req.user.tenantId,
      parsed.data,
      {
        module,
        entityType,
        limit: limit ? parseInt(limit, 10) : 20,
        offset: page
          ? (parseInt(page, 10) - 1) * (limit ? parseInt(limit, 10) : 20)
          : 0,
      },
    );
    this.service.logSearchQuery(req.user.tenantId, req.user.userId, {
      query: parsed.data,
      entityTypes: entityType ? [entityType] : [],
      resultCount: result.total,
      executionMs: Date.now() - start,
    });
    return result;
  }

  @ApiOperation({ summary: "Index content for search" })
  @Post("index")
  @Permissions("search.index.create")
  async index(
    @Req() req: AuthenticatedRequest,
    @ZodBody(indexSchema) body: z.infer<typeof indexSchema>,
  ) {
    return this.service.indexContent(
      req.user.tenantId,
      body.entityType,
      body.entityId,
      body,
    );
  }

  @ApiOperation({ summary: "Remove indexed content" })
  @Delete("index/:entityType/:entityId")
  @Permissions("search.index.delete")
  async removeIndex(
    @Req() req: AuthenticatedRequest,
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
  ) {
    return this.service.removeIndex(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: "Reindex a specific entity" })
  @Post("index/:entityType/:entityId/reindex")
  @Permissions("search.index.create")
  async reindex(
    @Req() req: AuthenticatedRequest,
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
  ) {
    return this.service.reindexEntity(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: "Get search index rules" })
  @Get("rules")
  @Permissions("search.rules.read")
  async getRules(
    @Req() req: AuthenticatedRequest,
    @Query("module") module?: string,
  ) {
    return this.service.getIndexRules(req.user.tenantId, module);
  }

  @ApiOperation({ summary: "Create or update a search index rule" })
  @Post("rules")
  @Permissions("search.rules.create")
  async upsertRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(indexRuleSchema) body: z.infer<typeof indexRuleSchema>,
  ) {
    return this.service.upsertIndexRule(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Delete a search index rule" })
  @Delete("rules/:id")
  @Permissions("search.rules.delete")
  async deleteRule(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.deleteIndexRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Save a search" })
  @Post("saved")
  @Permissions("search.saved.create")
  async saveSearch(
    @Req() req: AuthenticatedRequest,
    @ZodBody(savedSearchSchema) body: z.infer<typeof savedSearchSchema>,
  ) {
    return this.service.saveSearch(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: "Get saved searches" })
  @Get("saved")
  @Permissions("search.saved.read")
  async getSavedSearches(@Req() req: AuthenticatedRequest) {
    return this.service.getSavedSearches(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: "Delete a saved search" })
  @Delete("saved/:id")
  @Permissions("search.saved.delete")
  async deleteSavedSearch(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteSavedSearch(
      req.user.tenantId,
      req.user.userId,
      id,
    );
  }

  @ApiOperation({ summary: "Get recent searches" })
  @Get("recent")
  @Permissions("search.recent.read")
  async getRecentSearches(
    @Req() req: AuthenticatedRequest,
    @Query("limit") limit?: string,
  ) {
    return this.service.getRecentSearches(
      req.user.tenantId,
      req.user.userId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @ApiOperation({ summary: "Clear recent searches" })
  @Delete("recent")
  @Permissions("search.recent.delete")
  async clearRecentSearches(@Req() req: AuthenticatedRequest) {
    return this.service.clearRecentSearches(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: "Get search analytics" })
  @Get("analytics")
  @Permissions("search.analytics.read")
  async getAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.service.getSearchAnalytics(
      req.user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}

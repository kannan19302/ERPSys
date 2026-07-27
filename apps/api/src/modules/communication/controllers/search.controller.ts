import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { CommunicationSearchService } from "../services/communication-search.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("communication-search")
@ApiBearerAuth()
@Controller("communication/enterprise-search")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SearchController {
  constructor(private readonly svc: CommunicationSearchService) {}

  @Get("search")
  @Permissions("communication.search.read")
  @ApiOperation({ summary: "Full-text search across communication" })
  async fullTextSearch(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.fullTextSearch(
      req.user.tenantId,
      req.user.userId,
      q.query || "",
      q,
    );
  }

  @Post("saved")
  @Permissions("communication.search.create")
  @ApiOperation({ summary: "Save search query" })
  async saveSearch(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.saveSearchQuery(
      req.user.tenantId,
      req.user.userId,
      body.body,
    );
  }

  @Get("saved")
  @Permissions("communication.search.read")
  @ApiOperation({ summary: "List saved searches" })
  async getSavedSearches(@Req() req: AuthReq) {
    return this.svc.getSavedSearches(req.user.tenantId, req.user.userId);
  }

  @Delete("saved/:id")
  @Permissions("communication.search.delete")
  @ApiOperation({ summary: "Delete saved search" })
  async deleteSavedSearch(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteSavedSearch(req.user.tenantId, req.user.userId, id);
  }

  @Get("history")
  @Permissions("communication.search.read")
  @ApiOperation({ summary: "Get search history" })
  async getSearchHistory(@Req() req: AuthReq, @Query("limit") limit?: string) {
    return this.svc.getSearchHistory(
      req.user.tenantId,
      req.user.userId,
      parseInt(limit || "20"),
    );
  }

  @Get("analytics")
  @Permissions("communication.search.read")
  @ApiOperation({ summary: "Get search analytics" })
  async getSearchAnalytics(@Req() req: AuthReq) {
    return this.svc.getSearchAnalytics(req.user.tenantId);
  }

  @Post("reindex/:entityType/:entityId")
  @Permissions("communication.search.create")
  @ApiOperation({ summary: "Reindex entity" })
  async reindexEntity(
    @Req() req: AuthReq,
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
  ) {
    return this.svc.reindexEntity(req.user.tenantId, entityType, entityId);
  }

  @Get("synonyms")
  @Permissions("communication.search.read")
  @ApiOperation({ summary: "List synonyms" })
  async getSynonyms(@Req() req: AuthReq) {
    return this.svc.getSynonyms(req.user.tenantId);
  }

  @Post("synonyms")
  @Permissions("communication.search.create")
  @ApiOperation({ summary: "Create synonym" })
  async createSynonym(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createSynonym(req.user.tenantId, body.body);
  }
}

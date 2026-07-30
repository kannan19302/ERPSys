// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { CommunicationKnowledgeService } from "../services/communication-knowledge.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("communication-knowledge")
@ApiBearerAuth()
@Controller("communication/knowledge")
@UseGuards(JwtAuthGuard, RbacGuard)
export class KnowledgeBaseController {
  constructor(private readonly svc: CommunicationKnowledgeService) {}

  @Get("articles")
  @Permissions("communication.knowledge.read")
  @ApiOperation({ summary: "List knowledge articles" })
  async getArticles(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getArticles(req.user.tenantId, q);
  }

  @Get("articles/:id")
  @Permissions("communication.knowledge.read")
  @ApiOperation({ summary: "Get knowledge article" })
  async getArticle(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getArticle(req.user.tenantId, id);
  }

  @Post("articles")
  @Permissions("communication.knowledge.create")
  @ApiOperation({ summary: "Create knowledge article" })
  async createArticle(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createArticle(
      req.user.tenantId,
      req.user.userId,
      body.body,
    );
  }

  @Patch("articles/:id")
  @Permissions("communication.knowledge.update")
  @ApiOperation({ summary: "Update knowledge article" })
  async updateArticle(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.updateArticle(
      req.user.tenantId,
      id,
      req.user.userId,
      body.body,
    );
  }

  @Patch("articles/:id/publish")
  @Permissions("communication.knowledge.update")
  @ApiOperation({ summary: "Publish knowledge article" })
  async publishArticle(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.publishArticle(req.user.tenantId, id);
  }

  @Delete("articles/:id")
  @Permissions("communication.knowledge.delete")
  @ApiOperation({ summary: "Delete knowledge article" })
  async deleteArticle(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteArticle(req.user.tenantId, id);
  }

  @Get("articles/search")
  @Permissions("communication.knowledge.read")
  @ApiOperation({ summary: "Search knowledge articles" })
  async searchArticles(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.searchArticles(req.user.tenantId, q.query || "", q);
  }

  @Get("articles/:articleId/versions")
  @Permissions("communication.knowledge.read")
  @ApiOperation({ summary: "Get article versions" })
  async getArticleVersions(
    @Req() req: AuthReq,
    @Param("articleId") articleId: string,
  ) {
    return this.svc.getArticleVersions(req.user.tenantId, articleId);
  }

  @Get("articles/:articleId/versions/:version")
  @Permissions("communication.knowledge.read")
  @ApiOperation({ summary: "Get article version" })
  async getArticleVersion(
    @Req() req: AuthReq,
    @Param("articleId") articleId: string,
    @Param("version") version: string,
  ) {
    return this.svc.getArticleVersion(
      req.user.tenantId,
      articleId,
      parseInt(version),
    );
  }

  @Post("articles/:id/rate")
  @Permissions("communication.knowledge.create")
  @ApiOperation({ summary: "Rate knowledge article" })
  async rateArticle(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.rateArticle(
      req.user.tenantId,
      id,
      req.user.userId,
      body.body,
    );
  }

  @Get("categories")
  @Permissions("communication.knowledge.read")
  @ApiOperation({ summary: "List knowledge categories" })
  async getCategories(@Req() req: AuthReq) {
    return this.svc.getCategories(req.user.tenantId);
  }

  @Post("categories")
  @Permissions("communication.knowledge.create")
  @ApiOperation({ summary: "Create knowledge category" })
  async createCategory(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createCategory(req.user.tenantId, body.body);
  }

  @Delete("categories/:id")
  @Permissions("communication.knowledge.delete")
  @ApiOperation({ summary: "Delete knowledge category" })
  async deleteCategory(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteCategory(req.user.tenantId, id);
  }

  @Get("dashboard")
  @Permissions("communication.knowledge.read")
  @ApiOperation({ summary: "Knowledge dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getKnowledgeDashboard(req.user.tenantId);
  }
}

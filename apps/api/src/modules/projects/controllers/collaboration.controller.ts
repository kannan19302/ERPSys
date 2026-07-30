// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsCollaborationService } from "../services/projects-collaboration.service";
import {
  PostDiscussionSchema,
  ReplyToDiscussionSchema,
  CreateDocumentReviewSchema,
  CreateWikiPageSchema,
  UpdateReviewSchema,
  UpdateWikiSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("projects-collaboration")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CollaborationController {
  constructor(private readonly service: ProjectsCollaborationService) {}

  @Get(":projectId/discussions")
  @Permissions("projects.discussion.read")
  async getDiscussions(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getDiscussions(req.user.tenantId, projectId);
  }

  @Post("discussions")
  @Permissions("projects.discussion.create")
  async postDiscussion(
    @Req() req: AuthenticatedRequest,
    @ZodBody(PostDiscussionSchema) dto: unknown,
  ) {
    return this.service.postDiscussion(
      req.user.tenantId,
      dto as any,
      req.user.userId,
    );
  }

  @Post("discussions/:discussionId/replies")
  @Permissions("projects.discussion.create")
  async replyToDiscussion(
    @Req() req: AuthenticatedRequest,
    @Param("discussionId") discussionId: string,
    @ZodBody(ReplyToDiscussionSchema) dto: unknown,
  ) {
    return this.service.replyToDiscussion(
      req.user.tenantId,
      discussionId,
      dto as any,
      req.user.userId,
    );
  }

  @Post("discussions/replies/:replyId/solution")
  @Permissions("projects.discussion.update")
  async markAsSolution(
    @Req() req: AuthenticatedRequest,
    @Param("replyId") replyId: string,
  ) {
    return this.service.markAsSolution(req.user.tenantId, replyId);
  }

  @Post("discussions/:discussionId/toggle-pin")
  @Permissions("projects.discussion.update")
  async togglePinDiscussion(
    @Req() req: AuthenticatedRequest,
    @Param("discussionId") discussionId: string,
  ) {
    return this.service.togglePinDiscussion(req.user.tenantId, discussionId);
  }

  @Post("document-reviews")
  @Permissions("projects.document-review.create")
  async createDocumentReview(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateDocumentReviewSchema) dto: unknown,
  ) {
    return this.service.createDocumentReview(req.user.tenantId, dto as any);
  }

  @Put("document-reviews/:reviewId")
  @Permissions("projects.document-review.update")
  async updateDocumentReview(
    @Req() req: AuthenticatedRequest,
    @Param("reviewId") reviewId: string,
    @ZodBody(UpdateReviewSchema) dto: unknown,
  ) {
    return this.service.updateDocumentReview(
      req.user.tenantId,
      reviewId,
      dto as any,
    );
  }

  @Get(":projectId/document-reviews")
  @Permissions("projects.document-review.read")
  async getDocumentReviews(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getDocumentReviews(req.user.tenantId, projectId);
  }

  @Get(":projectId/feed")
  @Permissions("projects.feed.read")
  async getProjectFeed(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getProjectFeed(req.user.tenantId, projectId);
  }

  @Get(":projectId/wiki/:slug")
  @Permissions("projects.wiki.read")
  async getWikiPage(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
    @Param("slug") slug: string,
  ) {
    return this.service.getWikiPage(req.user.tenantId, projectId, slug);
  }

  @Post("wiki")
  @Permissions("projects.wiki.create")
  async createWikiPage(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateWikiPageSchema) dto: unknown,
  ) {
    return this.service.createWikiPage(
      req.user.tenantId,
      dto as any,
      req.user.userId,
    );
  }

  @Put("wiki/:wikiPageId")
  @Permissions("projects.wiki.update")
  async updateWikiPage(
    @Req() req: AuthenticatedRequest,
    @Param("wikiPageId") wikiPageId: string,
    @ZodBody(UpdateWikiSchema) dto: unknown,
  ) {
    return this.service.updateWikiPage(
      req.user.tenantId,
      wikiPageId,
      dto as any,
      req.user.userId,
    );
  }

  @Get(":projectId/collaboration-dashboard")
  @Permissions("projects.discussion.read")
  async getCollaborationDashboard(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getCollaborationDashboard(req.user.tenantId, projectId);
  }
}

// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { MarketplaceDeepService } from "./marketplace-deep.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; name?: string; roles: string[] };
}

@ApiTags("marketplace")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("marketplace")
export class MarketplaceDeepController {
  constructor(private readonly marketplaceDeepService: MarketplaceDeepService) {}

  /* ─── App Reviews & Ratings ─── */

  @ApiOperation({ summary: "Get app reviews with aggregate ratings" })
  @Get("apps/:id/reviews")
  @Permissions("marketplace.review.read")
  async getAppReviews(@Param("id") id: string, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.marketplaceDeepService.getAppReviews(id, { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 });
  }

  @ApiOperation({ summary: "Create app review" })
  @Post("apps/:id/reviews")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("marketplace.review.create")
  async createAppReview(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ rating: z.number().int().min(1).max(5), title: z.string().max(200).optional(), body: z.string().max(5000).optional() })) body: { rating: number; title?: string; body?: string }) {
    return this.marketplaceDeepService.createAppReview(id, req.user.userId, req.user.name ?? req.user.email, req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update app review" })
  @Put("reviews/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("marketplace.review.update")
  async updateAppReview(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ rating: z.number().int().min(1).max(5).optional(), title: z.string().max(200).optional(), body: z.string().max(5000).optional() })) body: { rating?: number; title?: string; body?: string }) {
    return this.marketplaceDeepService.updateAppReview(req.user.tenantId, req.user.userId, id, body);
  }

  @ApiOperation({ summary: "Delete app review" })
  @Delete("reviews/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("marketplace.review.delete")
  async deleteAppReview(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.marketplaceDeepService.deleteAppReview(req.user.tenantId, req.user.userId, id);
  }

  /* ─── App Version History ─── */

  @ApiOperation({ summary: "Get app version history" })
  @Get("apps/:id/versions")
  @Permissions("marketplace.version.read")
  async getAppVersions(@Param("id") id: string) {
    return this.marketplaceDeepService.getAppVersions(id);
  }

  @ApiOperation({ summary: "Create app version" })
  @Post("apps/:id/versions")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("marketplace.version.create")
  async createAppVersion(@Param("id") id: string, @ZodBody(z.object({ version: z.string().min(1), changelog: z.string().optional(), fileUrl: z.string().optional() })) body: { version: string; changelog?: string; fileUrl?: string }) {
    return this.marketplaceDeepService.createAppVersion(id, body);
  }

  /* ─── Developer Submission Workflow ─── */

  @ApiOperation({ summary: "List developer submissions" })
  @Get("submissions")
  @Permissions("marketplace.submission.read")
  async listSubmissions(@Req() req: AuthenticatedRequest, @Query("status") status?: string) {
    return this.marketplaceDeepService.listSubmissions(req.user.tenantId, status);
  }

  @ApiOperation({ summary: "Create developer submission" })
  @Post("submissions")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("marketplace.submission.create")
  async createSubmission(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string().min(1), slug: z.string().min(1), description: z.string().min(1), category: z.string().min(1), icon: z.string().optional() })) body: { name: string; slug: string; description: string; category: string; icon?: string }) {
    return this.marketplaceDeepService.createSubmission(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: "Approve developer submission" })
  @Post("submissions/:id/approve")
  @HttpCode(HttpStatus.OK)
  @Permissions("marketplace.submission.review")
  async approveSubmission(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ notes: z.string().optional() })) body: { notes?: string }) {
    return this.marketplaceDeepService.reviewSubmission(req.user.tenantId, id, req.user.userId, "APPROVED", body.notes);
  }

  @ApiOperation({ summary: "Reject developer submission" })
  @Post("submissions/:id/reject")
  @HttpCode(HttpStatus.OK)
  @Permissions("marketplace.submission.review")
  async rejectSubmission(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ notes: z.string().optional() })) body: { notes?: string }) {
    return this.marketplaceDeepService.reviewSubmission(req.user.tenantId, id, req.user.userId, "REJECTED", body.notes);
  }

  /* ─── Marketplace Analytics ─── */

  @ApiOperation({ summary: "Get marketplace analytics" })
  @Get("analytics")
  @Permissions("marketplace.analytics.read")
  async getAnalytics(@Query("from") from?: string, @Query("to") to?: string, @Query("appId") appId?: string, @Query("top") top?: string) {
    return this.marketplaceDeepService.getAnalytics({ from, to, appId, top: top ? parseInt(top) : undefined });
  }
}

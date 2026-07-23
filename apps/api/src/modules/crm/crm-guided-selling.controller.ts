import { z } from "zod";
import { Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { CrmGuidedSellingService, nextBestActionConfigSchema, guidedSellingPlaybookSchema } from "./crm-guided-selling.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags("crm-guided-selling")
@ApiBearerAuth()
@Controller("crm/guided-selling")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmNextBestActionConfigController {
  constructor(private readonly svc: CrmGuidedSellingService) {}

  @Post("actions")
  @Permissions("crm.guided-selling.manage")
  @ApiOperation({ summary: "Create next-best-action config" })
  async createAction(@Req() req: AuthRequest, @ZodBody(nextBestActionConfigSchema) body: unknown) {
    return this.svc.createActionConfig(req.user.tenantId, body as any);
  }

  @Get("actions")
  @Permissions("crm.guided-selling.read")
  @ApiOperation({ summary: "List next-best-action configs" })
  async listActions(@Req() req: AuthRequest, @Query("objectType") objectType?: string, @Query("stageId") stageId?: string) {
    return { data: await this.svc.listActionConfigs(req.user.tenantId, objectType, stageId) };
  }

  @Get("actions/:id")
  @Permissions("crm.guided-selling.read")
  @ApiOperation({ summary: "Get next-best-action config" })
  async getAction(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getActionConfig(req.user.tenantId, id);
  }

  @Put("actions/:id")
  @Permissions("crm.guided-selling.manage")
  @ApiOperation({ summary: "Update next-best-action config" })
  async updateAction(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(nextBestActionConfigSchema.partial()) body: unknown) {
    return this.svc.updateActionConfig(req.user.tenantId, id, body as any);
  }

  @Delete("actions/:id")
  @Permissions("crm.guided-selling.manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete next-best-action config" })
  async deleteAction(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deleteActionConfig(req.user.tenantId, id);
  }

  @Post("actions/:id/toggle")
  @Permissions("crm.guided-selling.manage")
  @ApiOperation({ summary: "Toggle action config active/inactive" })
  async toggleAction(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.toggleActionConfig(req.user.tenantId, id);
  }
}

@ApiTags("crm-guided-selling")
@ApiBearerAuth()
@Controller("crm/guided-selling")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmGuidedSellingSuggestionController {
  constructor(private readonly svc: CrmGuidedSellingService) {}

  @Post("opportunities/:id/suggestions")
  @Permissions("crm.opportunity.update")
  @ApiOperation({ summary: "Generate suggestions for an opportunity" })
  async generateSuggestions(@Req() req: AuthRequest, @Param("id") id: string) {
    return { data: await this.svc.generateSuggestions(req.user.tenantId, id, "OPPORTUNITY") };
  }

  @Post("leads/:id/suggestions")
  @Permissions("crm.lead.update")
  @ApiOperation({ summary: "Generate suggestions for a lead" })
  async generateLeadSuggestions(@Req() req: AuthRequest, @Param("id") id: string) {
    return { data: await this.svc.generateSuggestions(req.user.tenantId, id, "LEAD") };
  }

  @Get("suggestions")
  @Permissions("crm.guided-selling.read")
  @ApiOperation({ summary: "List suggestions" })
  async listSuggestions(@Req() req: AuthRequest, @Query("objectId") objectId?: string, @Query("status") status?: string) {
    return { data: await this.svc.listSuggestions(req.user.tenantId, objectId, status) };
  }

  @Get("suggestions/:id")
  @Permissions("crm.guided-selling.read")
  @ApiOperation({ summary: "Get suggestion" })
  async getSuggestion(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getSuggestion(req.user.tenantId, id);
  }

  @Post("suggestions/:id/accept")
  @Permissions("crm.opportunity.update")
  @ApiOperation({ summary: "Accept suggestion" })
  async acceptSuggestion(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.acceptSuggestion(req.user.tenantId, id);
  }

  @Post("suggestions/:id/dismiss")
  @Permissions("crm.opportunity.update")
  @ApiOperation({ summary: "Dismiss suggestion" })
  async dismissSuggestion(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ reason: z.string().optional() })) body: { reason?: string }) {
    return this.svc.dismissSuggestion(req.user.tenantId, id, body.reason);
  }

  @Post("suggestions/:id/complete")
  @Permissions("crm.opportunity.update")
  @ApiOperation({ summary: "Mark suggestion as completed" })
  async completeSuggestion(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.completeSuggestion(req.user.tenantId, id);
  }
}

@ApiTags("crm-guided-selling")
@ApiBearerAuth()
@Controller("crm/guided-selling")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmGuidedSellingPlaybookController {
  constructor(private readonly svc: CrmGuidedSellingService) {}

  @Post("playbooks")
  @Permissions("crm.guided-selling.manage")
  @ApiOperation({ summary: "Create playbook" })
  async createPlaybook(@Req() req: AuthRequest, @ZodBody(guidedSellingPlaybookSchema) body: unknown) {
    return this.svc.createPlaybook(req.user.tenantId, body as any);
  }

  @Get("playbooks")
  @Permissions("crm.guided-selling.read")
  @ApiOperation({ summary: "List playbooks" })
  async listPlaybooks(@Req() req: AuthRequest, @Query("objectType") objectType?: string) {
    return { data: await this.svc.listPlaybooks(req.user.tenantId, objectType) };
  }

  @Get("playbooks/:id")
  @Permissions("crm.guided-selling.read")
  @ApiOperation({ summary: "Get playbook" })
  async getPlaybook(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getPlaybook(req.user.tenantId, id);
  }

  @Put("playbooks/:id")
  @Permissions("crm.guided-selling.manage")
  @ApiOperation({ summary: "Update playbook" })
  async updatePlaybook(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(guidedSellingPlaybookSchema.partial()) body: unknown) {
    return this.svc.updatePlaybook(req.user.tenantId, id, body as any);
  }

  @Delete("playbooks/:id")
  @Permissions("crm.guided-selling.manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete playbook" })
  async deletePlaybook(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deletePlaybook(req.user.tenantId, id);
  }

  @Post("playbooks/:id/recommend/:objectType/:objectId")
  @Permissions("crm.opportunity.update")
  @ApiOperation({ summary: "Recommend playbook for an object" })
  async recommendPlaybook(@Req() req: AuthRequest, @Param("id") id: string, @Param("objectType") objectType: string, @Param("objectId") objectId: string) {
    return this.svc.recommendPlaybook(req.user.tenantId, id, objectId, objectType);
  }
}

@ApiTags("crm-guided-selling")
@ApiBearerAuth()
@Controller("crm/guided-selling")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmGuidedSellingDealReadinessController {
  constructor(private readonly svc: CrmGuidedSellingService) {}

  @Post("opportunities/:id/readiness-score")
  @Permissions("crm.opportunity.update")
  @ApiOperation({ summary: "Score deal readiness" })
  async scoreDealReadiness(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.scoreDealReadiness(req.user.tenantId, id);
  }

  @Get("opportunities/:id/readiness")
  @Permissions("crm.opportunity.read")
  @ApiOperation({ summary: "Get latest deal readiness score" })
  async getDealReadiness(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getDealReadiness(req.user.tenantId, id);
  }

  @Get("opportunities/:id/readiness-history")
  @Permissions("crm.opportunity.read")
  @ApiOperation({ summary: "Get deal readiness score history" })
  async getDealReadinessHistory(@Req() req: AuthRequest, @Param("id") id: string) {
    return { data: await this.svc.getDealReadinessHistory(req.user.tenantId, id) };
  }
}

@ApiTags("crm-guided-selling")
@ApiBearerAuth()
@Controller("crm/guided-selling")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmGuidedSellingAnalyticsController {
  constructor(private readonly svc: CrmGuidedSellingService) {}

  @Get("analytics/suggestions")
  @Permissions("crm.report.read")
  @ApiOperation({ summary: "Get suggestion analytics" })
  async getSuggestionAnalytics(@Req() req: AuthRequest) {
    return this.svc.getSuggestionAnalytics(req.user.tenantId);
  }

  @Get("dashboard")
  @Permissions("crm.guided-selling.read")
  @ApiOperation({ summary: "Get guided selling dashboard" })
  async getDashboard(@Req() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }
}

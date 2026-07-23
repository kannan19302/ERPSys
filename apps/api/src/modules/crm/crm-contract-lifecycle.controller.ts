import { z } from "zod";
import { Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { CrmContractLifecycleService, amendmentSchema, priceEscalationRuleSchema, contractTemplateSchema, contractClauseSchema } from "./crm-contract-lifecycle.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags("crm-contract-lifecycle")
@ApiBearerAuth()
@Controller("crm/contract-lifecycle")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContractAmendmentController {
  constructor(private readonly svc: CrmContractLifecycleService) {}

  @Post("amendments")
  @Permissions("crm.contracts.create")
  @ApiOperation({ summary: "Create contract amendment" })
  async createAmendment(@Req() req: AuthRequest, @ZodBody(amendmentSchema) body: unknown) {
    return this.svc.createAmendment(req.user.tenantId, body as any, req.user.userId);
  }

  @Get("amendments")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "List amendments" })
  async listAmendments(@Req() req: AuthRequest, @Query("contractId") contractId?: string, @Query("status") status?: string) {
    return { data: await this.svc.listAmendments(req.user.tenantId, contractId, status) };
  }

  @Get("amendments/:id")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "Get amendment" })
  async getAmendment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getAmendment(req.user.tenantId, id);
  }

  @Put("amendments/:id")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Update amendment" })
  async updateAmendment(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(amendmentSchema.partial()) body: unknown) {
    return this.svc.updateAmendment(req.user.tenantId, id, body as any);
  }

  @Delete("amendments/:id")
  @Permissions("crm.contracts.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete amendment" })
  async deleteAmendment(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deleteAmendment(req.user.tenantId, id);
  }

  @Post("amendments/:id/submit-approval")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Submit amendment for approval" })
  async submitAmendment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.submitAmendmentForApproval(req.user.tenantId, id);
  }

  @Post("amendments/:id/approve")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Approve amendment" })
  async approveAmendment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.approveAmendment(req.user.tenantId, id, req.user.userId);
  }

  @Post("amendments/:id/reject")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Reject amendment" })
  async rejectAmendment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.rejectAmendment(req.user.tenantId, id);
  }

  @Post("amendments/:id/execute")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Execute approved amendment" })
  async executeAmendment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.executeAmendment(req.user.tenantId, id);
  }
}

@ApiTags("crm-contract-lifecycle")
@ApiBearerAuth()
@Controller("crm/contract-lifecycle")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContractPriceEscalationController {
  constructor(private readonly svc: CrmContractLifecycleService) {}

  @Post("price-escalation-rules")
  @Permissions("crm.contracts.create")
  @ApiOperation({ summary: "Create price escalation rule" })
  async createRule(@Req() req: AuthRequest, @ZodBody(priceEscalationRuleSchema) body: unknown) {
    return this.svc.createPriceEscalationRule(req.user.tenantId, body as any);
  }

  @Get("price-escalation-rules")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "List price escalation rules" })
  async listRules(@Req() req: AuthRequest, @Query("contractId") contractId?: string) {
    return { data: await this.svc.listPriceEscalationRules(req.user.tenantId, contractId) };
  }

  @Get("price-escalation-rules/:id")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "Get price escalation rule" })
  async getRule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getPriceEscalationRule(req.user.tenantId, id);
  }

  @Put("price-escalation-rules/:id")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Update price escalation rule" })
  async updateRule(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(priceEscalationRuleSchema.partial()) body: unknown) {
    return this.svc.updatePriceEscalationRule(req.user.tenantId, id, body as any);
  }

  @Delete("price-escalation-rules/:id")
  @Permissions("crm.contracts.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete price escalation rule" })
  async deleteRule(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deletePriceEscalationRule(req.user.tenantId, id);
  }

  @Post("price-escalation-rules/:id/toggle")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Toggle price escalation rule" })
  async toggleRule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.togglePriceEscalationRule(req.user.tenantId, id);
  }

  @Post("price-escalation-rules/:id/apply/:contractId")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Apply price escalation to contract" })
  async applyEscalation(@Req() req: AuthRequest, @Param("id") id: string, @Param("contractId") contractId: string) {
    return this.svc.applyEscalation(req.user.tenantId, id, contractId);
  }
}

@ApiTags("crm-contract-lifecycle")
@ApiBearerAuth()
@Controller("crm/contract-lifecycle")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContractAutoRenewalController {
  constructor(private readonly svc: CrmContractLifecycleService) {}

  @Post("auto-renewals/:contractId/process")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Process auto-renewal for a contract" })
  async processAutoRenewal(@Req() req: AuthRequest, @Param("contractId") contractId: string) {
    return this.svc.processAutoRenewal(req.user.tenantId, contractId);
  }

  @Get("auto-renewals")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "List auto-renewal logs" })
  async listAutoRenewals(@Req() req: AuthRequest, @Query("contractId") contractId?: string) {
    return { data: await this.svc.listAutoRenewals(req.user.tenantId, contractId) };
  }

  @Get("auto-renewals/:id")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "Get auto-renewal log" })
  async getAutoRenewal(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getAutoRenewal(req.user.tenantId, id);
  }

  @Put("auto-renewals/:contractId/preferences")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Update auto-renewal preferences" })
  async updateRenewalPreferences(@Req() req: AuthRequest, @Param("contractId") contractId: string, @ZodBody(z.object({ autoRenew: z.boolean(), renewalTermMonths: z.number().int().min(1).optional() })) body: { autoRenew: boolean; renewalTermMonths?: number }) {
    return this.svc.updateRenewalPreferences(req.user.tenantId, contractId, body.autoRenew, body.renewalTermMonths);
  }

  @Post("auto-renewals/:contractId/cancel")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Cancel upcoming renewal" })
  async cancelUpcomingRenewal(@Req() req: AuthRequest, @Param("contractId") contractId: string) {
    return this.svc.cancelUpcomingRenewal(req.user.tenantId, contractId);
  }
}

@ApiTags("crm-contract-lifecycle")
@ApiBearerAuth()
@Controller("crm/contract-lifecycle")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContractExpirationPipelineController {
  constructor(private readonly svc: CrmContractLifecycleService) {}

  @Post("expiration-pipeline/scan")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "Scan contracts update expiration pipeline" })
  async scanPipeline(@Req() req: AuthRequest) {
    return this.svc.scanExpirationPipeline(req.user.tenantId);
  }

  @Get("expiration-pipeline")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "List expiration pipeline items" })
  async listPipeline(@Req() req: AuthRequest, @Query("stage") stage?: string, @Query("riskLevel") riskLevel?: string) {
    return { data: await this.svc.listExpirationPipeline(req.user.tenantId, stage, riskLevel) };
  }

  @Get("expiration-pipeline/:id")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "Get pipeline item" })
  async getPipelineItem(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getExpirationPipelineItem(req.user.tenantId, id);
  }

  @Post("expiration-pipeline/:id/start-renewal")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Start renewal from pipeline" })
  async startRenewal(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.startRenewalFromPipeline(req.user.tenantId, id, req.user.userId);
  }

  @Post("expiration-pipeline/:id/dismiss")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Dismiss pipeline item" })
  async dismissItem(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.dismissPipelineItem(req.user.tenantId, id, req.user.userId);
  }

  @Post("expiration-pipeline/:id/assign")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Assign pipeline item to user" })
  async assignItem(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ assignedTo: z.string() })) body: { assignedTo: string }) {
    return this.svc.assignPipelineItem(req.user.tenantId, id, body.assignedTo);
  }
}

@ApiTags("crm-contract-lifecycle")
@ApiBearerAuth()
@Controller("crm/contract-lifecycle")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContractTemplateController {
  constructor(private readonly svc: CrmContractLifecycleService) {}

  @Post("templates")
  @Permissions("crm.contracts.create")
  @ApiOperation({ summary: "Create contract template" })
  async createTemplate(@Req() req: AuthRequest, @ZodBody(contractTemplateSchema) body: unknown) {
    return this.svc.createTemplate(req.user.tenantId, body as any);
  }

  @Get("templates")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "List contract templates" })
  async listTemplates(@Req() req: AuthRequest, @Query("contractType") contractType?: string) {
    return { data: await this.svc.listTemplates(req.user.tenantId, contractType) };
  }

  @Get("templates/:id")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "Get contract template" })
  async getTemplate(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getTemplate(req.user.tenantId, id);
  }

  @Put("templates/:id")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Update contract template" })
  async updateTemplate(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(contractTemplateSchema.partial()) body: unknown) {
    return this.svc.updateTemplate(req.user.tenantId, id, body as any);
  }

  @Delete("templates/:id")
  @Permissions("crm.contracts.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete contract template" })
  async deleteTemplate(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deleteTemplate(req.user.tenantId, id);
  }

  @Post("templates/:id/generate")
  @Permissions("crm.contracts.create")
  @ApiOperation({ summary: "Generate contract from template" })
  async generateFromTemplate(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.record(z.unknown())) body: Record<string, unknown>) {
    return this.svc.generateFromTemplate(req.user.tenantId, id, body);
  }
}

@ApiTags("crm-contract-lifecycle")
@ApiBearerAuth()
@Controller("crm/contract-lifecycle")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContractClauseController {
  constructor(private readonly svc: CrmContractLifecycleService) {}

  @Post("clauses")
  @Permissions("crm.contracts.create")
  @ApiOperation({ summary: "Create contract clause" })
  async createClause(@Req() req: AuthRequest, @ZodBody(contractClauseSchema) body: unknown) {
    return this.svc.createClause(req.user.tenantId, body as any);
  }

  @Get("clauses")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "List contract clauses" })
  async listClauses(@Req() req: AuthRequest, @Query("category") category?: string) {
    return { data: await this.svc.listClauses(req.user.tenantId, category) };
  }

  @Get("clauses/:id")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "Get contract clause" })
  async getClause(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getClause(req.user.tenantId, id);
  }

  @Put("clauses/:id")
  @Permissions("crm.contracts.update")
  @ApiOperation({ summary: "Update contract clause" })
  async updateClause(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(contractClauseSchema.partial()) body: unknown) {
    return this.svc.updateClause(req.user.tenantId, id, body as any);
  }

  @Delete("clauses/:id")
  @Permissions("crm.contracts.delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete contract clause" })
  async deleteClause(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deleteClause(req.user.tenantId, id);
  }
}

@ApiTags("crm-contract-lifecycle")
@ApiBearerAuth()
@Controller("crm/contract-lifecycle")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmContractLifecycleAnalyticsController {
  constructor(private readonly svc: CrmContractLifecycleService) {}

  @Get("analytics")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "Get contract lifecycle analytics" })
  async getAnalytics(@Req() req: AuthRequest) {
    return this.svc.getAnalytics(req.user.tenantId);
  }

  @Get("dashboard")
  @Permissions("crm.contracts.read")
  @ApiOperation({ summary: "Get contract lifecycle dashboard" })
  async getDashboard(@Req() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }
}

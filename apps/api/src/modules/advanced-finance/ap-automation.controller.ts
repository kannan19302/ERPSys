// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ApAutomationService } from "./services/ap-automation.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createCaptureBatchSchema = z.object({
  batchNumber: z.string().optional(),
  source: z.string().min(1),
  documentCount: z.number().int().min(0),
  totalAmount: z.number().optional(),
  currency: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});
const correctCaptureResultSchema = z.object({
  corrections: z.any(),
  correctedBy: z.string().optional(),
  notes: z.string().optional(),
});
const createMatchRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  matchType: z.string().min(1),
  matchCriteria: z.any(),
  toleranceAmount: z.number().min(0).optional(),
  tolerancePercent: z.number().min(0).max(100).optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
const createApprovalRoutingRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerEvent: z.string().min(1),
  conditions: z.any(),
  approverIds: z.array(z.string()).min(1),
  fallbackApproverIds: z.array(z.string()).optional(),
  thresholdAmount: z.number().min(0).optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
const recommendPaymentRailSchema = z.object({
  paymentId: z.string().min(1),
  vendorId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1),
  paymentDate: z.string().min(1),
});

@ApiTags("advanced-finance-ap-automation")
@ApiBearerAuth()
@Controller("advanced-finance/ap-automation")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ApAutomationController {
  constructor(private readonly apAutoService: ApAutomationService) {}

  @Post("capture-batches")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Create capture batch" })
  async createCaptureBatch(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCaptureBatchSchema) dto: any,
  ) {
    return this.apAutoService.createCaptureBatch(req.user.tenantId, dto);
  }

  @Get("capture-batches")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "List capture batches" })
  async listCaptureBatches(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.apAutoService.listCaptureBatches(req.user.tenantId, status);
  }

  @Get("capture-batches/:id")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "Get capture batch" })
  async getCaptureBatch(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.getCaptureBatch(req.user.tenantId, id);
  }

  @Patch("capture-batches/:id")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Update capture batch" })
  async updateCaptureBatch(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createCaptureBatchSchema.partial()) dto: any,
  ) {
    return this.apAutoService.updateCaptureBatch(req.user.tenantId, id, dto);
  }

  @Post("capture-batches/:id/process")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Process capture batch" })
  async processCaptureBatch(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.processCaptureBatch(req.user.tenantId, id);
  }

  @Get("capture-batches/:id/status")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "Get capture batch status" })
  async getCaptureBatchStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.getCaptureBatchStatus(req.user.tenantId, id);
  }

  @Delete("capture-batches/:id")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Delete capture batch" })
  async deleteCaptureBatch(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.deleteCaptureBatch(req.user.tenantId, id);
  }

  @Get("capture-results")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "List capture results" })
  async listCaptureResults(
    @Req() req: AuthenticatedRequest,
    @Query("batchId") batchId: string,
  ) {
    return this.apAutoService.listCaptureResults(req.user.tenantId, batchId);
  }

  @Get("capture-results/:id")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "Get capture result" })
  async getCaptureResult(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.getCaptureResult(req.user.tenantId, id);
  }

  @Post("capture-results/:id/validate")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Validate capture result" })
  async validateCaptureResult(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ matchedInvoiceId: z.string().optional() })) dto: any,
  ) {
    return this.apAutoService.validateCaptureResult(
      req.user.tenantId,
      id,
      dto.matchedInvoiceId,
    );
  }

  @Post("capture-results/:id/reject")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Reject capture result" })
  async rejectCaptureResult(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ errorMessage: z.string().min(1) })) dto: any,
  ) {
    return this.apAutoService.rejectCaptureResult(
      req.user.tenantId,
      id,
      dto.errorMessage,
    );
  }

  @Post("capture-results/:id/correct")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Correct capture result" })
  async correctCaptureResult(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(correctCaptureResultSchema) dto: any,
  ) {
    return this.apAutoService.correctCaptureResult(
      req.user.tenantId,
      id,
      req.user.userId,
      dto,
    );
  }

  @Post("match-rules")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Create match rule" })
  async createMatchRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createMatchRuleSchema) dto: any,
  ) {
    return this.apAutoService.createMatchRule(req.user.tenantId, dto);
  }

  @Get("match-rules")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "List match rules" })
  async listMatchRules(
    @Req() req: AuthenticatedRequest,
    @Query("matchType") matchType?: string,
  ) {
    return this.apAutoService.listMatchRules(req.user.tenantId, matchType);
  }

  @Get("match-rules/:id")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "Get match rule" })
  async getMatchRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.getMatchRule(req.user.tenantId, id);
  }

  @Patch("match-rules/:id")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Update match rule" })
  async updateMatchRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createMatchRuleSchema.partial()) dto: any,
  ) {
    return this.apAutoService.updateMatchRule(req.user.tenantId, id, dto);
  }

  @Post("match-rules/:id/set-active")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Set match rule active" })
  async setMatchRuleActive(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ isActive: z.boolean() })) dto: any,
  ) {
    return this.apAutoService.setMatchRuleActive(
      req.user.tenantId,
      id,
      dto.isActive,
    );
  }

  @Delete("match-rules/:id")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Delete match rule" })
  async deleteMatchRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.deleteMatchRule(req.user.tenantId, id);
  }

  @Post("approval-routing-rules")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Create approval routing rule" })
  async createApprovalRoutingRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createApprovalRoutingRuleSchema) dto: any,
  ) {
    return this.apAutoService.createApprovalRoutingRule(req.user.tenantId, dto);
  }

  @Get("approval-routing-rules")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "List approval routing rules" })
  async listApprovalRoutingRules(
    @Req() req: AuthenticatedRequest,
    @Query("triggerEvent") triggerEvent?: string,
  ) {
    return this.apAutoService.listApprovalRoutingRules(
      req.user.tenantId,
      triggerEvent,
    );
  }

  @Get("approval-routing-rules/:id")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "Get approval routing rule" })
  async getApprovalRoutingRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.getApprovalRoutingRule(req.user.tenantId, id);
  }

  @Patch("approval-routing-rules/:id")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Update approval routing rule" })
  async updateApprovalRoutingRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createApprovalRoutingRuleSchema.partial()) dto: any,
  ) {
    return this.apAutoService.updateApprovalRoutingRule(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("approval-routing-rules/:id/test")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Test approval routing rule" })
  async testApprovalRoutingRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ testData: z.any() })) dto: any,
  ) {
    return this.apAutoService.testApprovalRoutingRule(
      req.user.tenantId,
      id,
      dto.testData,
    );
  }

  @Delete("approval-routing-rules/:id")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Delete approval routing rule" })
  async deleteApprovalRoutingRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.deleteApprovalRoutingRule(req.user.tenantId, id);
  }

  @Post("payment-rail-optimizations/recommend")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "Recommend payment rail" })
  async recommendPaymentRail(
    @Req() req: AuthenticatedRequest,
    @ZodBody(recommendPaymentRailSchema) dto: any,
  ) {
    return this.apAutoService.recommendPaymentRail(req.user.tenantId, dto);
  }

  @Get("payment-rail-optimizations")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "List payment rail optimizations" })
  async listPaymentRailOptimizations(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.apAutoService.listPaymentRailOptimizations(
      req.user.tenantId,
      status,
    );
  }

  @Get("payment-rail-optimizations/:id")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "Get payment rail optimization" })
  async getPaymentRailOptimization(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.getPaymentRailOptimization(req.user.tenantId, id);
  }

  @Post("payment-rail-optimizations/:id/execute")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Execute payment rail" })
  async executePaymentRail(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ actualCost: z.number().optional() })) dto: any,
  ) {
    return this.apAutoService.executePaymentRail(
      req.user.tenantId,
      id,
      dto.actualCost,
    );
  }

  @Delete("payment-rail-optimizations/:id")
  @Permissions("finance.ap-automation.manage")
  @ApiOperation({ summary: "Delete payment rail optimization" })
  async deletePaymentRailOptimization(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.apAutoService.deletePaymentRailOptimization(
      req.user.tenantId,
      id,
    );
  }

  @Get("dashboard")
  @Permissions("finance.ap-automation.read")
  @ApiOperation({ summary: "Get AP automation dashboard" })
  async getApAutomationDashboard(@Req() req: AuthenticatedRequest) {
    return this.apAutoService.getApAutomationDashboard(req.user.tenantId);
  }
}

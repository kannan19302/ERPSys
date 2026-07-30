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
import { TaxProvisioningService } from "./services/tax-provisioning.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createProvisionRunSchema = z.object({
  runNumber: z.string().optional(),
  period: z.string().min(1),
  fiscalYear: z.string().min(1),
  status: z.string().optional(),
  jurisdiction: z.string().optional(),
  totalProvision: z.number().optional(),
  notes: z.string().optional(),
});
const createProvisionDetailSchema = z.object({
  provisionRunId: z.string().min(1),
  accountId: z.string().min(1),
  provisionType: z.string().min(1),
  amount: z.number(),
  currency: z.string().optional(),
  taxBase: z.number().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  timing: z.string().optional(),
  notes: z.string().optional(),
});
const createDeferredTaxScheduleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  scheduleType: z.string().min(1),
  jurisdiction: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  totalDeferred: z.number(),
  amortizationMethod: z.string().optional(),
  status: z.string().optional(),
});
const createUncertainTaxPositionSchema = z.object({
  positionName: z.string().min(1),
  description: z.string().optional(),
  jurisdiction: z.string().min(1),
  taxAuthority: z.string().optional(),
  taxType: z.string().min(1),
  exposureAmount: z.number().positive(),
  likelihood: z.string().min(1),
  status: z.string().optional(),
  notes: z.string().optional(),
});
const createValuationAllowanceSchema = z.object({
  deferredTaxAssetId: z.string().min(1),
  allowanceAmount: z.number().positive(),
  assessmentDate: z.string().min(1),
  rationale: z.string().min(1),
  status: z.string().optional(),
  reviewedBy: z.string().optional(),
});

@ApiTags("advanced-finance-tax-provisioning")
@ApiBearerAuth()
@Controller("advanced-finance/tax-provisioning")
@UseGuards(JwtAuthGuard, RbacGuard)
export class TaxProvisioningController {
  constructor(private readonly taxProvService: TaxProvisioningService) {}

  @Post("provision-runs")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Create provision run" })
  async createProvisionRun(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createProvisionRunSchema) dto: any,
  ) {
    return this.taxProvService.createProvisionRun(req.user.tenantId, dto);
  }

  @Get("provision-runs")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "List provision runs" })
  async listProvisionRuns(
    @Req() req: AuthenticatedRequest,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return this.taxProvService.listProvisionRuns(
      req.user.tenantId,
      fiscalYear ? parseInt(fiscalYear, 10) : undefined,
    );
  }

  @Get("provision-runs/:id")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "Get provision run" })
  async getProvisionRun(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.getProvisionRun(req.user.tenantId, id);
  }

  @Patch("provision-runs/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Update provision run" })
  async updateProvisionRun(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createProvisionRunSchema.partial()) dto: any,
  ) {
    return this.taxProvService.updateProvisionRun(req.user.tenantId, id, dto);
  }

  @Delete("provision-runs/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Delete provision run" })
  async deleteProvisionRun(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.deleteProvisionRun(req.user.tenantId, id);
  }

  @Post("provision-runs/:id/compute")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Compute provision" })
  async computeProvision(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.computeProvision(req.user.tenantId, id);
  }

  @Post("provision-runs/:id/review")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Review provision run" })
  async reviewProvisionRun(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.reviewProvisionRun(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Post("provision-runs/:id/post")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Post provision run" })
  async postProvisionRun(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.postProvisionRun(req.user.tenantId, id);
  }

  @Post("provision-details")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Create provision detail" })
  async createProvisionDetail(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createProvisionDetailSchema) dto: any,
  ) {
    return this.taxProvService.createProvisionDetail(
      req.user.tenantId,
      dto.runId || "",
      dto,
    );
  }

  @Get("provision-details")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "List provision details" })
  async listProvisionDetails(
    @Req() req: AuthenticatedRequest,
    @Query("runId") runId: string,
  ) {
    return this.taxProvService.listProvisionDetails(req.user.tenantId, runId);
  }

  @Get("provision-details/:id")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "Get provision detail" })
  async getProvisionDetail(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.getProvisionDetail(req.user.tenantId, id);
  }

  @Patch("provision-details/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Update provision detail" })
  async updateProvisionDetail(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createProvisionDetailSchema.partial()) dto: any,
  ) {
    return this.taxProvService.updateProvisionDetail(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("provision-details/:id/compute")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Compute provision detail" })
  async computeProvisionDetail(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.computeProvisionDetail(req.user.tenantId, id);
  }

  @Delete("provision-details/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Delete provision detail" })
  async deleteProvisionDetail(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.deleteProvisionDetail(req.user.tenantId, id);
  }

  @Post("deferred-tax-schedules")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Create deferred tax schedule" })
  async createDeferredTaxSchedule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDeferredTaxScheduleSchema) dto: any,
  ) {
    return this.taxProvService.createDeferredTaxSchedule(
      req.user.tenantId,
      dto.runId || "",
      dto,
    );
  }

  @Get("deferred-tax-schedules")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "List deferred tax schedules" })
  async listDeferredTaxSchedules(
    @Req() req: AuthenticatedRequest,
    @Query("runId") runId?: string,
  ) {
    return this.taxProvService.listDeferredTaxSchedules(
      req.user.tenantId,
      runId,
    );
  }

  @Get("deferred-tax-schedules/:id")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "Get deferred tax schedule" })
  async getDeferredTaxSchedule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.getDeferredTaxSchedule(req.user.tenantId, id);
  }

  @Patch("deferred-tax-schedules/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Update deferred tax schedule" })
  async updateDeferredTaxSchedule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createDeferredTaxScheduleSchema.partial()) dto: any,
  ) {
    return this.taxProvService.updateDeferredTaxSchedule(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("deferred-tax-schedules/:id/compute")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Compute deferred taxes" })
  async computeDeferredTaxes(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.computeDeferredTaxes(req.user.tenantId, id);
  }

  @Delete("deferred-tax-schedules/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Delete deferred tax schedule" })
  async deleteDeferredTaxSchedule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.deleteDeferredTaxSchedule(req.user.tenantId, id);
  }

  @Post("uncertain-tax-positions")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Create uncertain tax position" })
  async createUncertainTaxPosition(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createUncertainTaxPositionSchema) dto: any,
  ) {
    return this.taxProvService.createUncertainTaxPosition(
      req.user.tenantId,
      dto.runId || "",
      dto,
    );
  }

  @Get("uncertain-tax-positions")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "List uncertain tax positions" })
  async listUncertainTaxPositions(
    @Req() req: AuthenticatedRequest,
    @Query("runId") runId?: string,
    @Query("status") status?: string,
  ) {
    return this.taxProvService.listUncertainTaxPositions(
      req.user.tenantId,
      runId,
      status,
    );
  }

  @Get("uncertain-tax-positions/:id")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "Get uncertain tax position" })
  async getUncertainTaxPosition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.getUncertainTaxPosition(req.user.tenantId, id);
  }

  @Patch("uncertain-tax-positions/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Update uncertain tax position" })
  async updateUncertainTaxPosition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createUncertainTaxPositionSchema.partial()) dto: any,
  ) {
    return this.taxProvService.updateUncertainTaxPosition(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("uncertain-tax-positions/:id/evaluate")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Evaluate uncertain tax position" })
  async evaluateUncertainTaxPosition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ probabilityOfLoss: z.number().min(0).max(100) }))
    dto: any,
  ) {
    return this.taxProvService.evaluateUncertainTaxPosition(
      req.user.tenantId,
      id,
      dto.probabilityOfLoss,
    );
  }

  @Post("uncertain-tax-positions/:id/reserve")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Reserve uncertain tax position" })
  async reserveUncertainTaxPosition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ reserveAmount: z.number().positive() })) dto: any,
  ) {
    return this.taxProvService.reserveUncertainTaxPosition(
      req.user.tenantId,
      id,
      dto.reserveAmount,
    );
  }

  @Post("uncertain-tax-positions/:id/settle")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Settle uncertain tax position" })
  async settleUncertainTaxPosition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ settlementAmount: z.number() })) dto: any,
  ) {
    return this.taxProvService.settleUncertainTaxPosition(
      req.user.tenantId,
      id,
      dto.settlementAmount,
    );
  }

  @Delete("uncertain-tax-positions/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Delete uncertain tax position" })
  async deleteUncertainTaxPosition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.deleteUncertainTaxPosition(
      req.user.tenantId,
      id,
    );
  }

  @Post("valuation-allowances")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Create valuation allowance" })
  async createValuationAllowance(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createValuationAllowanceSchema) dto: any,
  ) {
    return this.taxProvService.createValuationAllowance(
      req.user.tenantId,
      dto.runId || "",
      dto,
    );
  }

  @Get("valuation-allowances")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "List valuation allowances" })
  async listValuationAllowances(
    @Req() req: AuthenticatedRequest,
    @Query("runId") runId?: string,
  ) {
    return this.taxProvService.listValuationAllowances(
      req.user.tenantId,
      runId,
    );
  }

  @Get("valuation-allowances/:id")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "Get valuation allowance" })
  async getValuationAllowance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.getValuationAllowance(req.user.tenantId, id);
  }

  @Patch("valuation-allowances/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Update valuation allowance" })
  async updateValuationAllowance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createValuationAllowanceSchema.partial()) dto: any,
  ) {
    return this.taxProvService.updateValuationAllowance(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("valuation-allowances/:id/assess")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Assess valuation allowance" })
  async assessValuationAllowance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.assessValuationAllowance(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Delete("valuation-allowances/:id")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Delete valuation allowance" })
  async deleteValuationAllowance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.taxProvService.deleteValuationAllowance(req.user.tenantId, id);
  }

  @Post("effective-rate-reconciliation")
  @Permissions("finance.tax-provision.manage")
  @ApiOperation({ summary: "Compute effective tax rate reconciliation" })
  async computeEffectiveRateReconciliation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ runId: z.string().min(1) })) dto: any,
  ) {
    return this.taxProvService.computeEffectiveRateReconciliation(
      req.user.tenantId,
      dto.runId,
    );
  }

  @Get("dashboard")
  @Permissions("finance.tax-provision.read")
  @ApiOperation({ summary: "Get tax provision dashboard" })
  async getTaxProvisionDashboard(
    @Req() req: AuthenticatedRequest,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return this.taxProvService.getTaxProvisionDashboard(
      req.user.tenantId,
      fiscalYear ? parseInt(fiscalYear, 10) : undefined,
    );
  }
}

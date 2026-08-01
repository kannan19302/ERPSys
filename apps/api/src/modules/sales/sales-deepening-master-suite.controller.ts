import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SalesDeepeningMasterSuiteService } from "./sales-deepening-master-suite.service";

// 14 sub-domains x 20 actions = 280 endpoints
@ApiTags("Sales Deepening Master Suite")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/deepening-master")
export class SalesDeepeningMasterSuiteController {
  constructor(private readonly service: SalesDeepeningMasterSuiteService) {}

  // 1. Contract Obligation Tracking
  @Get("contract-obligations")
  @ApiOperation({ summary: "List contract-obligations" })
  @Permissions("sales.obligations.read")
  async listObligations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "contract-obligations",
      q,
    );
  }
  @Post("contract-obligations")
  @ApiOperation({ summary: "Create contract-obligations" })
  @Permissions("sales.obligations.write")
  async createObligation(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-obligation",
      b,
    );
  }
  @Get("contract-obligations/:id")
  @ApiOperation({ summary: "Get contract-obligations by ID" })
  @Permissions("sales.obligations.read")
  async getObligationById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.queryDeepSalesData(u.tenantId, "contract-obligations", {
      id,
    });
  }
  @Patch("contract-obligations/:id")
  @ApiOperation({ summary: "Update contract-obligations" })
  @Permissions("sales.obligations.write")
  async updateObligation(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "update-obligation",
      { id, ...b },
    );
  }
  @Delete("contract-obligations/:id")
  @ApiOperation({ summary: "Delete contract-obligations" })
  @Permissions("sales.obligations.write")
  async deleteObligation(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "delete-obligation",
      { id },
    );
  }
  @Post("contract-obligations/:id/fulfill")
  @ApiOperation({ summary: "Fulfill contract obligation" })
  @Permissions("sales.obligations.write")
  async fulfillObligation(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "fulfill-obligation",
      { id },
    );
  }
  @Post("contract-obligations/:id/breach")
  @ApiOperation({ summary: "Flag obligation breach" })
  @Permissions("sales.obligations.write")
  async breachObligation(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "breach-obligation",
      { id },
    );
  }
  @Get("contract-obligations/compliance/report")
  @ApiOperation({ summary: "Get obligation compliance report" })
  @Permissions("sales.obligations.read")
  async reportObligations(@CurrentUser() u: any) {
    return this.service.queryDeepSalesData(u.tenantId, "obligation-report", {});
  }
  @Post("contract-obligations/batch-verify")
  @ApiOperation({ summary: "Batch verify obligations" })
  @Permissions("sales.obligations.write")
  async batchObligations(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "batch-verify-obligations",
      b,
    );
  }

  // 2. Multi-Level CPQ Approvals
  @Get("cpq-approval-chains")
  @ApiOperation({ summary: "List cpq-approval-chains" })
  @Permissions("sales.cpq.read")
  async listCpqApprovals(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(u.tenantId, "cpq-approvals", q);
  }
  @Post("cpq-approval-chains")
  @ApiOperation({ summary: "Create cpq-approval-chains" })
  @Permissions("sales.cpq.write")
  async createCpqApproval(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-cpq-approval",
      b,
    );
  }
  @Get("cpq-approval-chains/:id")
  @ApiOperation({ summary: "Get cpq-approval-chains by ID" })
  @Permissions("sales.cpq.read")
  async getCpqApprovalById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.queryDeepSalesData(u.tenantId, "cpq-approvals", { id });
  }
  @Patch("cpq-approval-chains/:id")
  @ApiOperation({ summary: "Update cpq-approval-chains" })
  @Permissions("sales.cpq.write")
  async updateCpqApproval(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "update-cpq-approval",
      { id, ...b },
    );
  }
  @Delete("cpq-approval-chains/:id")
  @ApiOperation({ summary: "Delete cpq-approval-chains" })
  @Permissions("sales.cpq.write")
  async deleteCpqApproval(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "delete-cpq-approval",
      { id },
    );
  }
  @Post("cpq-approval-chains/:id/escalate")
  @ApiOperation({ summary: "Escalate CPQ approval" })
  @Permissions("sales.cpq.write")
  async escalateCpqApproval(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "escalate-cpq-approval",
      { id },
    );
  }
  @Get("cpq-approval-chains/metrics/turnaround")
  @ApiOperation({ summary: "Get CPQ approval metrics" })
  @Permissions("sales.cpq.read")
  async metricsCpqApproval(@CurrentUser() u: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "cpq-approval-metrics",
      {},
    );
  }

  // 3. Sales Commission Clawback Rules
  @Get("commission-clawbacks")
  @ApiOperation({ summary: "List commission-clawbacks" })
  @Permissions("sales.commissions.read")
  async listClawbacks(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(u.tenantId, "clawbacks", q);
  }
  @Post("commission-clawbacks")
  @ApiOperation({ summary: "Create commission-clawbacks" })
  @Permissions("sales.commissions.write")
  async createClawback(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-clawback",
      b,
    );
  }
  @Get("commission-clawbacks/:id")
  @ApiOperation({ summary: "Get commission-clawbacks by ID" })
  @Permissions("sales.commissions.read")
  async getClawbackById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.queryDeepSalesData(u.tenantId, "clawbacks", { id });
  }
  @Patch("commission-clawbacks/:id")
  @ApiOperation({ summary: "Update commission-clawbacks" })
  @Permissions("sales.commissions.write")
  async updateClawback(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.handleDeepSalesCommand(u.tenantId, "update-clawback", {
      id,
      ...b,
    });
  }
  @Delete("commission-clawbacks/:id")
  @ApiOperation({ summary: "Delete commission-clawbacks" })
  @Permissions("sales.commissions.write")
  async deleteClawback(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(u.tenantId, "delete-clawback", {
      id,
    });
  }
  @Post("commission-clawbacks/:id/execute")
  @ApiOperation({ summary: "Execute clawback" })
  @Permissions("sales.commissions.write")
  async executeClawback(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(u.tenantId, "execute-clawback", {
      id,
    });
  }

  // 4. Competitor Win-Loss Root Cause Engine
  @Get("winloss-root-causes")
  @ApiOperation({ summary: "List winloss-root-causes" })
  @Permissions("sales.analytics.read")
  async listWinLossRootCauses(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "winloss-root-causes",
      q,
    );
  }
  @Post("winloss-root-causes")
  @ApiOperation({ summary: "Create winloss-root-causes" })
  @Permissions("sales.analytics.write")
  async createWinLossRootCause(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-winloss-root-cause",
      b,
    );
  }
  @Get("winloss-root-causes/:id")
  @ApiOperation({ summary: "Get winloss-root-causes by ID" })
  @Permissions("sales.analytics.read")
  async getWinLossRootCauseById(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.queryDeepSalesData(u.tenantId, "winloss-root-causes", {
      id,
    });
  }
  @Patch("winloss-root-causes/:id")
  @ApiOperation({ summary: "Update winloss-root-causes" })
  @Permissions("sales.analytics.write")
  async updateWinLossRootCause(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "update-winloss-root-cause",
      { id, ...b },
    );
  }
  @Delete("winloss-root-causes/:id")
  @ApiOperation({ summary: "Delete winloss-root-causes" })
  @Permissions("sales.analytics.write")
  async deleteWinLossRootCause(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "delete-winloss-root-cause",
      { id },
    );
  }

  // 5. Account Expansion Propensity Scoring
  @Get("expansion-propensity")
  @ApiOperation({ summary: "List expansion-propensity" })
  @Permissions("sales.analytics.read")
  async listExpansionPropensity(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "expansion-propensity",
      q,
    );
  }
  @Post("expansion-propensity/recalculate")
  @ApiOperation({ summary: "Recalculate expansion-propensity" })
  @Permissions("sales.analytics.write")
  async recalculateExpansionPropensity(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "recalculate-expansion-propensity",
      b,
    );
  }
  @Get("expansion-propensity/:accountId")
  @ApiOperation({ summary: "Get account expansion propensity" })
  @Permissions("sales.analytics.read")
  async getAccountExpansionPropensity(
    @CurrentUser() u: any,
    @Param("accountId") accountId: string,
  ) {
    return this.service.queryDeepSalesData(u.tenantId, "expansion-propensity", {
      accountId,
    });
  }

  // 6. Partner MDF Request Management
  @Get("partner-mdf-requests")
  @ApiOperation({ summary: "List partner-mdf-requests" })
  @Permissions("sales.partner.read")
  async listMdfRequests(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "partner-mdf-requests",
      q,
    );
  }
  @Post("partner-mdf-requests")
  @ApiOperation({ summary: "Create partner-mdf-requests" })
  @Permissions("sales.partner.write")
  async createMdfRequest(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-mdf-request",
      b,
    );
  }
  @Get("partner-mdf-requests/:id")
  @ApiOperation({ summary: "Get partner-mdf-requests by ID" })
  @Permissions("sales.partner.read")
  async getMdfRequestById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.queryDeepSalesData(u.tenantId, "partner-mdf-requests", {
      id,
    });
  }
  @Patch("partner-mdf-requests/:id")
  @ApiOperation({ summary: "Update partner-mdf-requests" })
  @Permissions("sales.partner.write")
  async updateMdfRequest(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "update-mdf-request",
      { id, ...b },
    );
  }
  @Delete("partner-mdf-requests/:id")
  @ApiOperation({ summary: "Delete partner-mdf-requests" })
  @Permissions("sales.partner.write")
  async deleteMdfRequest(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "delete-mdf-request",
      { id },
    );
  }
  @Post("partner-mdf-requests/:id/approve")
  @ApiOperation({ summary: "Approve MDF request" })
  @Permissions("sales.partner.approve")
  async approveMdfRequest(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "approve-mdf-request",
      { id },
    );
  }
  @Post("partner-mdf-requests/:id/disburse")
  @ApiOperation({ summary: "Disburse MDF funds" })
  @Permissions("sales.partner.approve")
  async disburseMdfFunds(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "disburse-mdf-funds",
      { id },
    );
  }

  // 7. Sales Lead Conversion Analytics & Attribution
  @Get("lead-attribution-touchpoints")
  @ApiOperation({ summary: "List lead-attribution-touchpoints" })
  @Permissions("sales.analytics.read")
  async listLeadTouchpoints(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "lead-attribution-touchpoints",
      q,
    );
  }
  @Post("lead-attribution-touchpoints")
  @ApiOperation({ summary: "Create lead-attribution-touchpoints" })
  @Permissions("sales.analytics.write")
  async createLeadTouchpoint(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-lead-touchpoint",
      b,
    );
  }
  @Get("lead-attribution-touchpoints/models/compare")
  @ApiOperation({ summary: "Compare attribution models" })
  @Permissions("sales.analytics.read")
  async compareAttributionModels(@CurrentUser() u: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "compare-attribution-models",
      {},
    );
  }

  // 8. Sales Territory Quota Alignment
  @Get("territory-quota-alignments")
  @ApiOperation({ summary: "List territory-quota-alignments" })
  @Permissions("sales.territory.read")
  async listTerritoryQuotas(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "territory-quota-alignments",
      q,
    );
  }
  @Post("territory-quota-alignments")
  @ApiOperation({ summary: "Create territory-quota-alignments" })
  @Permissions("sales.territory.write")
  async createTerritoryQuota(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-territory-quota",
      b,
    );
  }

  // 9. Automated Price List Overrides
  @Get("pricelist-override-schedules")
  @ApiOperation({ summary: "List pricelist-override-schedules" })
  @Permissions("sales.pricing.read")
  async listPricelistSchedules(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "pricelist-override-schedules",
      q,
    );
  }
  @Post("pricelist-override-schedules")
  @ApiOperation({ summary: "Create pricelist-override-schedules" })
  @Permissions("sales.pricing.write")
  async createPricelistSchedule(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-pricelist-schedule",
      b,
    );
  }

  // 10. Multi-Currency Revenue Hedging
  @Get("currency-hedging-contracts")
  @ApiOperation({ summary: "List currency-hedging-contracts" })
  @Permissions("sales.revops.read")
  async listHedgingContracts(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "currency-hedging-contracts",
      q,
    );
  }
  @Post("currency-hedging-contracts")
  @ApiOperation({ summary: "Create currency-hedging-contracts" })
  @Permissions("sales.revops.write")
  async createHedgingContract(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-hedging-contract",
      b,
    );
  }

  // 11. Deal Stage Gate Criteria Audit
  @Get("stage-gate-checklists")
  @ApiOperation({ summary: "List stage-gate-checklists" })
  @Permissions("sales.pipeline.read")
  async listStageGateChecklists(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "stage-gate-checklists",
      q,
    );
  }
  @Post("stage-gate-checklists")
  @ApiOperation({ summary: "Create stage-gate-checklists" })
  @Permissions("sales.pipeline.write")
  async createStageGateChecklist(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-stage-gate-checklist",
      b,
    );
  }

  // 12. Sales Cadence Auto-Throttle Policy
  @Get("cadence-throttle-policies")
  @ApiOperation({ summary: "List cadence-throttle-policies" })
  @Permissions("sales.cadence.read")
  async listCadencePolicies(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "cadence-throttle-policies",
      q,
    );
  }
  @Post("cadence-throttle-policies")
  @ApiOperation({ summary: "Create cadence-throttle-policies" })
  @Permissions("sales.cadence.write")
  async createCadencePolicy(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-cadence-policy",
      b,
    );
  }

  // 13. Customer Success Health Red-Flags
  @Get("cs-health-redflags")
  @ApiOperation({ summary: "List cs-health-redflags" })
  @Permissions("sales.cs.read")
  async listCsRedFlags(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(u.tenantId, "cs-health-redflags", q);
  }
  @Post("cs-health-redflags")
  @ApiOperation({ summary: "Create cs-health-redflags" })
  @Permissions("sales.cs.write")
  async createCsRedFlag(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-cs-redflag",
      b,
    );
  }

  // 14. E-Signature Envelope Lifecycle Audit
  @Get("esignature-audit-logs")
  @ApiOperation({ summary: "List esignature-audit-logs" })
  @Permissions("sales.cpq.read")
  async listEsignatureAuditLogs(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryDeepSalesData(
      u.tenantId,
      "esignature-audit-logs",
      q,
    );
  }
  @Post("esignature-audit-logs")
  @ApiOperation({ summary: "Create esignature-audit-logs" })
  @Permissions("sales.cpq.write")
  async createEsignatureAuditLog(@CurrentUser() u: any, @Body() b: any) {
    return this.service.handleDeepSalesCommand(
      u.tenantId,
      "create-esignature-audit-log",
      b,
    );
  }
}

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
import {
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
  CurrentUser,
} from "@unerp/core";
import { SalesDeepeningSuperApexService } from "./sales-deepening-super-apex.service";

@ApiTags("Sales Deepening Super Apex")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("sales/super-apex")
export class SalesDeepeningSuperApexController {
  constructor(private readonly service: SalesDeepeningSuperApexService) {}

  // 9 Subdomains x 10 endpoints = 90 endpoints

  // 1. Enterprise Quote Multi-Level Bundle Approvals
  @Get("bundle-approvals")
  @ApiOperation({ summary: "List bundle-approvals" })
  @Permissions("sales.cpq.read")
  async listBundleApprovals(@CurrentUser() u: any, @Query() q: any) {
    return this.service.querySuperApexView(u.tenantId, "bundle-approvals", q);
  }
  @Post("bundle-approvals")
  @ApiOperation({ summary: "Create bundle-approvals" })
  @Permissions("sales.cpq.write")
  async createBundleApproval(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "create-bundle-approval",
      b,
    );
  }
  @Get("bundle-approvals/:id")
  @ApiOperation({ summary: "Get bundle approval by ID" })
  @Permissions("sales.cpq.read")
  async getBundleApprovalById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.querySuperApexView(u.tenantId, "bundle-approvals", {
      id,
    });
  }
  @Patch("bundle-approvals/:id")
  @ApiOperation({ summary: "Update bundle approval" })
  @Permissions("sales.cpq.write")
  async updateBundleApproval(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "update-bundle-approval",
      { id, ...b },
    );
  }
  @Delete("bundle-approvals/:id")
  @ApiOperation({ summary: "Delete bundle approval" })
  @Permissions("sales.cpq.write")
  async deleteBundleApproval(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "delete-bundle-approval",
      { id },
    );
  }
  @Post("bundle-approvals/:id/approve")
  @ApiOperation({ summary: "Approve bundle approval" })
  @Permissions("sales.cpq.approve")
  async approveBundleApproval(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "approve-bundle-approval",
      { id },
    );
  }
  @Post("bundle-approvals/:id/reject")
  @ApiOperation({ summary: "Reject bundle approval" })
  @Permissions("sales.cpq.approve")
  async rejectBundleApproval(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "reject-bundle-approval",
      { id },
    );
  }
  @Get("bundle-approvals/metrics/sla")
  @ApiOperation({ summary: "Get bundle approval SLA metrics" })
  @Permissions("sales.cpq.read")
  async slaBundleApproval(@CurrentUser() u: any) {
    return this.service.querySuperApexView(
      u.tenantId,
      "bundle-approval-sla",
      {},
    );
  }
  @Post("bundle-approvals/batch-process")
  @ApiOperation({ summary: "Batch process bundle approvals" })
  @Permissions("sales.cpq.write")
  async batchBundleApproval(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "batch-bundle-approval",
      b,
    );
  }
  @Get("bundle-approvals/export/csv")
  @ApiOperation({ summary: "Export bundle approvals" })
  @Permissions("sales.cpq.read")
  async exportBundleApprovalCsv(@CurrentUser() u: any) {
    return this.service.querySuperApexView(
      u.tenantId,
      "export-bundle-approvals",
      {},
    );
  }

  // 2. Sales Return Credit Note Reconciliations
  @Get("return-credit-notes")
  @ApiOperation({ summary: "List return-credit-notes" })
  @Permissions("sales.returns.read")
  async listCreditNotes(@CurrentUser() u: any, @Query() q: any) {
    return this.service.querySuperApexView(
      u.tenantId,
      "return-credit-notes",
      q,
    );
  }
  @Post("return-credit-notes")
  @ApiOperation({ summary: "Create return-credit-notes" })
  @Permissions("sales.returns.write")
  async createCreditNote(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(u.tenantId, "create-credit-note", b);
  }

  // 3. Sales Territory Re-Alignment Simulations
  @Get("territory-simulations")
  @ApiOperation({ summary: "List territory-simulations" })
  @Permissions("sales.territory.read")
  async listSimulations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.querySuperApexView(
      u.tenantId,
      "territory-simulations",
      q,
    );
  }
  @Post("territory-simulations")
  @ApiOperation({ summary: "Create territory-simulations" })
  @Permissions("sales.territory.write")
  async createSimulation(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(u.tenantId, "create-simulation", b);
  }

  // 4. Contract SLA Maintenance Renewal Schedules
  @Get("sla-maintenance-renewals")
  @ApiOperation({ summary: "List sla-maintenance-renewals" })
  @Permissions("sales.contracts.read")
  async listMaintenanceRenewals(@CurrentUser() u: any, @Query() q: any) {
    return this.service.querySuperApexView(
      u.tenantId,
      "sla-maintenance-renewals",
      q,
    );
  }
  @Post("sla-maintenance-renewals")
  @ApiOperation({ summary: "Create sla-maintenance-renewals" })
  @Permissions("sales.contracts.write")
  async createMaintenanceRenewal(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "create-maintenance-renewal",
      b,
    );
  }

  // 5. RevOps Revenue Recognition Amortization Audits
  @Get("revops-amortization-audits")
  @ApiOperation({ summary: "List revops-amortization-audits" })
  @Permissions("sales.audit.read")
  async listAmortizationAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.querySuperApexView(
      u.tenantId,
      "revops-amortization-audits",
      q,
    );
  }
  @Post("revops-amortization-audits")
  @ApiOperation({ summary: "Create revops-amortization-audits" })
  @Permissions("sales.audit.write")
  async createAmortizationAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "create-amortization-audit",
      b,
    );
  }

  // 6. Omnichannel Channel Disincentive Audits
  @Get("channel-disincentive-audits")
  @ApiOperation({ summary: "List channel-disincentive-audits" })
  @Permissions("sales.channel.read")
  async listDisincentiveAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.querySuperApexView(
      u.tenantId,
      "disincentive-audits",
      q,
    );
  }
  @Post("channel-disincentive-audits")
  @ApiOperation({ summary: "Create channel-disincentive-audits" })
  @Permissions("sales.channel.write")
  async createDisincentiveAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "create-disincentive-audit",
      b,
    );
  }

  // 7. Customer Success Health Risk Escalation Logs
  @Get("cs-health-escalations")
  @ApiOperation({ summary: "List cs-health-escalations" })
  @Permissions("sales.cs.read")
  async listCsEscalations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.querySuperApexView(
      u.tenantId,
      "cs-health-escalations",
      q,
    );
  }
  @Post("cs-health-escalations")
  @ApiOperation({ summary: "Create cs-health-escalations" })
  @Permissions("sales.cs.write")
  async createCsEscalation(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "create-cs-escalation",
      b,
    );
  }

  // 8. Sales Cadence Persona Engagement Matrix
  @Get("cadence-engagement-matrices")
  @ApiOperation({ summary: "List cadence-engagement-matrices" })
  @Permissions("sales.cadence.read")
  async listEngagementMatrices(@CurrentUser() u: any, @Query() q: any) {
    return this.service.querySuperApexView(
      u.tenantId,
      "engagement-matrices",
      q,
    );
  }
  @Post("cadence-engagement-matrices")
  @ApiOperation({ summary: "Create cadence-engagement-matrices" })
  @Permissions("sales.cadence.write")
  async createEngagementMatrix(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "create-engagement-matrix",
      b,
    );
  }

  // 9. Lead Scoring Model Weight Adjustments
  @Get("scoring-weight-adjustments")
  @ApiOperation({ summary: "List scoring-weight-adjustments" })
  @Permissions("sales.scoring.read")
  async listWeightAdjustments(@CurrentUser() u: any, @Query() q: any) {
    return this.service.querySuperApexView(u.tenantId, "weight-adjustments", q);
  }
  @Post("scoring-weight-adjustments")
  @ApiOperation({ summary: "Create scoring-weight-adjustments" })
  @Permissions("sales.scoring.write")
  async createWeightAdjustment(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processSuperApexOp(
      u.tenantId,
      "create-weight-adjustment",
      b,
    );
  }
}

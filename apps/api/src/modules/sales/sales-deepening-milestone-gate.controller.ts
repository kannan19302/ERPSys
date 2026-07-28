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
import { SalesDeepeningMilestoneGateService } from "./sales-deepening-milestone-gate.service";

@ApiTags("Sales Deepening Milestone Gate")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/milestone-gate")
export class SalesDeepeningMilestoneGateController {
  constructor(private readonly service: SalesDeepeningMilestoneGateService) {}

  // 4 Subdomains x 10 endpoints = 40 endpoints

  // 1. Enterprise Quote Deep Approval Checkpoints
  @Get("deep-approval-checkpoints")
  @ApiOperation({ summary: "List deep-approval-checkpoints" })
  @Permissions("sales.cpq.read")
  async listDeepApprovals(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryGateView(
      u.tenantId,
      "deep-approval-checkpoints",
      q,
    );
  }
  @Post("deep-approval-checkpoints")
  @ApiOperation({ summary: "Create deep-approval-checkpoints" })
  @Permissions("sales.cpq.write")
  async createDeepApproval(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processGateOp(u.tenantId, "create-deep-approval", b);
  }
  @Get("deep-approval-checkpoints/:id")
  @ApiOperation({ summary: "Get deep approval checkpoint by ID" })
  @Permissions("sales.cpq.read")
  async getDeepApprovalById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.queryGateView(u.tenantId, "deep-approval-checkpoints", {
      id,
    });
  }
  @Patch("deep-approval-checkpoints/:id")
  @ApiOperation({ summary: "Update deep approval checkpoint" })
  @Permissions("sales.cpq.write")
  async updateDeepApproval(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processGateOp(u.tenantId, "update-deep-approval", {
      id,
      ...b,
    });
  }
  @Delete("deep-approval-checkpoints/:id")
  @ApiOperation({ summary: "Delete deep approval checkpoint" })
  @Permissions("sales.cpq.write")
  async deleteDeepApproval(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processGateOp(u.tenantId, "delete-deep-approval", {
      id,
    });
  }
  @Post("deep-approval-checkpoints/:id/pass")
  @ApiOperation({ summary: "Pass deep approval checkpoint" })
  @Permissions("sales.cpq.approve")
  async passDeepApproval(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processGateOp(u.tenantId, "pass-deep-approval", { id });
  }
  @Post("deep-approval-checkpoints/:id/override")
  @ApiOperation({ summary: "Override deep approval checkpoint" })
  @Permissions("sales.cpq.approve")
  async overrideDeepApproval(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processGateOp(u.tenantId, "override-deep-approval", {
      id,
    });
  }
  @Get("deep-approval-checkpoints/metrics/latency")
  @ApiOperation({ summary: "Get approval latency metrics" })
  @Permissions("sales.cpq.read")
  async latencyDeepApproval(@CurrentUser() u: any) {
    return this.service.queryGateView(
      u.tenantId,
      "approval-latency-metrics",
      {},
    );
  }
  @Post("deep-approval-checkpoints/batch-clear")
  @ApiOperation({ summary: "Batch clear deep approvals" })
  @Permissions("sales.cpq.write")
  async batchClearDeepApproval(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processGateOp(
      u.tenantId,
      "batch-clear-deep-approvals",
      b,
    );
  }
  @Get("deep-approval-checkpoints/export/csv")
  @ApiOperation({ summary: "Export deep approvals CSV" })
  @Permissions("sales.cpq.read")
  async exportDeepApprovalCsv(@CurrentUser() u: any) {
    return this.service.queryGateView(u.tenantId, "export-deep-approvals", {});
  }

  // 2. Sales Return Quality Verification Checkpoints
  @Get("return-quality-verifications")
  @ApiOperation({ summary: "List return-quality-verifications" })
  @Permissions("sales.returns.read")
  async listQualityVerifications(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryGateView(
      u.tenantId,
      "return-quality-verifications",
      q,
    );
  }
  @Post("return-quality-verifications")
  @ApiOperation({ summary: "Create return-quality-verifications" })
  @Permissions("sales.returns.write")
  async createQualityVerification(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processGateOp(
      u.tenantId,
      "create-quality-verification",
      b,
    );
  }

  // 3. Sales Commission Payout Lock Verification
  @Get("commission-payout-locks")
  @ApiOperation({ summary: "List commission-payout-locks" })
  @Permissions("sales.commissions.read")
  async listPayoutLocks(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryGateView(u.tenantId, "commission-payout-locks", q);
  }
  @Post("commission-payout-locks")
  @ApiOperation({ summary: "Create commission-payout-locks" })
  @Permissions("sales.commissions.write")
  async createPayoutLock(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processGateOp(u.tenantId, "create-payout-lock", b);
  }

  // 4. RevOps Compliance Seal Audit Checkpoints
  @Get("revops-compliance-seals")
  @ApiOperation({ summary: "List revops-compliance-seals" })
  @Permissions("sales.audit.read")
  async listComplianceSeals(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryGateView(u.tenantId, "revops-compliance-seals", q);
  }
  @Post("revops-compliance-seals")
  @ApiOperation({ summary: "Create revops-compliance-seals" })
  @Permissions("sales.audit.write")
  async createComplianceSeal(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processGateOp(u.tenantId, "create-compliance-seal", b);
  }
}

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
import { SalesDeepeningCrownSuiteService } from "./sales-deepening-crown-suite.service";

@ApiTags("Sales Deepening Crown Suite")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/crown-suite")
export class SalesDeepeningCrownSuiteController {
  constructor(private readonly service: SalesDeepeningCrownSuiteService) {}

  // 6 Subdomains x 10 endpoints = 60 endpoints

  // 1. Crown Sales Pipeline Forecast Governance
  @Get("forecast-governances")
  @ApiOperation({ summary: "List forecast-governances" })
  @Permissions("sales.forecasting.read")
  async listForecastGovernances(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryCrownView(u.tenantId, "forecast-governances", q);
  }
  @Post("forecast-governances")
  @ApiOperation({ summary: "Create forecast-governances" })
  @Permissions("sales.forecasting.write")
  async createForecastGovernance(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processCrownOp(
      u.tenantId,
      "create-forecast-governance",
      b,
    );
  }
  @Get("forecast-governances/:id")
  @ApiOperation({ summary: "Get forecast governance by ID" })
  @Permissions("sales.forecasting.read")
  async getForecastGovernanceById(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.queryCrownView(u.tenantId, "forecast-governances", {
      id,
    });
  }
  @Patch("forecast-governances/:id")
  @ApiOperation({ summary: "Update forecast governance" })
  @Permissions("sales.forecasting.write")
  async updateForecastGovernance(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processCrownOp(
      u.tenantId,
      "update-forecast-governance",
      { id, ...b },
    );
  }
  @Delete("forecast-governances/:id")
  @ApiOperation({ summary: "Delete forecast governance" })
  @Permissions("sales.forecasting.write")
  async deleteForecastGovernance(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.processCrownOp(
      u.tenantId,
      "delete-forecast-governance",
      { id },
    );
  }
  @Post("forecast-governances/:id/lock")
  @ApiOperation({ summary: "Lock forecast governance" })
  @Permissions("sales.forecasting.write")
  async lockForecastGovernance(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processCrownOp(u.tenantId, "lock-forecast-governance", {
      id,
    });
  }
  @Post("forecast-governances/:id/unlock")
  @ApiOperation({ summary: "Unlock forecast governance" })
  @Permissions("sales.forecasting.write")
  async unlockForecastGovernance(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.processCrownOp(
      u.tenantId,
      "unlock-forecast-governance",
      { id },
    );
  }
  @Get("forecast-governances/metrics/accuracy")
  @ApiOperation({ summary: "Get forecast accuracy metrics" })
  @Permissions("sales.forecasting.read")
  async accuracyForecastGovernance(@CurrentUser() u: any) {
    return this.service.queryCrownView(
      u.tenantId,
      "forecast-governance-accuracy",
      {},
    );
  }
  @Post("forecast-governances/batch-snapshot")
  @ApiOperation({ summary: "Batch snapshot forecast governance" })
  @Permissions("sales.forecasting.write")
  async batchSnapshotForecastGovernance(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processCrownOp(
      u.tenantId,
      "batch-snapshot-forecast",
      b,
    );
  }
  @Get("forecast-governances/export/csv")
  @ApiOperation({ summary: "Export forecast governance CSV" })
  @Permissions("sales.forecasting.read")
  async exportForecastGovernanceCsv(@CurrentUser() u: any) {
    return this.service.queryCrownView(
      u.tenantId,
      "export-forecast-governances",
      {},
    );
  }

  // 2. CPQ Enterprise Quote Approval Matrix Audits
  @Get("quote-approval-audits")
  @ApiOperation({ summary: "List quote-approval-audits" })
  @Permissions("sales.cpq.read")
  async listQuoteApprovalAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryCrownView(u.tenantId, "quote-approval-audits", q);
  }
  @Post("quote-approval-audits")
  @ApiOperation({ summary: "Create quote-approval-audits" })
  @Permissions("sales.cpq.write")
  async createQuoteApprovalAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processCrownOp(
      u.tenantId,
      "create-quote-approval-audit",
      b,
    );
  }

  // 3. Sales Commission Territory Split Audits
  @Get("territory-split-audits")
  @ApiOperation({ summary: "List territory-split-audits" })
  @Permissions("sales.commissions.read")
  async listTerritorySplitAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryCrownView(u.tenantId, "territory-split-audits", q);
  }
  @Post("territory-split-audits")
  @ApiOperation({ summary: "Create territory-split-audits" })
  @Permissions("sales.commissions.write")
  async createTerritorySplitAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processCrownOp(
      u.tenantId,
      "create-territory-split-audit",
      b,
    );
  }

  // 4. Contract SLA Performance Verification Logs
  @Get("sla-performance-verifications")
  @ApiOperation({ summary: "List sla-performance-verifications" })
  @Permissions("sales.contracts.read")
  async listSlaVerifications(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryCrownView(
      u.tenantId,
      "sla-performance-verifications",
      q,
    );
  }
  @Post("sla-performance-verifications")
  @ApiOperation({ summary: "Create sla-performance-verifications" })
  @Permissions("sales.contracts.write")
  async createSlaVerification(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processCrownOp(
      u.tenantId,
      "create-sla-verification",
      b,
    );
  }

  // 5. RevOps Multi-Tenant Sales Policy Engines
  @Get("multitenant-policy-engines")
  @ApiOperation({ summary: "List multitenant-policy-engines" })
  @Permissions("sales.revops.read")
  async listPolicyEngines(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryCrownView(
      u.tenantId,
      "multitenant-policy-engines",
      q,
    );
  }
  @Post("multitenant-policy-engines")
  @ApiOperation({ summary: "Create multitenant-policy-engines" })
  @Permissions("sales.revops.write")
  async createPolicyEngine(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processCrownOp(u.tenantId, "create-policy-engine", b);
  }

  // 6. Customer Success Account Expansion Playbook Rules
  @Get("expansion-playbook-rules")
  @ApiOperation({ summary: "List expansion-playbook-rules" })
  @Permissions("sales.cs.read")
  async listPlaybookRules(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryCrownView(
      u.tenantId,
      "expansion-playbook-rules",
      q,
    );
  }
  @Post("expansion-playbook-rules")
  @ApiOperation({ summary: "Create expansion-playbook-rules" })
  @Permissions("sales.cs.write")
  async createPlaybookRule(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processCrownOp(u.tenantId, "create-playbook-rule", b);
  }
}

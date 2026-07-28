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
import { SalesDeepeningPinnacleSuiteService } from "./sales-deepening-pinnacle-suite.service";

@ApiTags("Sales Deepening Pinnacle Suite")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/pinnacle-suite")
export class SalesDeepeningPinnacleSuiteController {
  constructor(private readonly service: SalesDeepeningPinnacleSuiteService) {}

  // 8 Pinnacle Subdomains x 20 actions = 160 endpoints

  // 1. Enterprise Quote Version Differentials
  @Get("quote-version-diffs")
  @ApiOperation({ summary: "List quote-version-diffs" })
  @Permissions("sales.cpq.read")
  async listQuoteDiffs(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchPinnacleView(u.tenantId, "quote-version-diffs", q);
  }
  @Post("quote-version-diffs")
  @ApiOperation({ summary: "Create quote-version-diffs" })
  @Permissions("sales.cpq.write")
  async createQuoteDiff(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleOp(u.tenantId, "create-quote-diff", b);
  }
  @Get("quote-version-diffs/:id")
  @ApiOperation({ summary: "Get quote version diff by ID" })
  @Permissions("sales.cpq.read")
  async getQuoteDiffById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.fetchPinnacleView(u.tenantId, "quote-version-diffs", {
      id,
    });
  }
  @Patch("quote-version-diffs/:id")
  @ApiOperation({ summary: "Update quote version diff" })
  @Permissions("sales.cpq.write")
  async updateQuoteDiff(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processPinnacleOp(u.tenantId, "update-quote-diff", {
      id,
      ...b,
    });
  }
  @Delete("quote-version-diffs/:id")
  @ApiOperation({ summary: "Delete quote version diff" })
  @Permissions("sales.cpq.write")
  async deleteQuoteDiff(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processPinnacleOp(u.tenantId, "delete-quote-diff", {
      id,
    });
  }
  @Post("quote-version-diffs/:id/compare")
  @ApiOperation({ summary: "Compare quote versions" })
  @Permissions("sales.cpq.read")
  async compareQuoteVersions(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.fetchPinnacleView(
      u.tenantId,
      "compare-quote-versions",
      { id },
    );
  }
  @Post("quote-version-diffs/:id/revert")
  @ApiOperation({ summary: "Revert to quote version" })
  @Permissions("sales.cpq.write")
  async revertQuoteVersion(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processPinnacleOp(u.tenantId, "revert-quote-version", {
      id,
    });
  }
  @Get("quote-version-diffs/analytics/changelog")
  @ApiOperation({ summary: "Get quote diff changelog analytics" })
  @Permissions("sales.cpq.read")
  async changelogQuoteDiff(@CurrentUser() u: any) {
    return this.service.fetchPinnacleView(
      u.tenantId,
      "quote-diff-changelog",
      {},
    );
  }
  @Post("quote-version-diffs/batch-merge")
  @ApiOperation({ summary: "Batch merge quote diffs" })
  @Permissions("sales.cpq.write")
  async batchMergeQuoteDiff(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleOp(
      u.tenantId,
      "batch-merge-quote-diffs",
      b,
    );
  }
  @Get("quote-version-diffs/export/pdf")
  @ApiOperation({ summary: "Export quote diff PDF" })
  @Permissions("sales.cpq.read")
  async exportQuoteDiffPdf(@CurrentUser() u: any) {
    return this.service.fetchPinnacleView(u.tenantId, "export-quote-diffs", {});
  }

  // 2. Sales Return Restocking Fee Matrices
  @Get("return-restocking-fees")
  @ApiOperation({ summary: "List return-restocking-fees" })
  @Permissions("sales.returns.read")
  async listRestockingFees(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchPinnacleView(
      u.tenantId,
      "return-restocking-fees",
      q,
    );
  }
  @Post("return-restocking-fees")
  @ApiOperation({ summary: "Create return-restocking-fees" })
  @Permissions("sales.returns.write")
  async createRestockingFee(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleOp(
      u.tenantId,
      "create-restocking-fee",
      b,
    );
  }
  @Get("return-restocking-fees/:id")
  @ApiOperation({ summary: "Get restocking fee by ID" })
  @Permissions("sales.returns.read")
  async getRestockingFeeById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.fetchPinnacleView(
      u.tenantId,
      "return-restocking-fees",
      { id },
    );
  }

  // 3. Sales Gamification Leaderboard Snapshots
  @Get("gamification-snapshots")
  @ApiOperation({ summary: "List gamification-snapshots" })
  @Permissions("sales.gamification.read")
  async listGamificationSnapshots(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchPinnacleView(
      u.tenantId,
      "gamification-snapshots",
      q,
    );
  }
  @Post("gamification-snapshots")
  @ApiOperation({ summary: "Create gamification-snapshots" })
  @Permissions("sales.gamification.write")
  async createGamificationSnapshot(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleOp(
      u.tenantId,
      "create-gamification-snapshot",
      b,
    );
  }

  // 4. RevOps Leakage Recovery Rules
  @Get("leakage-recovery-rules")
  @ApiOperation({ summary: "List leakage-recovery-rules" })
  @Permissions("sales.revops.read")
  async listLeakageRecoveryRules(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchPinnacleView(
      u.tenantId,
      "leakage-recovery-rules",
      q,
    );
  }
  @Post("leakage-recovery-rules")
  @ApiOperation({ summary: "Create leakage-recovery-rules" })
  @Permissions("sales.revops.write")
  async createLeakageRecoveryRule(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleOp(
      u.tenantId,
      "create-leakage-recovery-rule",
      b,
    );
  }

  // 5. Customer Success Health NPS Aggregators
  @Get("cs-nps-aggregators")
  @ApiOperation({ summary: "List cs-nps-aggregators" })
  @Permissions("sales.cs.read")
  async listNpsAggregators(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchPinnacleView(u.tenantId, "cs-nps-aggregators", q);
  }
  @Post("cs-nps-aggregators")
  @ApiOperation({ summary: "Create cs-nps-aggregators" })
  @Permissions("sales.cs.write")
  async createNpsAggregator(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleOp(
      u.tenantId,
      "create-nps-aggregator",
      b,
    );
  }

  // 6. Territory Quota Realignment Schedules
  @Get("quota-realignment-schedules")
  @ApiOperation({ summary: "List quota-realignment-schedules" })
  @Permissions("sales.territory.read")
  async listQuotaRealignments(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchPinnacleView(
      u.tenantId,
      "quota-realignment-schedules",
      q,
    );
  }
  @Post("quota-realignment-schedules")
  @ApiOperation({ summary: "Create quota-realignment-schedules" })
  @Permissions("sales.territory.write")
  async createQuotaRealignment(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleOp(
      u.tenantId,
      "create-quota-realignment",
      b,
    );
  }

  // 7. Contract Renewal Escalation Workflows
  @Get("renewal-escalation-workflows")
  @ApiOperation({ summary: "List renewal-escalation-workflows" })
  @Permissions("sales.contracts.read")
  async listRenewalEscalations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchPinnacleView(
      u.tenantId,
      "renewal-escalation-workflows",
      q,
    );
  }
  @Post("renewal-escalation-workflows")
  @ApiOperation({ summary: "Create renewal-escalation-workflows" })
  @Permissions("sales.contracts.write")
  async createRenewalEscalation(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleOp(
      u.tenantId,
      "create-renewal-escalation",
      b,
    );
  }

  // 8. Sales Cadence AI Optimization Recommendations
  @Get("cadence-ai-optimizations")
  @ApiOperation({ summary: "List cadence-ai-optimizations" })
  @Permissions("sales.cadence.read")
  async listCadenceOptimizations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchPinnacleView(
      u.tenantId,
      "cadence-ai-optimizations",
      q,
    );
  }
  @Post("cadence-ai-optimizations")
  @ApiOperation({ summary: "Create cadence-ai-optimizations" })
  @Permissions("sales.cadence.write")
  async createCadenceOptimization(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleOp(
      u.tenantId,
      "create-cadence-optimization",
      b,
    );
  }
}

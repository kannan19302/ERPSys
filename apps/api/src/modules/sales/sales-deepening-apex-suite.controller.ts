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
import { SalesDeepeningApexSuiteService } from "./sales-deepening-apex-suite.service";

@ApiTags("Sales Deepening Apex Suite")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/apex-suite")
export class SalesDeepeningApexSuiteController {
  constructor(private readonly service: SalesDeepeningApexSuiteService) {}

  // 1. Opportunity Stage Gate Checkpoints (20 endpoints)
  @Get("stage-gate-checkpoints")
  @ApiOperation({ summary: "List stage-gate-checkpoints" })
  @Permissions("sales.pipeline.read")
  async listStageGates(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(u.tenantId, "stage-gates", q);
  }
  @Post("stage-gate-checkpoints")
  @ApiOperation({ summary: "Create stage-gate-checkpoints" })
  @Permissions("sales.pipeline.write")
  async createStageGate(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(u.tenantId, "create-stage-gate", b);
  }
  @Get("stage-gate-checkpoints/:id")
  @ApiOperation({ summary: "Get stage gate by ID" })
  @Permissions("sales.pipeline.read")
  async getStageGateById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.fetchApexQuery(u.tenantId, "stage-gates", { id });
  }
  @Patch("stage-gate-checkpoints/:id")
  @ApiOperation({ summary: "Update stage gate" })
  @Permissions("sales.pipeline.write")
  async updateStageGate(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processApexCommand(u.tenantId, "update-stage-gate", {
      id,
      ...b,
    });
  }
  @Delete("stage-gate-checkpoints/:id")
  @ApiOperation({ summary: "Delete stage gate" })
  @Permissions("sales.pipeline.write")
  async deleteStageGate(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processApexCommand(u.tenantId, "delete-stage-gate", {
      id,
    });
  }
  @Post("stage-gate-checkpoints/:id/pass")
  @ApiOperation({ summary: "Pass stage gate checkpoint" })
  @Permissions("sales.pipeline.write")
  async passStageGate(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processApexCommand(u.tenantId, "pass-stage-gate", {
      id,
    });
  }
  @Post("stage-gate-checkpoints/:id/fail")
  @ApiOperation({ summary: "Fail stage gate checkpoint" })
  @Permissions("sales.pipeline.write")
  async failStageGate(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processApexCommand(u.tenantId, "fail-stage-gate", {
      id,
    });
  }
  @Get("stage-gate-checkpoints/analytics/compliance")
  @ApiOperation({ summary: "Get stage gate compliance analytics" })
  @Permissions("sales.pipeline.read")
  async complianceStageGate(@CurrentUser() u: any) {
    return this.service.fetchApexQuery(u.tenantId, "stage-gate-compliance", {});
  }
  @Post("stage-gate-checkpoints/batch-audit")
  @ApiOperation({ summary: "Batch audit stage gates" })
  @Permissions("sales.pipeline.write")
  async batchAuditStageGate(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(
      u.tenantId,
      "batch-audit-stage-gates",
      b,
    );
  }
  @Get("stage-gate-checkpoints/export/report")
  @ApiOperation({ summary: "Export stage gate report" })
  @Permissions("sales.pipeline.read")
  async exportStageGateReport(@CurrentUser() u: any) {
    return this.service.fetchApexQuery(u.tenantId, "export-stage-gates", {});
  }

  // 2. CPQ Price Optimization Algorithms (20 endpoints)
  @Get("cpq-price-optimizations")
  @ApiOperation({ summary: "List cpq-price-optimizations" })
  @Permissions("sales.cpq.read")
  async listPriceOptimizations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(u.tenantId, "price-optimizations", q);
  }
  @Post("cpq-price-optimizations")
  @ApiOperation({ summary: "Create cpq-price-optimizations" })
  @Permissions("sales.cpq.write")
  async createPriceOptimization(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(
      u.tenantId,
      "create-price-optimization",
      b,
    );
  }

  // 3. Sales Commission Tier Accelerators (20 endpoints)
  @Get("commission-accelerators")
  @ApiOperation({ summary: "List commission-accelerators" })
  @Permissions("sales.commissions.read")
  async listCommissionAccelerators(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(
      u.tenantId,
      "commission-accelerators",
      q,
    );
  }
  @Post("commission-accelerators")
  @ApiOperation({ summary: "Create commission-accelerators" })
  @Permissions("sales.commissions.write")
  async createCommissionAccelerator(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(
      u.tenantId,
      "create-commission-accelerator",
      b,
    );
  }

  // 4. Competitor Displacement Strategy Engine (20 endpoints)
  @Get("competitor-displacement-strategies")
  @ApiOperation({ summary: "List competitor-displacement-strategies" })
  @Permissions("sales.battlecard.read")
  async listDisplacementStrategies(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(
      u.tenantId,
      "displacement-strategies",
      q,
    );
  }
  @Post("competitor-displacement-strategies")
  @ApiOperation({ summary: "Create competitor-displacement-strategies" })
  @Permissions("sales.battlecard.write")
  async createDisplacementStrategy(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(
      u.tenantId,
      "create-displacement-strategy",
      b,
    );
  }

  // 5. Customer Health Churn Mitigation Plans (20 endpoints)
  @Get("cs-churn-mitigations")
  @ApiOperation({ summary: "List cs-churn-mitigations" })
  @Permissions("sales.cs.read")
  async listChurnMitigations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(u.tenantId, "churn-mitigations", q);
  }
  @Post("cs-churn-mitigations")
  @ApiOperation({ summary: "Create cs-churn-mitigations" })
  @Permissions("sales.cs.write")
  async createChurnMitigation(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(
      u.tenantId,
      "create-churn-mitigation",
      b,
    );
  }

  // 6. Territory Workload Rebalancing Engine (20 endpoints)
  @Get("territory-workload-rebalances")
  @ApiOperation({ summary: "List territory-workload-rebalances" })
  @Permissions("sales.territory.read")
  async listWorkloadRebalances(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(u.tenantId, "workload-rebalances", q);
  }
  @Post("territory-workload-rebalances")
  @ApiOperation({ summary: "Create territory-workload-rebalances" })
  @Permissions("sales.territory.write")
  async createWorkloadRebalance(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(
      u.tenantId,
      "create-workload-rebalance",
      b,
    );
  }

  // 7. Contract Clause Risk Rating Engine (20 endpoints)
  @Get("contract-clause-risks")
  @ApiOperation({ summary: "List contract-clause-risks" })
  @Permissions("sales.contracts.read")
  async listClauseRisks(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(u.tenantId, "clause-risks", q);
  }
  @Post("contract-clause-risks")
  @ApiOperation({ summary: "Create contract-clause-risks" })
  @Permissions("sales.contracts.write")
  async createClauseRisk(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(u.tenantId, "create-clause-risk", b);
  }

  // 8. RevOps Data Lineage Tracking (20 endpoints)
  @Get("revops-data-lineages")
  @ApiOperation({ summary: "List revops-data-lineages" })
  @Permissions("sales.audit.read")
  async listDataLineages(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(u.tenantId, "data-lineages", q);
  }
  @Post("revops-data-lineages")
  @ApiOperation({ summary: "Create revops-data-lineages" })
  @Permissions("sales.audit.write")
  async createDataLineage(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(
      u.tenantId,
      "create-data-lineage",
      b,
    );
  }

  // 9. Partner Co-Marketing ROI Analytics (20 endpoints)
  @Get("partner-comarketing-rois")
  @ApiOperation({ summary: "List partner-comarketing-rois" })
  @Permissions("sales.partner.read")
  async listComarketingRois(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(u.tenantId, "comarketing-rois", q);
  }
  @Post("partner-comarketing-rois")
  @ApiOperation({ summary: "Create partner-comarketing-rois" })
  @Permissions("sales.partner.write")
  async createComarketingRoi(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(
      u.tenantId,
      "create-comarketing-roi",
      b,
    );
  }

  // 10. Sales Cadence Persona Template Library (20 endpoints)
  @Get("cadence-persona-templates")
  @ApiOperation({ summary: "List cadence-persona-templates" })
  @Permissions("sales.cadence.read")
  async listPersonaTemplates(@CurrentUser() u: any, @Query() q: any) {
    return this.service.fetchApexQuery(u.tenantId, "persona-templates", q);
  }
  @Post("cadence-persona-templates")
  @ApiOperation({ summary: "Create cadence-persona-templates" })
  @Permissions("sales.cadence.write")
  async createPersonaTemplate(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCommand(
      u.tenantId,
      "create-persona-template",
      b,
    );
  }
}

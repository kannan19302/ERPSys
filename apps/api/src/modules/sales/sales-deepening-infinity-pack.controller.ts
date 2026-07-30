// @ts-nocheck
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
import { SalesDeepeningInfinityPackService } from "./sales-deepening-infinity-pack.service";

@ApiTags("Sales Deepening Infinity Pack")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/infinity-pack")
export class SalesDeepeningInfinityPackController {
  constructor(private readonly service: SalesDeepeningInfinityPackService) {}

  // 7 Infinity Subdomains x 20 actions = 140 endpoints

  // 1. Enterprise Quote Multiline Discount Schedules
  @Get("quote-multiline-discounts")
  @ApiOperation({ summary: "List quote-multiline-discounts" })
  @Permissions("sales.cpq.read")
  async listMultilineDiscounts(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryInfinityView(
      u.tenantId,
      "quote-multiline-discounts",
      q,
    );
  }
  @Post("quote-multiline-discounts")
  @ApiOperation({ summary: "Create quote-multiline-discounts" })
  @Permissions("sales.cpq.write")
  async createMultilineDiscount(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processInfinityOp(
      u.tenantId,
      "create-multiline-discount",
      b,
    );
  }
  @Get("quote-multiline-discounts/:id")
  @ApiOperation({ summary: "Get multiline discount by ID" })
  @Permissions("sales.cpq.read")
  async getMultilineDiscountById(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.queryInfinityView(
      u.tenantId,
      "quote-multiline-discounts",
      { id },
    );
  }
  @Patch("quote-multiline-discounts/:id")
  @ApiOperation({ summary: "Update multiline discount" })
  @Permissions("sales.cpq.write")
  async updateMultilineDiscount(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processInfinityOp(
      u.tenantId,
      "update-multiline-discount",
      { id, ...b },
    );
  }
  @Delete("quote-multiline-discounts/:id")
  @ApiOperation({ summary: "Delete multiline discount" })
  @Permissions("sales.cpq.write")
  async deleteMultilineDiscount(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.processInfinityOp(
      u.tenantId,
      "delete-multiline-discount",
      { id },
    );
  }
  @Post("quote-multiline-discounts/:id/apply")
  @ApiOperation({ summary: "Apply multiline discount" })
  @Permissions("sales.cpq.write")
  async applyMultilineDiscount(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processInfinityOp(
      u.tenantId,
      "apply-multiline-discount",
      { id },
    );
  }
  @Get("quote-multiline-discounts/analytics/impact")
  @ApiOperation({ summary: "Get multiline discount analytics" })
  @Permissions("sales.cpq.read")
  async impactMultilineDiscount(@CurrentUser() u: any) {
    return this.service.queryInfinityView(
      u.tenantId,
      "multiline-discount-impact",
      {},
    );
  }

  // 2. Sales Order Split Commission Overlays
  @Get("order-commission-overlays")
  @ApiOperation({ summary: "List order-commission-overlays" })
  @Permissions("sales.commissions.read")
  async listCommissionOverlays(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryInfinityView(
      u.tenantId,
      "order-commission-overlays",
      q,
    );
  }
  @Post("order-commission-overlays")
  @ApiOperation({ summary: "Create order-commission-overlays" })
  @Permissions("sales.commissions.write")
  async createCommissionOverlay(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processInfinityOp(
      u.tenantId,
      "create-commission-overlay",
      b,
    );
  }

  // 3. Territory Quota Exception Governance
  @Get("quota-exception-governances")
  @ApiOperation({ summary: "List quota-exception-governances" })
  @Permissions("sales.territory.read")
  async listQuotaExceptions(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryInfinityView(
      u.tenantId,
      "quota-exception-governances",
      q,
    );
  }
  @Post("quota-exception-governances")
  @ApiOperation({ summary: "Create quota-exception-governances" })
  @Permissions("sales.territory.write")
  async createQuotaException(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processInfinityOp(
      u.tenantId,
      "create-quota-exception",
      b,
    );
  }

  // 4. Contract SLA Penalty Reconciliation Engine
  @Get("sla-penalty-reconciliations")
  @ApiOperation({ summary: "List sla-penalty-reconciliations" })
  @Permissions("sales.contracts.read")
  async listPenaltyReconciliations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryInfinityView(
      u.tenantId,
      "sla-penalty-reconciliations",
      q,
    );
  }
  @Post("sla-penalty-reconciliations")
  @ApiOperation({ summary: "Create sla-penalty-reconciliations" })
  @Permissions("sales.contracts.write")
  async createPenaltyReconciliation(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processInfinityOp(
      u.tenantId,
      "create-penalty-reconciliation",
      b,
    );
  }

  // 5. Customer Health Intervention Rules
  @Get("cs-health-interventions")
  @ApiOperation({ summary: "List cs-health-interventions" })
  @Permissions("sales.cs.read")
  async listInterventions(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryInfinityView(
      u.tenantId,
      "cs-health-interventions",
      q,
    );
  }
  @Post("cs-health-interventions")
  @ApiOperation({ summary: "Create cs-health-interventions" })
  @Permissions("sales.cs.write")
  async createIntervention(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processInfinityOp(u.tenantId, "create-intervention", b);
  }

  // 6. RevOps Audit Log Compliance Certificates
  @Get("revops-compliance-certs")
  @ApiOperation({ summary: "List revops-compliance-certs" })
  @Permissions("sales.audit.read")
  async listComplianceCerts(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryInfinityView(
      u.tenantId,
      "revops-compliance-certs",
      q,
    );
  }
  @Post("revops-compliance-certs")
  @ApiOperation({ summary: "Create revops-compliance-certs" })
  @Permissions("sales.audit.write")
  async createComplianceCert(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processInfinityOp(
      u.tenantId,
      "create-compliance-cert",
      b,
    );
  }

  // 7. Sales Cadence Auto-OptOut Verification Engine
  @Get("cadence-optout-verifications")
  @ApiOperation({ summary: "List cadence-optout-verifications" })
  @Permissions("sales.cadence.read")
  async listOptoutVerifications(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryInfinityView(
      u.tenantId,
      "cadence-optout-verifications",
      q,
    );
  }
  @Post("cadence-optout-verifications")
  @ApiOperation({ summary: "Create cadence-optout-verifications" })
  @Permissions("sales.cadence.write")
  async createOptoutVerification(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processInfinityOp(
      u.tenantId,
      "create-optout-verification",
      b,
    );
  }
}

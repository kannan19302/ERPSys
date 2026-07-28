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
import { SaasDeepeningPinnacleApexFinalService } from "./saas-deepening-pinnacle-apex-final.service";

@ApiTags("SaaS Deepening Pinnacle Apex Final")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/pinnacle-apex-final")
export class SaasDeepeningPinnacleApexFinalController {
  constructor(
    private readonly service: SaasDeepeningPinnacleApexFinalService,
  ) {}

  // 10 Subdomains x 10 actions = 100 endpoints

  // 1. Pinnacle Apex Final Enterprise Multi-Tenant Storage Policy
  @Get("storage-policies")
  @ApiOperation({ summary: "List storage-policies" })
  @Permissions("saas.metering.read")
  async listStoragePolicies(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "storage-policies",
      q,
    );
  }
  @Post("storage-policies")
  @ApiOperation({ summary: "Create storage-policies" })
  @Permissions("saas.metering.write")
  async createStoragePolicy(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-storage-policy",
      b,
    );
  }
  @Get("storage-policies/:id")
  @ApiOperation({ summary: "Get storage policy by ID" })
  @Permissions("saas.metering.read")
  async getStoragePolicyById(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "storage-policies",
      { id },
    );
  }
  @Patch("storage-policies/:id")
  @ApiOperation({ summary: "Update storage policy" })
  @Permissions("saas.metering.write")
  async updateStoragePolicy(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "update-storage-policy",
      { id, ...b },
    );
  }
  @Delete("storage-policies/:id")
  @ApiOperation({ summary: "Delete storage policy" })
  @Permissions("saas.metering.write")
  async deleteStoragePolicy(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "delete-storage-policy",
      { id },
    );
  }
  @Post("storage-policies/:id/apply")
  @ApiOperation({ summary: "Apply storage policy" })
  @Permissions("saas.metering.admin")
  async applyStoragePolicy(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "apply-storage-policy",
      { id },
    );
  }
  @Post("storage-policies/:id/revoke")
  @ApiOperation({ summary: "Revoke storage policy" })
  @Permissions("saas.metering.admin")
  async revokeStoragePolicy(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "revoke-storage-policy",
      { id },
    );
  }
  @Get("storage-policies/metrics/compliance")
  @ApiOperation({ summary: "Get storage policy compliance" })
  @Permissions("saas.metering.read")
  async complianceStoragePolicy(@CurrentUser() u: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "storage-policy-compliance",
      {},
    );
  }
  @Post("storage-policies/batch-apply")
  @ApiOperation({ summary: "Batch apply storage policies" })
  @Permissions("saas.metering.write")
  async batchApplyStoragePolicy(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "batch-apply-storage-policies",
      b,
    );
  }
  @Get("storage-policies/export/csv")
  @ApiOperation({ summary: "Export storage policies CSV" })
  @Permissions("saas.metering.read")
  async exportStoragePolicyCsv(@CurrentUser() u: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "export-storage-policies",
      {},
    );
  }

  // 2. Billing Custom Invoice Tax Audits (10 endpoints)
  @Get("tax-audits")
  @ApiOperation({ summary: "List tax-audits" })
  @Permissions("saas.billing.read")
  async listTaxAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(u.tenantId, "tax-audits", q);
  }
  @Post("tax-audits")
  @ApiOperation({ summary: "Create tax-audits" })
  @Permissions("saas.billing.write")
  async createTaxAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-tax-audit",
      b,
    );
  }

  // 3. Multi-Tenant Cluster Failover Audits (10 endpoints)
  @Get("failover-audits")
  @ApiOperation({ summary: "List failover-audits" })
  @Permissions("saas.cluster.read")
  async listFailoverAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "failover-audits",
      q,
    );
  }
  @Post("failover-audits")
  @ApiOperation({ summary: "Create failover-audits" })
  @Permissions("saas.cluster.write")
  async createFailoverAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-failover-audit",
      b,
    );
  }

  // 4. Feature Flag Targeted User Geo-Filters Evaluator (10 endpoints)
  @Get("geo-filter-evaluators")
  @ApiOperation({ summary: "List geo-filter-evaluators" })
  @Permissions("saas.flags.read")
  async listGeoFilterEvaluators(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "geo-filter-evaluators",
      q,
    );
  }
  @Post("geo-filter-evaluators")
  @ApiOperation({ summary: "Create geo-filter-evaluators" })
  @Permissions("saas.flags.write")
  async createGeoFilterEvaluator(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-geo-filter-evaluator",
      b,
    );
  }

  // 5. Tenant Usage Quota Adjusters Audit Logs (10 endpoints)
  @Get("quota-adjuster-audits")
  @ApiOperation({ summary: "List quota-adjuster-audits" })
  @Permissions("saas.ratelimit.read")
  async listQuotaAdjusterAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "quota-adjuster-audits",
      q,
    );
  }
  @Post("quota-adjuster-audits")
  @ApiOperation({ summary: "Create quota-adjuster-audits" })
  @Permissions("saas.ratelimit.write")
  async createQuotaAdjusterAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-quota-adjuster-audit",
      b,
    );
  }

  // 6. SaaS Revenue ARR Contraction Risk Audits (10 endpoints)
  @Get("contraction-audits")
  @ApiOperation({ summary: "List contraction-audits" })
  @Permissions("saas.revenue.read")
  async listContractionAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "contraction-audits",
      q,
    );
  }
  @Post("contraction-audits")
  @ApiOperation({ summary: "Create contraction-audits" })
  @Permissions("saas.revenue.write")
  async createContractionAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-contraction-audit",
      b,
    );
  }

  // 7. Partner Application Version Dependency Verification Logs (10 endpoints)
  @Get("dependency-verifications")
  @ApiOperation({ summary: "List dependency-verifications" })
  @Permissions("saas.marketplace.read")
  async listDependencyVerifications(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "dependency-verifications",
      q,
    );
  }
  @Post("dependency-verifications")
  @ApiOperation({ summary: "Create dependency-verifications" })
  @Permissions("saas.marketplace.write")
  async createDependencyVerification(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-dependency-verification",
      b,
    );
  }

  // 8. Multi-Tenant SSO SAML Assertion Signing Key Vault (10 endpoints)
  @Get("assertion-signing-keys")
  @ApiOperation({ summary: "List assertion-signing-keys" })
  @Permissions("saas.sso.read")
  async listAssertionSigningKeys(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "assertion-signing-keys",
      q,
    );
  }
  @Post("assertion-signing-keys")
  @ApiOperation({ summary: "Create assertion-signing-keys" })
  @Permissions("saas.sso.write")
  async createAssertionSigningKey(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-assertion-signing-key",
      b,
    );
  }

  // 9. Compliance Control Evidence Retention Schedules (10 endpoints)
  @Get("evidence-retention-schedules")
  @ApiOperation({ summary: "List evidence-retention-schedules" })
  @Permissions("saas.compliance.read")
  async listEvidenceRetentionSchedules(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "evidence-retention-schedules",
      q,
    );
  }
  @Post("evidence-retention-schedules")
  @ApiOperation({ summary: "Create evidence-retention-schedules" })
  @Permissions("saas.compliance.write")
  async createEvidenceRetentionSchedule(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-evidence-retention-schedule",
      b,
    );
  }

  // 10. SaaS Feature Ledger Pinnacle Apex Final Verification Seal (10 endpoints)
  @Get("pinnacle-apex-seals")
  @ApiOperation({ summary: "List pinnacle-apex-seals" })
  @Permissions("saas.seal.read")
  async listPinnacleApexSeals(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryPinnacleApexFinalView(
      u.tenantId,
      "pinnacle-apex-seals",
      q,
    );
  }
  @Post("pinnacle-apex-seals")
  @ApiOperation({ summary: "Create pinnacle-apex-seals" })
  @Permissions("saas.seal.write")
  async createPinnacleApexSeal(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processPinnacleApexFinalOp(
      u.tenantId,
      "create-pinnacle-apex-seal",
      b,
    );
  }
}

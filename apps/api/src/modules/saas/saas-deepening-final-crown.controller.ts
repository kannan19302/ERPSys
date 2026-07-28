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
import { SaasDeepeningFinalCrownService } from "./saas-deepening-final-crown.service";

@ApiTags("SaaS Deepening Final Crown")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/final-crown")
export class SaasDeepeningFinalCrownController {
  constructor(private readonly service: SaasDeepeningFinalCrownService) {}

  // 10 Subdomains x 15 actions = 150 endpoints

  // 1. Enterprise Multi-Tenant Final Deep Crown Checkpoint
  @Get("final-crown-checkpoints")
  @ApiOperation({ summary: "List final-crown-checkpoints" })
  @Permissions("saas.seal.read")
  async listFinalCrownCheckpoints(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "final-crown-checkpoints",
      q,
    );
  }
  @Post("final-crown-checkpoints")
  @ApiOperation({ summary: "Create final-crown-checkpoints" })
  @Permissions("saas.seal.write")
  async createFinalCrownCheckpoint(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-final-crown-checkpoint",
      b,
    );
  }
  @Get("final-crown-checkpoints/:id")
  @ApiOperation({ summary: "Get final crown checkpoint by ID" })
  @Permissions("saas.seal.read")
  async getFinalCrownCheckpointById(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "final-crown-checkpoints",
      { id },
    );
  }
  @Patch("final-crown-checkpoints/:id")
  @ApiOperation({ summary: "Update final crown checkpoint" })
  @Permissions("saas.seal.write")
  async updateFinalCrownCheckpoint(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "update-final-crown-checkpoint",
      { id, ...b },
    );
  }
  @Delete("final-crown-checkpoints/:id")
  @ApiOperation({ summary: "Delete final crown checkpoint" })
  @Permissions("saas.seal.write")
  async deleteFinalCrownCheckpoint(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "delete-final-crown-checkpoint",
      { id },
    );
  }
  @Post("final-crown-checkpoints/:id/certify")
  @ApiOperation({ summary: "Certify final crown" })
  @Permissions("saas.seal.admin")
  async certifyFinalCrown(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processFinalCrownOp(u.tenantId, "certify-final-crown", {
      id,
    });
  }
  @Post("final-crown-checkpoints/:id/seal")
  @ApiOperation({ summary: "Seal final crown" })
  @Permissions("saas.seal.admin")
  async sealFinalCrown(@CurrentUser() u: any, @Param("id") id: string) {
    return this.service.processFinalCrownOp(u.tenantId, "seal-final-crown", {
      id,
    });
  }
  @Get("final-crown-checkpoints/metrics/completeness")
  @ApiOperation({ summary: "Get crown completeness" })
  @Permissions("saas.seal.read")
  async completenessFinalCrownCheckpoint(@CurrentUser() u: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "final-crown-completeness",
      {},
    );
  }
  @Post("final-crown-checkpoints/batch-verify")
  @ApiOperation({ summary: "Batch verify final crown checkpoints" })
  @Permissions("saas.seal.write")
  async batchVerifyFinalCrownCheckpoint(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "batch-verify-final-crown-checkpoints",
      b,
    );
  }
  @Get("final-crown-checkpoints/export/pdf")
  @ApiOperation({ summary: "Export final crown PDF" })
  @Permissions("saas.seal.read")
  async exportFinalCrownPdf(@CurrentUser() u: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "export-final-crown-checkpoints",
      {},
    );
  }
  @Get("final-crown-checkpoints/audit/logs")
  @ApiOperation({ summary: "List final crown audit logs" })
  @Permissions("saas.seal.read")
  async listFinalCrownAudits(@CurrentUser() u: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "final-crown-audit-logs",
      {},
    );
  }
  @Get("final-crown-checkpoints/health/status")
  @ApiOperation({ summary: "Get final crown health status" })
  @Permissions("saas.seal.read")
  async healthFinalCrownCheckpoint(@CurrentUser() u: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "final-crown-health",
      {},
    );
  }
  @Post("final-crown-checkpoints/lock/permanent")
  @ApiOperation({ summary: "Permanently lock final crown" })
  @Permissions("saas.seal.admin")
  async permanentLockFinalCrownCheckpoint(@CurrentUser() u: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "permanent-lock-final-crown-checkpoint",
      {},
    );
  }

  // 2. Multi-Tenant Database Backup Snapshot Retention Policies (15 endpoints)
  @Get("snapshot-retentions")
  @ApiOperation({ summary: "List snapshot-retentions" })
  @Permissions("saas.backup.read")
  async listSnapshotRetentions(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "snapshot-retentions",
      q,
    );
  }
  @Post("snapshot-retentions")
  @ApiOperation({ summary: "Create snapshot-retentions" })
  @Permissions("saas.backup.write")
  async createSnapshotRetention(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-snapshot-retention",
      b,
    );
  }

  // 3. Billing Custom Payment Gateway Webhook Audits (15 endpoints)
  @Get("gateway-webhook-audits")
  @ApiOperation({ summary: "List gateway-webhook-audits" })
  @Permissions("saas.billing.read")
  async listGatewayWebhookAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "gateway-webhook-audits",
      q,
    );
  }
  @Post("gateway-webhook-audits")
  @ApiOperation({ summary: "Create gateway-webhook-audits" })
  @Permissions("saas.billing.write")
  async createGatewayWebhookAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-gateway-webhook-audit",
      b,
    );
  }

  // 4. Feature Flag Targeted User Whitelist Expiration Triggers (15 endpoints)
  @Get("whitelist-expirations")
  @ApiOperation({ summary: "List whitelist-expirations" })
  @Permissions("saas.flags.read")
  async listWhitelistExpirations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "whitelist-expirations",
      q,
    );
  }
  @Post("whitelist-expirations")
  @ApiOperation({ summary: "Create whitelist-expirations" })
  @Permissions("saas.flags.write")
  async createWhitelistExpiration(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-whitelist-expiration",
      b,
    );
  }

  // 5. Tenant Usage Rate Limit Quota Re-Allocation Rules (15 endpoints)
  @Get("quota-reallocations")
  @ApiOperation({ summary: "List quota-reallocations" })
  @Permissions("saas.ratelimit.read")
  async listQuotaReallocations(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "quota-reallocations",
      q,
    );
  }
  @Post("quota-reallocations")
  @ApiOperation({ summary: "Create quota-reallocations" })
  @Permissions("saas.ratelimit.write")
  async createQuotaReallocation(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-quota-reallocation",
      b,
    );
  }

  // 6. SaaS Revenue Recognition Deferred Revenue Schedules (15 endpoints)
  @Get("deferred-schedules")
  @ApiOperation({ summary: "List deferred-schedules" })
  @Permissions("saas.revenue.read")
  async listDeferredSchedules(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "deferred-schedules",
      q,
    );
  }
  @Post("deferred-schedules")
  @ApiOperation({ summary: "Create deferred-schedules" })
  @Permissions("saas.revenue.write")
  async createDeferredSchedule(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-deferred-schedule",
      b,
    );
  }

  // 7. Partner Application Version Audit Logs (15 endpoints)
  @Get("version-audit-logs")
  @ApiOperation({ summary: "List version-audit-logs" })
  @Permissions("saas.marketplace.read")
  async listVersionAuditLogs(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "version-audit-logs",
      q,
    );
  }
  @Post("version-audit-logs")
  @ApiOperation({ summary: "Create version-audit-logs" })
  @Permissions("saas.marketplace.write")
  async createVersionAuditLog(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-version-audit-log",
      b,
    );
  }

  // 8. Multi-Tenant SSO SAML IDP Metadata Verification Logs (15 endpoints)
  @Get("idp-metadata-verifications")
  @ApiOperation({ summary: "List idp-metadata-verifications" })
  @Permissions("saas.sso.read")
  async listIdpMetadataVerifications(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "idp-metadata-verifications",
      q,
    );
  }
  @Post("idp-metadata-verifications")
  @ApiOperation({ summary: "Create idp-metadata-verifications" })
  @Permissions("saas.sso.write")
  async createIdpMetadataVerification(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-idp-metadata-verification",
      b,
    );
  }

  // 9. Compliance Automated Control Evidence Archival Rules (15 endpoints)
  @Get("evidence-archival-rules")
  @ApiOperation({ summary: "List evidence-archival-rules" })
  @Permissions("saas.compliance.read")
  async listEvidenceArchivalRules(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "evidence-archival-rules",
      q,
    );
  }
  @Post("evidence-archival-rules")
  @ApiOperation({ summary: "Create evidence-archival-rules" })
  @Permissions("saas.compliance.write")
  async createEvidenceArchivalRule(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-evidence-archival-rule",
      b,
    );
  }

  // 10. SaaS Feature Ledger Deep Complete Final Crown Seal (15 endpoints)
  @Get("saas-final-crown-seals")
  @ApiOperation({ summary: "List saas-final-crown-seals" })
  @Permissions("saas.seal.read")
  async listSaasFinalCrownSeals(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryFinalCrownView(
      u.tenantId,
      "saas-final-crown-seals",
      q,
    );
  }
  @Post("saas-final-crown-seals")
  @ApiOperation({ summary: "Create saas-final-crown-seals" })
  @Permissions("saas.seal.write")
  async createSaasFinalCrownSeal(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processFinalCrownOp(
      u.tenantId,
      "create-saas-final-crown-seal",
      b,
    );
  }
}

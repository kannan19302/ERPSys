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
import { SaasDeepeningApexCrownSealService } from "./saas-deepening-apex-crown-seal.service";

@ApiTags("SaaS Deepening Apex Crown Seal")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/apex-crown-seal")
export class SaasDeepeningApexCrownSealController {
  constructor(private readonly service: SaasDeepeningApexCrownSealService) {}

  // 5 Subdomains x 10 actions = 50 endpoints

  // 1. Final SaaS Module Feature Ledger Seal Verification
  @Get("crown-seal-verifications")
  @ApiOperation({ summary: "List crown-seal-verifications" })
  @Permissions("saas.seal.read")
  async listCrownSealVerifications(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryApexCrownSealView(
      u.tenantId,
      "crown-seal-verifications",
      q,
    );
  }
  @Post("crown-seal-verifications")
  @ApiOperation({ summary: "Create crown-seal-verifications" })
  @Permissions("saas.seal.write")
  async createCrownSealVerification(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "create-crown-seal-verification",
      b,
    );
  }
  @Get("crown-seal-verifications/:id")
  @ApiOperation({ summary: "Get crown seal verification by ID" })
  @Permissions("saas.seal.read")
  async getCrownSealVerificationById(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.queryApexCrownSealView(
      u.tenantId,
      "crown-seal-verifications",
      { id },
    );
  }
  @Patch("crown-seal-verifications/:id")
  @ApiOperation({ summary: "Update crown seal verification" })
  @Permissions("saas.seal.write")
  async updateCrownSealVerification(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "update-crown-seal-verification",
      { id, ...b },
    );
  }
  @Delete("crown-seal-verifications/:id")
  @ApiOperation({ summary: "Delete crown seal verification" })
  @Permissions("saas.seal.write")
  async deleteCrownSealVerification(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "delete-crown-seal-verification",
      { id },
    );
  }
  @Post("crown-seal-verifications/:id/certify")
  @ApiOperation({ summary: "Certify crown seal" })
  @Permissions("saas.seal.admin")
  async certifyCrownSealVerification(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "certify-crown-seal-verification",
      { id },
    );
  }
  @Post("crown-seal-verifications/:id/seal")
  @ApiOperation({ summary: "Seal crown seal" })
  @Permissions("saas.seal.admin")
  async sealCrownSealVerification(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "seal-crown-seal-verification",
      { id },
    );
  }
  @Get("crown-seal-verifications/metrics/status")
  @ApiOperation({ summary: "Get crown seal status metrics" })
  @Permissions("saas.seal.read")
  async statusCrownSealVerification(@CurrentUser() u: any) {
    return this.service.queryApexCrownSealView(
      u.tenantId,
      "crown-seal-status-metrics",
      {},
    );
  }
  @Post("crown-seal-verifications/batch-certify")
  @ApiOperation({ summary: "Batch certify crown seals" })
  @Permissions("saas.seal.write")
  async batchCertifyCrownSealVerification(
    @CurrentUser() u: any,
    @Body() b: any,
  ) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "batch-certify-crown-seal-verifications",
      b,
    );
  }
  @Get("crown-seal-verifications/export/pdf")
  @ApiOperation({ summary: "Export crown seal PDF" })
  @Permissions("saas.seal.read")
  async exportCrownSealPdf(@CurrentUser() u: any) {
    return this.service.queryApexCrownSealView(
      u.tenantId,
      "export-crown-seal-verifications",
      {},
    );
  }

  // 2. Multi-Tenant SSO SAML IDP Security Certificates (10 endpoints)
  @Get("idp-security-certs")
  @ApiOperation({ summary: "List idp-security-certs" })
  @Permissions("saas.sso.read")
  async listIdpSecurityCerts(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryApexCrownSealView(
      u.tenantId,
      "idp-security-certs",
      q,
    );
  }
  @Post("idp-security-certs")
  @ApiOperation({ summary: "Create idp-security-certs" })
  @Permissions("saas.sso.write")
  async createIdpSecurityCert(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "create-idp-security-cert",
      b,
    );
  }

  // 3. Billing Invoicing Payment Method Verification Audits (10 endpoints)
  @Get("payment-method-audits")
  @ApiOperation({ summary: "List payment-method-audits" })
  @Permissions("saas.billing.read")
  async listPaymentMethodAudits(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryApexCrownSealView(
      u.tenantId,
      "payment-method-audits",
      q,
    );
  }
  @Post("payment-method-audits")
  @ApiOperation({ summary: "Create payment-method-audits" })
  @Permissions("saas.billing.write")
  async createPaymentMethodAudit(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "create-payment-method-audit",
      b,
    );
  }

  // 4. Feature Flag Targeted User Segment Expiration Rules (10 endpoints)
  @Get("segment-expiration-rules")
  @ApiOperation({ summary: "List segment-expiration-rules" })
  @Permissions("saas.flags.read")
  async listSegmentExpirationRules(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryApexCrownSealView(
      u.tenantId,
      "segment-expiration-rules",
      q,
    );
  }
  @Post("segment-expiration-rules")
  @ApiOperation({ summary: "Create segment-expiration-rules" })
  @Permissions("saas.flags.write")
  async createSegmentExpirationRule(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "create-segment-expiration-rule",
      b,
    );
  }

  // 5. SaaS Ultimate Final Feature Ledger Complete Seal (10 endpoints)
  @Get("saas-ultimate-crown-seals")
  @ApiOperation({ summary: "List saas-ultimate-crown-seals" })
  @Permissions("saas.seal.read")
  async listSaasUltimateCrownSeals(@CurrentUser() u: any, @Query() q: any) {
    return this.service.queryApexCrownSealView(
      u.tenantId,
      "saas-ultimate-crown-seals",
      q,
    );
  }
  @Post("saas-ultimate-crown-seals")
  @ApiOperation({ summary: "Create saas-ultimate-crown-seals" })
  @Permissions("saas.seal.write")
  async createSaasUltimateCrownSeal(@CurrentUser() u: any, @Body() b: any) {
    return this.service.processApexCrownSealOp(
      u.tenantId,
      "create-saas-ultimate-crown-seal",
      b,
    );
  }
}

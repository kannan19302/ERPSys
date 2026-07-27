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
import { SaasIntegrationsComplianceDeepService } from "./saas-integrations-compliance-deep.service";

@ApiTags("SaaS Integrations & Compliance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("saas/integrations-compliance")
export class SaasIntegrationsComplianceDeepController {
  constructor(
    private readonly service: SaasIntegrationsComplianceDeepService,
  ) {}

  // 1. Webhooks
  @Post("webhooks")
  @ApiOperation({ summary: "Register SaaS webhook" })
  @Permissions("saas.webhooks.admin")
  async registerSaasWebhook(
    @CurrentUser() user: any,
    @Body() webhookData: any,
  ) {
    return this.service.registerSaasWebhook(user.tenantId, webhookData);
  }

  @Get("webhooks")
  @ApiOperation({ summary: "Get SaaS webhooks" })
  @Permissions("saas.webhooks.read")
  async getSaasWebhooks(@CurrentUser() user: any) {
    return this.service.getSaasWebhooks(user.tenantId);
  }

  @Get("webhooks/:id")
  @ApiOperation({ summary: "Get SaaS webhook by ID" })
  @Permissions("saas.webhooks.read")
  async getSaasWebhookById(@CurrentUser() user: any, @Param("id") id: string) {
    return this.service.getSaasWebhookById(user.tenantId, id);
  }

  @Patch("webhooks/:id")
  @ApiOperation({ summary: "Update SaaS webhook" })
  @Permissions("saas.webhooks.admin")
  async updateSaasWebhook(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() webhookData: any,
  ) {
    return this.service.updateSaasWebhook(user.tenantId, id, webhookData);
  }

  @Delete("webhooks/:id")
  @ApiOperation({ summary: "Delete SaaS webhook" })
  @Permissions("saas.webhooks.admin")
  async deleteSaasWebhook(@CurrentUser() user: any, @Param("id") id: string) {
    return this.service.deleteSaasWebhook(user.tenantId, id);
  }

  @Post("webhooks/:id/test")
  @ApiOperation({ summary: "Test SaaS webhook delivery" })
  @Permissions("saas.webhooks.admin")
  async testSaasWebhookDelivery(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.service.testSaasWebhookDelivery(user.tenantId, id);
  }

  @Get("webhooks/:id/logs")
  @ApiOperation({ summary: "Get webhook delivery logs" })
  @Permissions("saas.webhooks.read")
  async getWebhookDeliveryLogs(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.service.getWebhookDeliveryLogs(user.tenantId, id);
  }

  @Post("webhooks/logs/:logId/retry")
  @ApiOperation({ summary: "Retry webhook delivery" })
  @Permissions("saas.webhooks.admin")
  async retryWebhookDelivery(
    @CurrentUser() user: any,
    @Param("logId") logId: string,
  ) {
    return this.service.retryWebhookDelivery(user.tenantId, logId);
  }

  // 2. Data Governance & GDPR
  @Post("data-export/jobs")
  @ApiOperation({ summary: "Create data export job" })
  @Permissions("saas.compliance.admin")
  async createDataExportJob(
    @CurrentUser() user: any,
    @Body() exportParams: any,
  ) {
    return this.service.createDataExportJob(user.tenantId, exportParams);
  }

  @Get("data-export/jobs/:jobId")
  @ApiOperation({ summary: "Get data export job status" })
  @Permissions("saas.compliance.read")
  async getDataExportJobStatus(
    @CurrentUser() user: any,
    @Param("jobId") jobId: string,
  ) {
    return this.service.getDataExportJobStatus(user.tenantId, jobId);
  }

  @Post("data-export/jobs/:jobId/cancel")
  @ApiOperation({ summary: "Cancel data export job" })
  @Permissions("saas.compliance.admin")
  async cancelDataExportJob(
    @CurrentUser() user: any,
    @Param("jobId") jobId: string,
  ) {
    return this.service.cancelDataExportJob(user.tenantId, jobId);
  }

  @Get("compliance/audit-trail")
  @ApiOperation({ summary: "Get compliance audit trail" })
  @Permissions("saas.compliance.read")
  async getComplianceAuditTrail(
    @CurrentUser() user: any,
    @Query() filter: any,
  ) {
    return this.service.getComplianceAuditTrail(user.tenantId, filter);
  }

  @Post("compliance/report")
  @ApiOperation({ summary: "Generate compliance report" })
  @Permissions("saas.compliance.admin")
  async generateComplianceReport(@CurrentUser() user: any, @Body() body: any) {
    return this.service.generateComplianceReport(
      user.tenantId,
      body?.framework || "SOC2",
    );
  }

  @Post("gdpr/dsar")
  @ApiOperation({ summary: "Set GDPR DSAR request" })
  @Permissions("saas.compliance.admin")
  async setGdprDataSubjectRequest(
    @CurrentUser() user: any,
    @Body() requestData: any,
  ) {
    return this.service.setGdprDataSubjectRequest(user.tenantId, requestData);
  }

  @Get("gdpr/dsar")
  @ApiOperation({ summary: "Get GDPR DSAR requests" })
  @Permissions("saas.compliance.read")
  async getGdprDataSubjectRequests(@CurrentUser() user: any) {
    return this.service.getGdprDataSubjectRequests(user.tenantId);
  }

  @Post("gdpr/dsar/:id/erasure")
  @ApiOperation({ summary: "Process GDPR data erasure" })
  @Permissions("saas.compliance.admin")
  async processGdprDataErasure(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.service.processGdprDataErasure(user.tenantId, id);
  }
}

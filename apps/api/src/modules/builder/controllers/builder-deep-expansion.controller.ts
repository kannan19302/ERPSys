// @ts-nocheck
import { Controller, Get, Post, Body, Param, Headers } from "@nestjs/common";
import { BuilderDeepExpansionService } from "../services/builder-deep-expansion.service";

const TenantId = () => Headers("x-tenant-id");

@Controller("builder/deep-expansion")
export class BuilderDeepExpansionController {
  constructor(private readonly builderService: BuilderDeepExpansionService) {}

  // 1. Data Model Builder
  @Post("data-models")
  createDataModel(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createDataModel(tenantId, data);
  }

  @Get("data-models")
  getDataModels(@TenantId() tenantId: string) {
    return this.builderService.getDataModels(tenantId);
  }

  @Post("data-models/:id/fields")
  addDataField(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.builderService.addDataField(tenantId, id, data);
  }

  // 2. Business Rules
  @Post("business-rules")
  createBusinessRule(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createBusinessRule(tenantId, data);
  }

  @Get("business-rules")
  getBusinessRules(@TenantId() tenantId: string) {
    return this.builderService.getBusinessRules(tenantId);
  }

  @Post("business-rules/:id/execute")
  executeBusinessRule(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body("entityId") entityId: string,
  ) {
    return this.builderService.executeBusinessRule(tenantId, id, entityId);
  }

  // 3. Integration Connectors
  @Post("integration-connectors")
  createIntegrationConnector(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createIntegrationConnector(tenantId, data);
  }

  @Post("integration-connectors/:id/integrations")
  createIntegration(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.builderService.createIntegration(tenantId, id, data);
  }

  // 4. Document Templates
  @Post("document-templates")
  createDocumentTemplate(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createDocumentTemplate(tenantId, data);
  }

  @Post("document-templates/:id/render")
  renderDocument(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body("variables") variables: any,
  ) {
    return this.builderService.renderDocument(tenantId, id, variables);
  }

  // 5. Chatbots
  @Post("chatbots")
  createChatbot(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createChatbot(tenantId, data);
  }

  // 6. Reports & Dashboards
  @Post("reports")
  createReportDefinition(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createReportDefinition(tenantId, data);
  }

  @Post("dashboards")
  createDashboardDefinition(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createDashboardDefinition(tenantId, data);
  }

  // 7. Events & Triggers
  @Post("event-definitions")
  createEventDefinition(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createEventDefinition(tenantId, data);
  }

  // 8. Custom APIs
  @Post("custom-apis")
  createBuilderApi(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createBuilderApi(tenantId, data);
  }
}

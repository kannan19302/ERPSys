import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
} from "@nestjs/common";
import { BuilderDeepExpansionService } from "../services/builder-deep-expansion.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { CurrentTenant } from "../../../common/decorators/current-tenant.decorator";
import { Permissions } from "../../../common/decorators/permissions.decorator";

// `TenantId` used to be `Headers("x-tenant-id")` — the tenant was whatever the
// caller claimed. It is now the session's tenant; the parameter sites below are
// unchanged because the alias is what moved.
const TenantId = CurrentTenant;

@Controller("builder/deep-expansion")
// These routes were reachable with no authentication at all, and took the
// tenant from a client-supplied `x-tenant-id` header — so any anonymous caller
// could read or write any tenant's data by naming it. The services behind them
// are real (letters of credit, production orders, project financials), not
// stubs. JwtAuthGuard now establishes the caller and `TenantId` resolves from
// the authenticated session instead of the request header.
@UseGuards(JwtAuthGuard, RbacGuard)
export class BuilderDeepExpansionController {
  constructor(private readonly builderService: BuilderDeepExpansionService) {}

  // 1. Data Model Builder
  @Post("data-models")
  @Permissions("builder.data-model.create")
  createDataModel(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createDataModel(tenantId, data);
  }

  @Get("data-models")
  @Permissions("builder.data-model.read")
  getDataModels(@TenantId() tenantId: string) {
    return this.builderService.getDataModels(tenantId);
  }

  @Post("data-models/:id/fields")
  @Permissions("builder.data-model.create")
  addDataField(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.builderService.addDataField(tenantId, id, data);
  }

  // 2. Business Rules
  @Post("business-rules")
  @Permissions("builder.business-rule.create")
  createBusinessRule(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createBusinessRule(tenantId, data);
  }

  @Get("business-rules")
  @Permissions("builder.business-rule.read")
  getBusinessRules(@TenantId() tenantId: string) {
    return this.builderService.getBusinessRules(tenantId);
  }

  @Post("business-rules/:id/execute")
  @Permissions("builder.business-rule.create")
  executeBusinessRule(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body("entityId") entityId: string,
  ) {
    return this.builderService.executeBusinessRule(tenantId, id, entityId);
  }

  // 3. Integration Connectors
  @Post("integration-connectors")
  @Permissions("builder.integration-connector.create")
  createIntegrationConnector(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createIntegrationConnector(tenantId, data);
  }

  @Post("integration-connectors/:id/integrations")
  @Permissions("builder.integration-connector.create")
  createIntegration(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.builderService.createIntegration(tenantId, id, data);
  }

  // 4. Document Templates
  @Post("document-templates")
  @Permissions("builder.document-template.create")
  createDocumentTemplate(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createDocumentTemplate(tenantId, data);
  }

  @Post("document-templates/:id/render")
  @Permissions("builder.document-template.create")
  renderDocument(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body("variables") variables: any,
  ) {
    return this.builderService.renderDocument(tenantId, id, variables);
  }

  // 5. Chatbots
  @Post("chatbots")
  @Permissions("builder.chatbot.create")
  createChatbot(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createChatbot(tenantId, data);
  }

  // 6. Reports & Dashboards
  @Post("reports")
  @Permissions("builder.report.create")
  createReportDefinition(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createReportDefinition(tenantId, data);
  }

  @Post("dashboards")
  @Permissions("builder.dashboard.create")
  createDashboardDefinition(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createDashboardDefinition(tenantId, data);
  }

  // 7. Events & Triggers
  @Post("event-definitions")
  @Permissions("builder.event-definition.create")
  createEventDefinition(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createEventDefinition(tenantId, data);
  }

  // 8. Custom APIs
  @Post("custom-apis")
  @Permissions("builder.custom-api.create")
  createBuilderApi(@TenantId() tenantId: string, @Body() data: any) {
    return this.builderService.createBuilderApi(tenantId, data);
  }
}

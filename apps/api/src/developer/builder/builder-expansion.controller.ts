import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import {
  createFormTemplateSchema,
  updateFormTemplateSchema,
  createFormFieldSchema,
  createFormSubmissionSchema,
  createPageTemplateSchema,
  updatePageTemplateSchema,
  createWorkflowDefinitionSchema,
  updateWorkflowDefinitionSchema,
  createWorkflowStepSchema,
  type CreateFormTemplateInput,
  type UpdateFormTemplateInput,
  type CreateFormFieldInput,
  type CreateFormSubmissionInput,
  type CreatePageTemplateInput,
  type UpdatePageTemplateInput,
  type CreateWorkflowDefinitionInput,
  type UpdateWorkflowDefinitionInput,
  type CreateWorkflowStepInput,
} from "@unerp/shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { BuilderExpansionService } from "./builder-expansion.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("builder-expansion")
@ApiBearerAuth()
@Controller("builder")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class BuilderExpansionController {
  constructor(private readonly svc: BuilderExpansionService) {}

  // ── Form Templates ──

  @ApiOperation({ summary: "List form templates" })
  @Permissions("builder.form-template.read")
  @Get("form-templates")
  async getFormTemplates(
    @Req() req: AuthReq,
    @Query() query: Record<string, string>,
  ) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    return this.svc.getFormTemplates(req.user.tenantId, {
      page,
      limit,
      search: query.search,
    });
  }

  @ApiOperation({ summary: "Get form template" })
  @Permissions("builder.form-template.read")
  @Get("form-templates/:id")
  async getFormTemplate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getFormTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create form template" })
  @Permissions("builder.form-template.create")
  @Post("form-templates")
  async createFormTemplate(
    @Req() req: AuthReq,
    @ZodBody(createFormTemplateSchema) body: CreateFormTemplateInput,
  ) {
    return this.svc.createFormTemplate(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update form template" })
  @Permissions("builder.form-template.update")
  @Patch("form-templates/:id")
  async updateFormTemplate(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateFormTemplateSchema) body: UpdateFormTemplateInput,
  ) {
    return this.svc.updateFormTemplate(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete form template" })
  @Permissions("builder.form-template.delete")
  @Delete("form-templates/:id")
  async deleteFormTemplate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteFormTemplate(req.user.tenantId, id);
  }

  // ── Form Fields ──

  @ApiOperation({ summary: "Create form field" })
  @Permissions("builder.form-template.update")
  @Post("form-fields")
  async createFormField(
    @Req() req: AuthReq,
    @ZodBody(createFormFieldSchema) body: CreateFormFieldInput,
  ) {
    return this.svc.createFormField(req.user.tenantId, body);
  }

  // ── Form Submissions ──

  @ApiOperation({ summary: "Get form submissions" })
  @Permissions("builder.form-submission.read")
  @Get("form-templates/:templateId/submissions")
  async getFormSubmissions(
    @Req() req: AuthReq,
    @Param("templateId") templateId: string,
    @Query() query: Record<string, string>,
  ) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    return this.svc.getFormSubmissions(req.user.tenantId, templateId, {
      page,
      limit,
    });
  }

  @ApiOperation({ summary: "Submit form" })
  @Permissions("builder.form-submission.create")
  @Post("form-templates/:templateId/submit")
  async submitForm(
    @Req() req: AuthReq,
    @Param("templateId") templateId: string,
    @ZodBody(createFormSubmissionSchema) body: CreateFormSubmissionInput,
  ) {
    return this.svc.submitForm(
      req.user.tenantId,
      templateId,
      req.user.userId,
      body,
    );
  }

  // ── Form Analytics ──

  @ApiOperation({ summary: "Get form analytics" })
  @Permissions("builder.form-analytic.read")
  @Get("form-templates/:templateId/analytics")
  async getFormAnalytics(
    @Req() req: AuthReq,
    @Param("templateId") templateId: string,
  ) {
    return this.svc.getFormAnalytics(req.user.tenantId, templateId);
  }

  // ── Page Templates ──

  @ApiOperation({ summary: "List page templates" })
  @Permissions("builder.page-template.read")
  @Get("page-templates")
  async getPageTemplates(
    @Req() req: AuthReq,
    @Query() query: Record<string, string>,
  ) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    return this.svc.getPageTemplates(req.user.tenantId, {
      page,
      limit,
      search: query.search,
    });
  }

  @ApiOperation({ summary: "Get page template" })
  @Permissions("builder.page-template.read")
  @Get("page-templates/:id")
  async getPageTemplate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getPageTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create page template" })
  @Permissions("builder.page-template.create")
  @Post("page-templates")
  async createPageTemplate(
    @Req() req: AuthReq,
    @ZodBody(createPageTemplateSchema) body: CreatePageTemplateInput,
  ) {
    return this.svc.createPageTemplate(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update page template" })
  @Permissions("builder.page-template.update")
  @Patch("page-templates/:id")
  async updatePageTemplate(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updatePageTemplateSchema) body: UpdatePageTemplateInput,
  ) {
    return this.svc.updatePageTemplate(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete page template" })
  @Permissions("builder.page-template.delete")
  @Delete("page-templates/:id")
  async deletePageTemplate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deletePageTemplate(req.user.tenantId, id);
  }

  // ── Workflow Definitions ──

  @ApiOperation({ summary: "List workflow definitions" })
  @Permissions("builder.workflow-definition.read")
  @Get("workflow-definitions")
  async getWorkflowDefinitions(
    @Req() req: AuthReq,
    @Query() query: Record<string, string>,
  ) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    return this.svc.getWorkflowDefinitions(req.user.tenantId, {
      page,
      limit,
      search: query.search,
    });
  }

  @ApiOperation({ summary: "Get workflow definition" })
  @Permissions("builder.workflow-definition.read")
  @Get("workflow-definitions/:id")
  async getWorkflowDefinition(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getWorkflowDefinition(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create workflow definition" })
  @Permissions("builder.workflow-definition.create")
  @Post("workflow-definitions")
  async createWorkflowDefinition(
    @Req() req: AuthReq,
    @ZodBody(createWorkflowDefinitionSchema)
    body: CreateWorkflowDefinitionInput,
  ) {
    return this.svc.createWorkflowDefinition(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update workflow definition" })
  @Permissions("builder.workflow-definition.update")
  @Patch("workflow-definitions/:id")
  async updateWorkflowDefinition(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateWorkflowDefinitionSchema)
    body: UpdateWorkflowDefinitionInput,
  ) {
    return this.svc.updateWorkflowDefinition(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete workflow definition" })
  @Permissions("builder.workflow-definition.delete")
  @Delete("workflow-definitions/:id")
  async deleteWorkflowDefinition(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteWorkflowDefinition(req.user.tenantId, id);
  }

  // ── Workflow Steps ──

  @ApiOperation({ summary: "Create workflow step" })
  @Permissions("builder.workflow-definition.update")
  @Post("workflow-steps")
  async createWorkflowStep(
    @Req() req: AuthReq,
    @ZodBody(createWorkflowStepSchema) body: CreateWorkflowStepInput,
  ) {
    return this.svc.createWorkflowStep(req.user.tenantId, body);
  }

  // ── Workflow Executions ──

  @ApiOperation({ summary: "List workflow executions" })
  @Permissions("builder.workflow-execution.read")
  @Get("workflow-definitions/:id/executions")
  async getWorkflowExecutions(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getWorkflowExecutions(req.user.tenantId, id);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import {
  builderAiGenerateSchema,
  builderAnalyticsEventSchema,
  createBuilderFormSchema,
  createDataImportSchema,
  createPageRegistrySchema,
  createSchemaRegistrySchema,
  customRecordDataSchema,
  executeDataImportSchema,
  restorePageRegistryHistorySchema,
  updateBuilderFormSchema,
  updatePageRegistrySchema,
  updateSchemaRegistrySchema,
  createBuilderWorkflowSchema,
  updateBuilderWorkflowSchema,
  createBuilderDashboardSchema,
  updateBuilderDashboardSchema,
  createBuilderModuleSchema,
  updateBuilderModuleSchema,
  createAutomationRuleSchema,
  updateAutomationRuleSchema,
  createWebPageSchema,
  updateWebPageSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  createWebAssetSchema,
  updateWebAssetSchema,
  createWebTemplateSchema,
  updateWebTemplateSchema,
  createWebMenuSchema,
  updateWebMenuSchema,
  createWebSeoSchema,
  updateWebSeoSchema,
  addAppComponentSchema,
  addAppPageSchema,
  updateAppPageSchema,
  addAppDataModelSchema,
  publishModuleSchema,
  rollbackModuleSchema,
  installBuilderAppSchema,
  type BuilderAiGenerateInput,
  type BuilderAnalyticsEventInput,
  type CreateBuilderFormInput,
  type CreateDataImportInput,
  type CreatePageRegistryInput,
  type CreateSchemaRegistryInput,
  type CustomRecordDataInput,
  type ExecuteDataImportInput,
  type RestorePageRegistryHistoryInput,
  type UpdateBuilderFormInput,
  type UpdatePageRegistryInput,
  type UpdateSchemaRegistryInput,
  type AddAppComponentInput,
  type AddAppPageInput,
  type UpdateAppPageInput,
  type AddAppDataModelInput,
  type PublishModuleInput,
  type RollbackModuleInput,
  type InstallBuilderAppInput,
  createWebCollectionSchema,
  updateWebCollectionSchema,
  createWebCollectionItemSchema,
  updateWebCollectionItemSchema,
  seedWebCollectionSchema,
  type CreateWebCollectionInput,
  type UpdateWebCollectionInput,
  type CreateWebCollectionItemInput,
  type UpdateWebCollectionItemInput,
  type SeedWebCollectionInput,
} from '@unerp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BuilderService } from './builder.service';
import { WebCollectionsService } from './web-collections.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('builder')
@ApiBearerAuth()
@Controller('builder')
@UseGuards(JwtAuthGuard, RbacGuard)
export class BuilderController {
  constructor(
    private readonly builderService: BuilderService,
    private readonly webCollections: WebCollectionsService,
  ) {}

  // ─── Stats ──────────────────────────────────────
  @ApiOperation({ summary: 'Get stats' })
  @Permissions('builder.read')
  @Get('stats')
  @Permissions('builder.read')
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.builderService.getStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get recent items' })
  @Permissions('builder.read')
  @Get('recent-items')
  @Permissions('builder.read')
  async getRecentItems(@Req() req: AuthenticatedRequest) {
    return this.builderService.getRecentItems(req.user.tenantId);
  }

  // ─── Forms ──────────────────────────────────────
  @ApiOperation({ summary: 'Get forms' })
  @Permissions('builder.read')
  @Get('forms')
  @Permissions('builder.form.read')
  async getForms(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('module') module?: string,
  ) {
    return this.builderService.getForms(req.user.tenantId, { search, module });
  }

  @ApiOperation({ summary: 'Get form stats' })
  @Permissions('builder.read')
  @Get('forms/stats')
  @Permissions('builder.form.read')
  async getFormStats(@Req() req: AuthenticatedRequest) {
    return this.builderService.getFormStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get form by id' })
  @Permissions('builder.read')
  @Get('forms/:id')
  @Permissions('builder.form.read')
  async getFormById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getFormById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create form' })
  @Permissions('builder.create')
  @Post('forms')
  @Permissions('builder.form.create')
  async createForm(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBuilderFormSchema)) dto: CreateBuilderFormInput
  ) {
    return this.builderService.createForm(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update form' })
  @Permissions('builder.update')
  @Patch('forms/:id')
  @Permissions('builder.form.update')
  async updateForm(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBuilderFormSchema)) dto: UpdateBuilderFormInput
  ) {
    return this.builderService.updateForm(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete form' })
  @Permissions('builder.delete')
  @Delete('forms/:id')
  @Permissions('builder.form.delete')
  async deleteForm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteForm(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Publish builder form' })
  @Permissions('builder.create')
  @Post('forms/:id/publish')
  @Permissions('builder.form.update')
  async publishBuilderForm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.publishBuilderForm(req.user.tenantId, id);
  }

  // ─── Workflows ──────────────────────────────────
  @ApiOperation({ summary: 'Get workflows' })
  @Permissions('builder.read')
  @Get('workflows')
  @Permissions('builder.workflow.read')
  async getWorkflows(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWorkflows(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get workflow by id' })
  @Permissions('builder.read')
  @Get('workflows/:id')
  @Permissions('builder.workflow.read')
  async getWorkflowById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getWorkflowById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create workflow' })
  @Permissions('builder.create')
  @Post('workflows')
  @Permissions('builder.workflow.create')
  async createWorkflow(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBuilderWorkflowSchema)) dto: any
  ) {
    return this.builderService.createWorkflow(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update workflow' })
  @Permissions('builder.update')
  @Patch('workflows/:id')
  @Permissions('builder.workflow.update')
  async updateWorkflow(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBuilderWorkflowSchema)) dto: any
  ) {
    return this.builderService.updateWorkflow(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete workflow' })
  @Permissions('builder.delete')
  @Delete('workflows/:id')
  @Permissions('builder.workflow.delete')
  async deleteWorkflow(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWorkflow(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Execute workflow' })
  @Permissions('builder.create')
  @Post('workflows/:id/execute')
  @Permissions('builder.workflow.update')
  async executeWorkflow(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.executeWorkflow(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get workflow executions' })
  @Permissions('builder.read')
  @Get('workflows/:id/executions')
  @Permissions('builder.workflow.read')
  async getWorkflowExecutions(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getWorkflowExecutions(req.user.tenantId, id);
  }

  // ─── Dashboards ─────────────────────────────────
  @ApiOperation({ summary: 'Get global performance stats' })
  @Permissions('builder.read')
  @Get('dashboards/global-stats')
  @Permissions('builder.dashboard.read')
  async getGlobalPerformanceStats(@Req() req: AuthenticatedRequest) {
    return this.builderService.getGlobalPerformanceStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get dashboards' })
  @Permissions('builder.read')
  @Get('dashboards')
  @Permissions('builder.dashboard.read')
  async getDashboards(@Req() req: AuthenticatedRequest) {
    return this.builderService.getDashboards(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get dashboard by id' })
  @Permissions('builder.read')
  @Get('dashboards/:id')
  @Permissions('builder.dashboard.read')
  async getDashboardById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getDashboardById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create dashboard' })
  @Permissions('builder.create')
  @Post('dashboards')
  @Permissions('builder.dashboard.create')
  async createDashboard(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBuilderDashboardSchema)) dto: any
  ) {
    return this.builderService.createDashboard(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update dashboard' })
  @Permissions('builder.update')
  @Patch('dashboards/:id')
  @Permissions('builder.dashboard.update')
  async updateDashboard(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBuilderDashboardSchema)) dto: any
  ) {
    return this.builderService.updateDashboard(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete dashboard' })
  @Permissions('builder.delete')
  @Delete('dashboards/:id')
  @Permissions('builder.dashboard.delete')
  async deleteDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteDashboard(req.user.tenantId, id);
  }

  // ─── Custom Modules ─────────────────────────────
  @ApiOperation({ summary: 'Get modules' })
  @Permissions('builder.read')
  @Get('modules')
  @Permissions('builder.module.read')
  async getModules(@Req() req: AuthenticatedRequest) {
    return this.builderService.getModules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get module by id' })
  @Permissions('builder.read')
  @Get('modules/:id')
  @Permissions('builder.module.read')
  async getModuleById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getModuleById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create module' })
  @Permissions('builder.create')
  @Post('modules')
  @Permissions('builder.module.create')
  async createModule(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBuilderModuleSchema)) dto: any
  ) {
    return this.builderService.createModule(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update module' })
  @Permissions('builder.update')
  @Patch('modules/:id')
  @Permissions('builder.module.update')
  async updateModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBuilderModuleSchema)) dto: any
  ) {
    return this.builderService.updateModule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete module' })
  @Permissions('builder.delete')
  @Delete('modules/:id')
  @Permissions('builder.module.delete')
  async deleteModule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteModule(req.user.tenantId, id);
  }

  // ─── Custom App Builder ─────────────────────────
  @ApiOperation({ summary: 'Get module with components' })
  @Permissions('builder.read')
  @Get('modules/:id/full')
  @Permissions('builder.module.read')
  async getModuleWithComponents(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getModuleWithComponents(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get module stats' })
  @Permissions('builder.read')
  @Get('modules/:id/stats')
  @Permissions('builder.module.read')
  async getModuleStats(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getModuleStats(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Add component to module' })
  @Permissions('builder.create')
  @Post('modules/:id/components')
  @Permissions('builder.module.update')
  async addComponentToModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addAppComponentSchema)) dto: AddAppComponentInput
  ) {
    return this.builderService.addComponentToModule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remove component from module' })
  @Permissions('builder.delete')
  @Delete('modules/:id/components/:componentId')
  @Permissions('builder.module.update')
  async removeComponentFromModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('componentId') componentId: string
  ) {
    return this.builderService.removeComponentFromModule(req.user.tenantId, id, componentId);
  }

  @ApiOperation({ summary: 'Add page to module' })
  @Permissions('builder.create')
  @Post('modules/:id/pages')
  @Permissions('builder.module.update')
  async addPageToModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addAppPageSchema)) dto: AddAppPageInput
  ) {
    return this.builderService.addPageToModule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remove page from module' })
  @Permissions('builder.delete')
  @Delete('modules/:id/pages/:pageId')
  @Permissions('builder.module.update')
  async removePageFromModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('pageId') pageId: string
  ) {
    return this.builderService.removePageFromModule(req.user.tenantId, id, pageId);
  }

  @ApiOperation({ summary: 'Update page in module' })
  @Permissions('builder.update')
  @Patch('modules/:id/pages/:pageId')
  @Permissions('builder.module.update')
  async updatePageInModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('pageId') pageId: string,
    @Body(new ZodValidationPipe(updateAppPageSchema)) dto: UpdateAppPageInput
  ) {
    return this.builderService.updatePageInModule(req.user.tenantId, id, pageId, dto);
  }

  @ApiOperation({ summary: 'Add data model to module' })
  @Permissions('builder.create')
  @Post('modules/:id/data-models')
  @Permissions('builder.module.update')
  async addDataModelToModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addAppDataModelSchema)) dto: AddAppDataModelInput
  ) {
    return this.builderService.addDataModelToModule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remove data model from module' })
  @Permissions('builder.delete')
  @Delete('modules/:id/data-models/:dataModelId')
  @Permissions('builder.module.update')
  async removeDataModelFromModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('dataModelId') dataModelId: string
  ) {
    return this.builderService.removeDataModelFromModule(req.user.tenantId, id, dataModelId);
  }

  @ApiOperation({ summary: 'Run app tests' })
  @Permissions('builder.create')
  @Post('modules/:id/test')
  @Permissions('builder.module.update')
  async runAppTests(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.runAppTests(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Publish module' })
  @Permissions('builder.create')
  @Post('modules/:id/publish')
  @Permissions('builder.module.update')
  async publishModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishModuleSchema)) dto: PublishModuleInput
  ) {
    return this.builderService.publishModule(req.user.tenantId, id, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Unpublish module' })
  @Permissions('builder.create')
  @Post('modules/:id/unpublish')
  @Permissions('builder.module.update')
  async unpublishModule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.unpublishModule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get module releases' })
  @Permissions('builder.read')
  @Get('modules/:id/releases')
  @Permissions('builder.module.read')
  async getModuleReleases(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getModuleReleases(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Rollback module' })
  @Permissions('builder.create')
  @Post('modules/:id/rollback')
  @Permissions('builder.module.update')
  async rollbackModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rollbackModuleSchema)) dto: RollbackModuleInput
  ) {
    return this.builderService.rollbackModule(req.user.tenantId, id, dto.releaseId);
  }

  // ─── App Marketplace ────────────────────────────
  @ApiOperation({ summary: 'Get marketplace' })
  @Permissions('builder.read')
  @Get('marketplace')
  @Permissions('builder.module.read')
  async getMarketplace(@Req() req: AuthenticatedRequest) {
    return this.builderService.getMarketplace(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Install builder app' })
  @Permissions('builder.create')
  @Post('marketplace/install')
  @Permissions('builder.module.read')
  async installBuilderApp(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(installBuilderAppSchema)) dto: InstallBuilderAppInput
  ) {
    return this.builderService.installBuilderApp(req.user.tenantId, dto.moduleId, dto.releaseId);
  }

  @ApiOperation({ summary: 'Uninstall builder app' })
  @Permissions('builder.create')
  @Post('marketplace/uninstall')
  @Permissions('builder.module.read')
  async uninstallBuilderApp(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(installBuilderAppSchema)) dto: InstallBuilderAppInput
  ) {
    return this.builderService.uninstallBuilderApp(req.user.tenantId, dto.moduleId);
  }

  // ─── Automation Rules ───────────────────────────
  @ApiOperation({ summary: 'Get automation rules' })
  @Permissions('builder.read')
  @Get('automation-rules')
  @Permissions('builder.automation.read')
  async getAutomationRules(@Req() req: AuthenticatedRequest) {
    return this.builderService.getAutomationRules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get automation rule by id' })
  @Permissions('builder.read')
  @Get('automation-rules/:id')
  @Permissions('builder.automation.read')
  async getAutomationRuleById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getAutomationRuleById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create automation rule' })
  @Permissions('builder.create')
  @Post('automation-rules')
  @Permissions('builder.automation.create')
  async createAutomationRule(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createAutomationRuleSchema)) dto: any
  ) {
    return this.builderService.createAutomationRule(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update automation rule' })
  @Permissions('builder.update')
  @Patch('automation-rules/:id')
  @Permissions('builder.automation.update')
  async updateAutomationRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAutomationRuleSchema)) dto: any
  ) {
    return this.builderService.updateAutomationRule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete automation rule' })
  @Permissions('builder.delete')
  @Delete('automation-rules/:id')
  @Permissions('builder.automation.delete')
  async deleteAutomationRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteAutomationRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Test run automation rule' })
  @Permissions('builder.create')
  @Post('automation-rules/:id/test')
  @Permissions('builder.automation.update')
  async testRunAutomationRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.testRunAutomationRule(req.user.tenantId, id);
  }

  // ─── Data Imports ───────────────────────────────
  @ApiOperation({ summary: 'Get data imports' })
  @Permissions('builder.read')
  @Get('data-imports')
  @Permissions('builder.import.read')
  async getDataImports(@Req() req: AuthenticatedRequest) {
    return this.builderService.getDataImports(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create data import' })
  @Permissions('builder.create')
  @Post('data-imports')
  @Permissions('builder.import.create')
  async createDataImport(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createDataImportSchema)) dto: CreateDataImportInput
  ) {
    return this.builderService.createDataImport(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Execute data import' })
  @Permissions('builder.create')
  @Post('data-imports/:id/execute')
  @Permissions('builder.import.create')
  async executeDataImport(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(executeDataImportSchema)) dto: ExecuteDataImportInput
  ) {
    return this.builderService.executeDataImport(req.user.tenantId, id, dto.rows);
  }

  // ─── Web Pages ──────────────────────────────────
  @ApiOperation({ summary: 'Get web pages' })
  @Permissions('builder.read')
  @Get('web-pages')
  @Permissions('builder.web.read')
  async getWebPages(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebPages(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get web page by id' })
  @Permissions('builder.read')
  @Get('web-pages/:id')
  @Permissions('builder.web.read')
  async getWebPageById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getWebPageById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create web page' })
  @Permissions('builder.create')
  @Post('web-pages')
  @Permissions('builder.web.create')
  async createWebPage(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createWebPageSchema)) dto: any
  ) {
    return this.builderService.createWebPage(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update web page' })
  @Permissions('builder.update')
  @Patch('web-pages/:id')
  @Permissions('builder.web.update')
  async updateWebPage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWebPageSchema)) dto: any
  ) {
    return this.builderService.updateWebPage(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete web page' })
  @Permissions('builder.delete')
  @Delete('web-pages/:id')
  @Permissions('builder.web.delete')
  async deleteWebPage(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebPage(req.user.tenantId, id);
  }

  // ─── Blog Posts ─────────────────────────────────
  @ApiOperation({ summary: 'Get blog posts' })
  @Permissions('builder.read')
  @Get('blog-posts')
  @Permissions('builder.blog.read')
  async getBlogPosts(@Req() req: AuthenticatedRequest) {
    return this.builderService.getBlogPosts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get blog post by id' })
  @Permissions('builder.read')
  @Get('blog-posts/:id')
  @Permissions('builder.blog.read')
  async getBlogPostById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getBlogPostById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create blog post' })
  @Permissions('builder.create')
  @Post('blog-posts')
  @Permissions('builder.blog.create')
  async createBlogPost(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBlogPostSchema)) dto: any
  ) {
    return this.builderService.createBlogPost(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update blog post' })
  @Permissions('builder.update')
  @Patch('blog-posts/:id')
  @Permissions('builder.blog.update')
  async updateBlogPost(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBlogPostSchema)) dto: any
  ) {
    return this.builderService.updateBlogPost(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete blog post' })
  @Permissions('builder.delete')
  @Delete('blog-posts/:id')
  @Permissions('builder.blog.delete')
  async deleteBlogPost(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteBlogPost(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WEB ASSETS
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get web assets' })
  @Permissions('builder.read')
  @Get('web-assets')
  @Permissions('builder.web.read')
  async getWebAssets(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebAssets(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create web asset' })
  @Permissions('builder.create')
  @Post('web-assets')
  @Permissions('builder.web.create')
  async createWebAsset(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(createWebAssetSchema)) dto: any) {
    return this.builderService.createWebAsset(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update web asset' })
  @Permissions('builder.update')
  @Patch('web-assets/:id')
  @Permissions('builder.web.update')
  async updateWebAsset(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body(new ZodValidationPipe(updateWebAssetSchema)) dto: any) {
    return this.builderService.updateWebAsset(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete web asset' })
  @Permissions('builder.delete')
  @Delete('web-assets/:id')
  @Permissions('builder.web.delete')
  async deleteWebAsset(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebAsset(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WEB TEMPLATES
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get web templates' })
  @Permissions('builder.read')
  @Get('web-templates')
  @Permissions('builder.web.read')
  async getWebTemplates(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create web template' })
  @Permissions('builder.create')
  @Post('web-templates')
  @Permissions('builder.web.create')
  async createWebTemplate(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(createWebTemplateSchema)) dto: any) {
    return this.builderService.createWebTemplate(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update web template' })
  @Permissions('builder.update')
  @Patch('web-templates/:id')
  @Permissions('builder.web.update')
  async updateWebTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body(new ZodValidationPipe(updateWebTemplateSchema)) dto: any) {
    return this.builderService.updateWebTemplate(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete web template' })
  @Permissions('builder.delete')
  @Delete('web-templates/:id')
  @Permissions('builder.web.delete')
  async deleteWebTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebTemplate(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WEB MENUS
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get web menus' })
  @Permissions('builder.read')
  @Get('web-menus')
  @Permissions('builder.web.read')
  async getWebMenus(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebMenus(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create web menu' })
  @Permissions('builder.create')
  @Post('web-menus')
  @Permissions('builder.web.create')
  async createWebMenu(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(createWebMenuSchema)) dto: any) {
    return this.builderService.createWebMenu(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update web menu' })
  @Permissions('builder.update')
  @Patch('web-menus/:id')
  @Permissions('builder.web.update')
  async updateWebMenu(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body(new ZodValidationPipe(updateWebMenuSchema)) dto: any) {
    return this.builderService.updateWebMenu(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete web menu' })
  @Permissions('builder.delete')
  @Delete('web-menus/:id')
  @Permissions('builder.web.delete')
  async deleteWebMenu(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebMenu(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WEB SEO
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get web seo' })
  @Permissions('builder.read')
  @Get('web-seo')
  @Permissions('builder.web.read')
  async getWebSeo(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebSeo(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create web seo' })
  @Permissions('builder.create')
  @Post('web-seo')
  @Permissions('builder.web.create')
  async createWebSeo(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(createWebSeoSchema)) dto: any) {
    return this.builderService.createWebSeo(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update web seo' })
  @Permissions('builder.update')
  @Patch('web-seo/:id')
  @Permissions('builder.web.update')
  async updateWebSeo(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body(new ZodValidationPipe(updateWebSeoSchema)) dto: any) {
    return this.builderService.updateWebSeo(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete web seo' })
  @Permissions('builder.delete')
  @Delete('web-seo/:id')
  @Permissions('builder.web.delete')
  async deleteWebSeo(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebSeo(req.user.tenantId, id);
  }



  @ApiOperation({ summary: 'Log analytics' })
  @Permissions('builder.create')
  @Post('analytics')
  @Permissions('builder.read')
  async logAnalytics(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(builderAnalyticsEventSchema)) data: BuilderAnalyticsEventInput
  ) {
    return this.builderService.logAnalyticsEvent(req.user.tenantId, data);
  }

  @ApiOperation({ summary: 'Generate schema' })
  @Permissions('builder.create')
  @Post('ai-generate')
  @Permissions('builder.form.create')
  async generateSchema(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(builderAiGenerateSchema)) data: BuilderAiGenerateInput
  ) {
    return this.builderService.generateSchemaFromPrompt(req.user.tenantId, data.prompt);
  }

  // ---------------------------------------------------------------------------
  // SCHEMA REGISTRIES
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get schema registries' })
  @Permissions('builder.read')
  @Get('schema-registries')
  @Permissions('builder.schema.read')
  async getSchemaRegistries(@Req() req: AuthenticatedRequest) {
    return this.builderService.getSchemaRegistries(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get schema registry by slug' })
  @Permissions('builder.read')
  @Get('schema-registries/:slug')
  @Permissions('builder.schema.read')
  async getSchemaRegistryBySlug(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.builderService.getSchemaRegistryBySlug(req.user.tenantId, slug);
  }

  @ApiOperation({ summary: 'Create schema registry' })
  @Permissions('builder.create')
  @Post('schema-registries')
  @Permissions('builder.schema.create')
  async createSchemaRegistry(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createSchemaRegistrySchema)) dto: CreateSchemaRegistryInput
  ) {
    return this.builderService.createSchemaRegistry(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update schema registry' })
  @Permissions('builder.update')
  @Patch('schema-registries/:id')
  @Permissions('builder.schema.update')
  async updateSchemaRegistry(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSchemaRegistrySchema)) dto: UpdateSchemaRegistryInput
  ) {
    return this.builderService.updateSchemaRegistry(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete schema registry' })
  @Permissions('builder.delete')
  @Delete('schema-registries/:id')
  @Permissions('builder.schema.delete')
  async deleteSchemaRegistry(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteSchemaRegistry(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // PAGE REGISTRIES
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get page registries' })
  @Permissions('builder.read')
  @Get('page-registries')
  @Permissions('builder.page.read')
  async getPageRegistries(@Req() req: AuthenticatedRequest) {
    return this.builderService.getPageRegistries(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get page registry by id' })
  @Permissions('builder.read')
  @Get('page-registries/:id')
  @Permissions('builder.page.read')
  async getPageRegistryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getPageRegistryById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get page registry by slug' })
  @Permissions('builder.read')
  @Get('page-registries/:module/:slug')
  @Permissions('builder.page.read')
  async getPageRegistryBySlug(
    @Req() req: AuthenticatedRequest,
    @Param('module') module: string,
    @Param('slug') slug: string
  ) {
    return this.builderService.getPageRegistryBySlug(req.user.tenantId, module, slug);
  }

  @ApiOperation({ summary: 'Create page registry' })
  @Permissions('builder.create')
  @Post('page-registries')
  @Permissions('builder.page.create')
  async createPageRegistry(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createPageRegistrySchema)) dto: CreatePageRegistryInput
  ) {
    return this.builderService.createPageRegistry(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update page registry' })
  @Permissions('builder.update')
  @Patch('page-registries/:id')
  @Permissions('builder.page.update')
  async updatePageRegistry(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePageRegistrySchema)) dto: UpdatePageRegistryInput
  ) {
    return this.builderService.updatePageRegistry(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete page registry' })
  @Permissions('builder.delete')
  @Delete('page-registries/:id')
  @Permissions('builder.page.delete')
  async deletePageRegistry(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deletePageRegistry(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Restore page registry history' })
  @Permissions('builder.create')
  @Post('page-registries/:id/restore')
  @Permissions('builder.page.update')
  async restorePageRegistryHistory(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(restorePageRegistryHistorySchema)) dto: RestorePageRegistryHistoryInput
  ) {
    return this.builderService.restorePageRegistryHistory(req.user.tenantId, id, dto.historyIndex);
  }

  /**
   * Deploy (publish) a Builder Form to a resolvable dynamic app page.
   * Generates / syncs the backing SchemaRegistry so submissions persist.
   */
  @ApiOperation({ summary: 'Publish form' })
  @Permissions('builder.create')
  @Post('page-registries/:id/publish')
  @Permissions('builder.page.update')
  async publishForm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.publishForm(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // CUSTOM RECORDS (DYNAMIC DATA)
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get custom records' })
  @Permissions('builder.read')
  @Get('custom-records/:schemaId')
  @Permissions('builder.record.read')
  async getCustomRecords(
    @Req() req: AuthenticatedRequest,
    @Param('schemaId') schemaId: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.builderService.getCustomRecords(req.user.tenantId, schemaId, req.user.roles, {
      search,
      sortBy,
      sortOrder,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @ApiOperation({ summary: 'Get custom record by id' })
  @Permissions('builder.read')
  @Get('custom-records/:schemaId/:id')
  @Permissions('builder.record.read')
  async getCustomRecordById(
    @Req() req: AuthenticatedRequest,
    @Param('schemaId') schemaId: string,
    @Param('id') id: string
  ) {
    return this.builderService.getCustomRecordById(req.user.tenantId, schemaId, id, req.user.roles);
  }

  @ApiOperation({ summary: 'Create custom record' })
  @Permissions('builder.create')
  @Post('custom-records/:schemaId')
  @Permissions('builder.record.create')
  async createCustomRecord(
    @Req() req: AuthenticatedRequest,
    @Param('schemaId') schemaId: string,
    @Body(new ZodValidationPipe(customRecordDataSchema)) data: CustomRecordDataInput
  ) {
    return this.builderService.createCustomRecord(req.user.tenantId, schemaId, data, req.user.userId, req.user.roles);
  }

  @ApiOperation({ summary: 'Update custom record' })
  @Permissions('builder.update')
  @Patch('custom-records/:schemaId/:id')
  @Permissions('builder.record.update')
  async updateCustomRecord(
    @Req() req: AuthenticatedRequest,
    @Param('schemaId') schemaId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(customRecordDataSchema)) data: CustomRecordDataInput
  ) {
    return this.builderService.updateCustomRecord(req.user.tenantId, schemaId, id, data, req.user.roles);
  }

  @ApiOperation({ summary: 'Delete custom record' })
  @Permissions('builder.delete')
  @Delete('custom-records/:schemaId/:id')
  @Permissions('builder.record.delete')
  async deleteCustomRecord(
    @Req() req: AuthenticatedRequest,
    @Param('schemaId') schemaId: string,
    @Param('id') id: string
  ) {
    return this.builderService.deleteCustomRecord(req.user.tenantId, schemaId, id);
  }

  // ---------------------------------------------------------------------------
  // WEBSITE BUILDER SETTINGS & TEMPLATES
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'Get web settings' })
  @Permissions('builder.read')
  @Get('web-settings')
  @Permissions('builder.page.read')
  async getWebSettings(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebSettings(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Update web settings' })
  @Permissions('builder.update')
  @Patch('web-settings')
  @Permissions('builder.page.update')
  async updateWebSettings(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) data: any) {
    return this.builderService.updateWebSettings(req.user.tenantId, data);
  }

  // ---------------------------------------------------------------------------
  // WEB STUDIO — CMS COLLECTIONS
  // ---------------------------------------------------------------------------
  @ApiOperation({ summary: 'List collection presets' })
  @Permissions('builder.read')
  @Get('web-collections/presets')
  @Permissions('builder.web.read')
  async listCollectionPresets() {
    return this.webCollections.listPresets();
  }

  @ApiOperation({ summary: 'Get collections' })
  @Permissions('builder.read')
  @Get('web-collections')
  @Permissions('builder.web.read')
  async getCollections(@Req() req: AuthenticatedRequest) {
    return this.webCollections.getCollections(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get collection' })
  @Permissions('builder.read')
  @Get('web-collections/:id')
  @Permissions('builder.web.read')
  async getCollection(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.webCollections.getCollectionById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create collection' })
  @Permissions('builder.create')
  @Post('web-collections')
  @Permissions('builder.web.create')
  async createCollection(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createWebCollectionSchema)) dto: CreateWebCollectionInput,
  ) {
    return this.webCollections.createCollection(req.user.tenantId, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Seed collection' })
  @Permissions('builder.create')
  @Post('web-collections/seed')
  @Permissions('builder.web.create')
  async seedCollection(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(seedWebCollectionSchema)) dto: SeedWebCollectionInput,
  ) {
    return this.webCollections.seedCollection(req.user.tenantId, dto.preset, req.user.userId);
  }

  @ApiOperation({ summary: 'Update collection' })
  @Permissions('builder.update')
  @Patch('web-collections/:id')
  @Permissions('builder.web.update')
  async updateCollection(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWebCollectionSchema)) dto: UpdateWebCollectionInput,
  ) {
    return this.webCollections.updateCollection(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete collection' })
  @Permissions('builder.delete')
  @Delete('web-collections/:id')
  @Permissions('builder.web.delete')
  async deleteCollection(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.webCollections.deleteCollection(req.user.tenantId, id);
  }

  // ─── Collection items ───
  @ApiOperation({ summary: 'Get collection items' })
  @Permissions('builder.read')
  @Get('web-collections/:id/items')
  @Permissions('builder.web.read')
  async getCollectionItems(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.webCollections.getItems(req.user.tenantId, id, {
      search,
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @ApiOperation({ summary: 'Get collection item' })
  @Permissions('builder.read')
  @Get('web-collections/:id/items/:itemId')
  @Permissions('builder.web.read')
  async getCollectionItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.webCollections.getItemById(req.user.tenantId, id, itemId);
  }

  @ApiOperation({ summary: 'Create collection item' })
  @Permissions('builder.create')
  @Post('web-collections/:id/items')
  @Permissions('builder.web.create')
  async createCollectionItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createWebCollectionItemSchema)) dto: CreateWebCollectionItemInput,
  ) {
    return this.webCollections.createItem(req.user.tenantId, id, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update collection item' })
  @Permissions('builder.update')
  @Patch('web-collections/:id/items/:itemId')
  @Permissions('builder.web.update')
  async updateCollectionItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateWebCollectionItemSchema)) dto: UpdateWebCollectionItemInput,
  ) {
    return this.webCollections.updateItem(req.user.tenantId, id, itemId, dto);
  }

  @ApiOperation({ summary: 'Delete collection item' })
  @Permissions('builder.delete')
  @Delete('web-collections/:id/items/:itemId')
  @Permissions('builder.web.delete')
  async deleteCollectionItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.webCollections.deleteItem(req.user.tenantId, id, itemId);
  }

  // ─── Form submissions (inbox) ───
  @ApiOperation({ summary: 'Get form submissions' })
  @Permissions('builder.read')
  @Get('web-form-submissions')
  @Permissions('builder.web.read')
  async getFormSubmissions(
    @Req() req: AuthenticatedRequest,
    @Query('formName') formName?: string,
    @Query('status') status?: string,
  ) {
    return this.webCollections.getSubmissions(req.user.tenantId, { formName, status });
  }

  @ApiOperation({ summary: 'Update form submission' })
  @Permissions('builder.update')
  @Patch('web-form-submissions/:id')
  @Permissions('builder.web.update')
  async updateFormSubmission(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { status: string }) {
    return this.webCollections.updateSubmissionStatus(req.user.tenantId, id, body.status);
  }

  @ApiOperation({ summary: 'Delete form submission' })
  @Permissions('builder.delete')
  @Delete('web-form-submissions/:id')
  @Permissions('builder.web.delete')
  async deleteFormSubmission(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.webCollections.deleteSubmission(req.user.tenantId, id);
  }

  // ─── Storefront orders ───
  @ApiOperation({ summary: 'Get orders' })
  @Permissions('builder.read')
  @Get('web-orders')
  @Permissions('builder.web.read')
  async getOrders(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.webCollections.getOrders(req.user.tenantId, { status });
  }

  @ApiOperation({ summary: 'Get order stats' })
  @Permissions('builder.read')
  @Get('web-orders/stats')
  @Permissions('builder.web.read')
  async getOrderStats(@Req() req: AuthenticatedRequest) {
    return this.webCollections.getOrderStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Update order' })
  @Permissions('builder.update')
  @Patch('web-orders/:id')
  @Permissions('builder.web.update')
  async updateOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { status: string }) {
    return this.webCollections.updateOrderStatus(req.user.tenantId, id, body.status);
  }

  @ApiOperation({ summary: 'Delete order' })
  @Permissions('builder.delete')
  @Delete('web-orders/:id')
  @Permissions('builder.web.delete')
  async deleteOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.webCollections.deleteOrder(req.user.tenantId, id);
  }
}

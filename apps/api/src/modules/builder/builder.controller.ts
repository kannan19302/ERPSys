import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
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
} from '@unerp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BuilderService } from './builder.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('builder')
@UseGuards(JwtAuthGuard, RbacGuard)
export class BuilderController {
  constructor(private readonly builderService: BuilderService) {}

  // ─── Stats ──────────────────────────────────────
  @Get('stats')
  @Permissions('builder.read')
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.builderService.getStats(req.user.tenantId);
  }

  @Get('recent-items')
  @Permissions('builder.read')
  async getRecentItems(@Req() req: AuthenticatedRequest) {
    return this.builderService.getRecentItems(req.user.tenantId);
  }

  // ─── Forms ──────────────────────────────────────
  @Get('forms')
  @Permissions('builder.form.read')
  async getForms(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('module') module?: string,
  ) {
    return this.builderService.getForms(req.user.tenantId, { search, module });
  }

  @Get('forms/stats')
  @Permissions('builder.form.read')
  async getFormStats(@Req() req: AuthenticatedRequest) {
    return this.builderService.getFormStats(req.user.tenantId);
  }

  @Get('forms/:id')
  @Permissions('builder.form.read')
  async getFormById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getFormById(req.user.tenantId, id);
  }

  @Post('forms')
  @Permissions('builder.form.create')
  async createForm(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBuilderFormSchema)) dto: CreateBuilderFormInput
  ) {
    return this.builderService.createForm(req.user.tenantId, dto);
  }

  @Patch('forms/:id')
  @Permissions('builder.form.update')
  async updateForm(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBuilderFormSchema)) dto: UpdateBuilderFormInput
  ) {
    return this.builderService.updateForm(req.user.tenantId, id, dto);
  }

  @Delete('forms/:id')
  @Permissions('builder.form.delete')
  async deleteForm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteForm(req.user.tenantId, id);
  }

  @Post('forms/:id/publish')
  @Permissions('builder.form.update')
  async publishBuilderForm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.publishBuilderForm(req.user.tenantId, id);
  }

  // ─── Workflows ──────────────────────────────────
  @Get('workflows')
  @Permissions('builder.workflow.read')
  async getWorkflows(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWorkflows(req.user.tenantId);
  }

  @Get('workflows/:id')
  @Permissions('builder.workflow.read')
  async getWorkflowById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getWorkflowById(req.user.tenantId, id);
  }

  @Post('workflows')
  @Permissions('builder.workflow.create')
  async createWorkflow(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBuilderWorkflowSchema)) dto: any
  ) {
    return this.builderService.createWorkflow(req.user.tenantId, dto);
  }

  @Patch('workflows/:id')
  @Permissions('builder.workflow.update')
  async updateWorkflow(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBuilderWorkflowSchema)) dto: any
  ) {
    return this.builderService.updateWorkflow(req.user.tenantId, id, dto);
  }

  @Delete('workflows/:id')
  @Permissions('builder.workflow.delete')
  async deleteWorkflow(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWorkflow(req.user.tenantId, id);
  }

  @Post('workflows/:id/execute')
  @Permissions('builder.workflow.update')
  async executeWorkflow(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.executeWorkflow(req.user.tenantId, id);
  }

  @Get('workflows/:id/executions')
  @Permissions('builder.workflow.read')
  async getWorkflowExecutions(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getWorkflowExecutions(req.user.tenantId, id);
  }

  // ─── Dashboards ─────────────────────────────────
  @Get('dashboards/global-stats')
  @Permissions('builder.dashboard.read')
  async getGlobalPerformanceStats(@Req() req: AuthenticatedRequest) {
    return this.builderService.getGlobalPerformanceStats(req.user.tenantId);
  }

  @Get('dashboards')
  @Permissions('builder.dashboard.read')
  async getDashboards(@Req() req: AuthenticatedRequest) {
    return this.builderService.getDashboards(req.user.tenantId);
  }

  @Get('dashboards/:id')
  @Permissions('builder.dashboard.read')
  async getDashboardById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getDashboardById(req.user.tenantId, id);
  }

  @Post('dashboards')
  @Permissions('builder.dashboard.create')
  async createDashboard(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBuilderDashboardSchema)) dto: any
  ) {
    return this.builderService.createDashboard(req.user.tenantId, dto);
  }

  @Patch('dashboards/:id')
  @Permissions('builder.dashboard.update')
  async updateDashboard(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBuilderDashboardSchema)) dto: any
  ) {
    return this.builderService.updateDashboard(req.user.tenantId, id, dto);
  }

  @Delete('dashboards/:id')
  @Permissions('builder.dashboard.delete')
  async deleteDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteDashboard(req.user.tenantId, id);
  }

  // ─── Custom Modules ─────────────────────────────
  @Get('modules')
  @Permissions('builder.module.read')
  async getModules(@Req() req: AuthenticatedRequest) {
    return this.builderService.getModules(req.user.tenantId);
  }

  @Get('modules/:id')
  @Permissions('builder.module.read')
  async getModuleById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getModuleById(req.user.tenantId, id);
  }

  @Post('modules')
  @Permissions('builder.module.create')
  async createModule(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBuilderModuleSchema)) dto: any
  ) {
    return this.builderService.createModule(req.user.tenantId, dto);
  }

  @Patch('modules/:id')
  @Permissions('builder.module.update')
  async updateModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBuilderModuleSchema)) dto: any
  ) {
    return this.builderService.updateModule(req.user.tenantId, id, dto);
  }

  @Delete('modules/:id')
  @Permissions('builder.module.delete')
  async deleteModule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteModule(req.user.tenantId, id);
  }

  // ─── Custom App Builder ─────────────────────────
  @Get('modules/:id/full')
  @Permissions('builder.module.read')
  async getModuleWithComponents(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getModuleWithComponents(req.user.tenantId, id);
  }

  @Get('modules/:id/stats')
  @Permissions('builder.module.read')
  async getModuleStats(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getModuleStats(req.user.tenantId, id);
  }

  @Post('modules/:id/components')
  @Permissions('builder.module.update')
  async addComponentToModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addAppComponentSchema)) dto: AddAppComponentInput
  ) {
    return this.builderService.addComponentToModule(req.user.tenantId, id, dto);
  }

  @Delete('modules/:id/components/:componentId')
  @Permissions('builder.module.update')
  async removeComponentFromModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('componentId') componentId: string
  ) {
    return this.builderService.removeComponentFromModule(req.user.tenantId, id, componentId);
  }

  @Post('modules/:id/pages')
  @Permissions('builder.module.update')
  async addPageToModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addAppPageSchema)) dto: AddAppPageInput
  ) {
    return this.builderService.addPageToModule(req.user.tenantId, id, dto);
  }

  @Delete('modules/:id/pages/:pageId')
  @Permissions('builder.module.update')
  async removePageFromModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('pageId') pageId: string
  ) {
    return this.builderService.removePageFromModule(req.user.tenantId, id, pageId);
  }

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

  @Post('modules/:id/data-models')
  @Permissions('builder.module.update')
  async addDataModelToModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addAppDataModelSchema)) dto: AddAppDataModelInput
  ) {
    return this.builderService.addDataModelToModule(req.user.tenantId, id, dto);
  }

  @Delete('modules/:id/data-models/:dataModelId')
  @Permissions('builder.module.update')
  async removeDataModelFromModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('dataModelId') dataModelId: string
  ) {
    return this.builderService.removeDataModelFromModule(req.user.tenantId, id, dataModelId);
  }

  @Post('modules/:id/test')
  @Permissions('builder.module.update')
  async runAppTests(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.runAppTests(req.user.tenantId, id);
  }

  @Post('modules/:id/publish')
  @Permissions('builder.module.update')
  async publishModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishModuleSchema)) dto: PublishModuleInput
  ) {
    return this.builderService.publishModule(req.user.tenantId, id, dto, req.user.userId);
  }

  @Post('modules/:id/unpublish')
  @Permissions('builder.module.update')
  async unpublishModule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.unpublishModule(req.user.tenantId, id);
  }

  @Get('modules/:id/releases')
  @Permissions('builder.module.read')
  async getModuleReleases(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getModuleReleases(req.user.tenantId, id);
  }

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
  @Get('marketplace')
  @Permissions('builder.module.read')
  async getMarketplace(@Req() req: AuthenticatedRequest) {
    return this.builderService.getMarketplace(req.user.tenantId);
  }

  @Post('marketplace/install')
  @Permissions('builder.module.read')
  async installBuilderApp(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(installBuilderAppSchema)) dto: InstallBuilderAppInput
  ) {
    return this.builderService.installBuilderApp(req.user.tenantId, dto.moduleId, dto.releaseId);
  }

  @Post('marketplace/uninstall')
  @Permissions('builder.module.read')
  async uninstallBuilderApp(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(installBuilderAppSchema)) dto: InstallBuilderAppInput
  ) {
    return this.builderService.uninstallBuilderApp(req.user.tenantId, dto.moduleId);
  }

  // ─── Automation Rules ───────────────────────────
  @Get('automation-rules')
  @Permissions('builder.automation.read')
  async getAutomationRules(@Req() req: AuthenticatedRequest) {
    return this.builderService.getAutomationRules(req.user.tenantId);
  }

  @Get('automation-rules/:id')
  @Permissions('builder.automation.read')
  async getAutomationRuleById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getAutomationRuleById(req.user.tenantId, id);
  }

  @Post('automation-rules')
  @Permissions('builder.automation.create')
  async createAutomationRule(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createAutomationRuleSchema)) dto: any
  ) {
    return this.builderService.createAutomationRule(req.user.tenantId, dto);
  }

  @Patch('automation-rules/:id')
  @Permissions('builder.automation.update')
  async updateAutomationRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAutomationRuleSchema)) dto: any
  ) {
    return this.builderService.updateAutomationRule(req.user.tenantId, id, dto);
  }

  @Delete('automation-rules/:id')
  @Permissions('builder.automation.delete')
  async deleteAutomationRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteAutomationRule(req.user.tenantId, id);
  }

  @Post('automation-rules/:id/test')
  @Permissions('builder.automation.update')
  async testRunAutomationRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.testRunAutomationRule(req.user.tenantId, id);
  }

  // ─── Data Imports ───────────────────────────────
  @Get('data-imports')
  @Permissions('builder.import.read')
  async getDataImports(@Req() req: AuthenticatedRequest) {
    return this.builderService.getDataImports(req.user.tenantId);
  }

  @Post('data-imports')
  @Permissions('builder.import.create')
  async createDataImport(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createDataImportSchema)) dto: CreateDataImportInput
  ) {
    return this.builderService.createDataImport(req.user.tenantId, dto);
  }

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
  @Get('web-pages')
  @Permissions('builder.web.read')
  async getWebPages(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebPages(req.user.tenantId);
  }

  @Get('web-pages/:id')
  @Permissions('builder.web.read')
  async getWebPageById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getWebPageById(req.user.tenantId, id);
  }

  @Post('web-pages')
  @Permissions('builder.web.create')
  async createWebPage(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createWebPageSchema)) dto: any
  ) {
    return this.builderService.createWebPage(req.user.tenantId, dto);
  }

  @Patch('web-pages/:id')
  @Permissions('builder.web.update')
  async updateWebPage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWebPageSchema)) dto: any
  ) {
    return this.builderService.updateWebPage(req.user.tenantId, id, dto);
  }

  @Delete('web-pages/:id')
  @Permissions('builder.web.delete')
  async deleteWebPage(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebPage(req.user.tenantId, id);
  }

  // ─── Blog Posts ─────────────────────────────────
  @Get('blog-posts')
  @Permissions('builder.blog.read')
  async getBlogPosts(@Req() req: AuthenticatedRequest) {
    return this.builderService.getBlogPosts(req.user.tenantId);
  }

  @Get('blog-posts/:id')
  @Permissions('builder.blog.read')
  async getBlogPostById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getBlogPostById(req.user.tenantId, id);
  }

  @Post('blog-posts')
  @Permissions('builder.blog.create')
  async createBlogPost(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBlogPostSchema)) dto: any
  ) {
    return this.builderService.createBlogPost(req.user.tenantId, dto);
  }

  @Patch('blog-posts/:id')
  @Permissions('builder.blog.update')
  async updateBlogPost(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBlogPostSchema)) dto: any
  ) {
    return this.builderService.updateBlogPost(req.user.tenantId, id, dto);
  }

  @Delete('blog-posts/:id')
  @Permissions('builder.blog.delete')
  async deleteBlogPost(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteBlogPost(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WEB ASSETS
  // ---------------------------------------------------------------------------
  @Get('web-assets')
  @Permissions('builder.web.read')
  async getWebAssets(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebAssets(req.user.tenantId);
  }

  @Post('web-assets')
  @Permissions('builder.web.create')
  async createWebAsset(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(createWebAssetSchema)) dto: any) {
    return this.builderService.createWebAsset(req.user.tenantId, dto);
  }

  @Patch('web-assets/:id')
  @Permissions('builder.web.update')
  async updateWebAsset(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body(new ZodValidationPipe(updateWebAssetSchema)) dto: any) {
    return this.builderService.updateWebAsset(req.user.tenantId, id, dto);
  }

  @Delete('web-assets/:id')
  @Permissions('builder.web.delete')
  async deleteWebAsset(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebAsset(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WEB TEMPLATES
  // ---------------------------------------------------------------------------
  @Get('web-templates')
  @Permissions('builder.web.read')
  async getWebTemplates(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebTemplates(req.user.tenantId);
  }

  @Post('web-templates')
  @Permissions('builder.web.create')
  async createWebTemplate(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(createWebTemplateSchema)) dto: any) {
    return this.builderService.createWebTemplate(req.user.tenantId, dto);
  }

  @Patch('web-templates/:id')
  @Permissions('builder.web.update')
  async updateWebTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body(new ZodValidationPipe(updateWebTemplateSchema)) dto: any) {
    return this.builderService.updateWebTemplate(req.user.tenantId, id, dto);
  }

  @Delete('web-templates/:id')
  @Permissions('builder.web.delete')
  async deleteWebTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebTemplate(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WEB MENUS
  // ---------------------------------------------------------------------------
  @Get('web-menus')
  @Permissions('builder.web.read')
  async getWebMenus(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebMenus(req.user.tenantId);
  }

  @Post('web-menus')
  @Permissions('builder.web.create')
  async createWebMenu(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(createWebMenuSchema)) dto: any) {
    return this.builderService.createWebMenu(req.user.tenantId, dto);
  }

  @Patch('web-menus/:id')
  @Permissions('builder.web.update')
  async updateWebMenu(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body(new ZodValidationPipe(updateWebMenuSchema)) dto: any) {
    return this.builderService.updateWebMenu(req.user.tenantId, id, dto);
  }

  @Delete('web-menus/:id')
  @Permissions('builder.web.delete')
  async deleteWebMenu(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebMenu(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WEB SEO
  // ---------------------------------------------------------------------------
  @Get('web-seo')
  @Permissions('builder.web.read')
  async getWebSeo(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebSeo(req.user.tenantId);
  }

  @Post('web-seo')
  @Permissions('builder.web.create')
  async createWebSeo(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(createWebSeoSchema)) dto: any) {
    return this.builderService.createWebSeo(req.user.tenantId, dto);
  }

  @Patch('web-seo/:id')
  @Permissions('builder.web.update')
  async updateWebSeo(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body(new ZodValidationPipe(updateWebSeoSchema)) dto: any) {
    return this.builderService.updateWebSeo(req.user.tenantId, id, dto);
  }

  @Delete('web-seo/:id')
  @Permissions('builder.web.delete')
  async deleteWebSeo(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWebSeo(req.user.tenantId, id);
  }



  @Post('analytics')
  @Permissions('builder.read')
  async logAnalytics(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(builderAnalyticsEventSchema)) data: BuilderAnalyticsEventInput
  ) {
    return this.builderService.logAnalyticsEvent(req.user.tenantId, data);
  }

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
  @Get('schema-registries')
  @Permissions('builder.schema.read')
  async getSchemaRegistries(@Req() req: AuthenticatedRequest) {
    return this.builderService.getSchemaRegistries(req.user.tenantId);
  }

  @Get('schema-registries/:slug')
  @Permissions('builder.schema.read')
  async getSchemaRegistryBySlug(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.builderService.getSchemaRegistryBySlug(req.user.tenantId, slug);
  }

  @Post('schema-registries')
  @Permissions('builder.schema.create')
  async createSchemaRegistry(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createSchemaRegistrySchema)) dto: CreateSchemaRegistryInput
  ) {
    return this.builderService.createSchemaRegistry(req.user.tenantId, dto);
  }

  @Patch('schema-registries/:id')
  @Permissions('builder.schema.update')
  async updateSchemaRegistry(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSchemaRegistrySchema)) dto: UpdateSchemaRegistryInput
  ) {
    return this.builderService.updateSchemaRegistry(req.user.tenantId, id, dto);
  }

  @Delete('schema-registries/:id')
  @Permissions('builder.schema.delete')
  async deleteSchemaRegistry(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteSchemaRegistry(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // PAGE REGISTRIES
  // ---------------------------------------------------------------------------
  @Get('page-registries')
  @Permissions('builder.page.read')
  async getPageRegistries(@Req() req: AuthenticatedRequest) {
    return this.builderService.getPageRegistries(req.user.tenantId);
  }

  @Get('page-registries/:id')
  @Permissions('builder.page.read')
  async getPageRegistryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.getPageRegistryById(req.user.tenantId, id);
  }

  @Get('page-registries/:module/:slug')
  @Permissions('builder.page.read')
  async getPageRegistryBySlug(
    @Req() req: AuthenticatedRequest,
    @Param('module') module: string,
    @Param('slug') slug: string
  ) {
    return this.builderService.getPageRegistryBySlug(req.user.tenantId, module, slug);
  }

  @Post('page-registries')
  @Permissions('builder.page.create')
  async createPageRegistry(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createPageRegistrySchema)) dto: CreatePageRegistryInput
  ) {
    return this.builderService.createPageRegistry(req.user.tenantId, dto);
  }

  @Patch('page-registries/:id')
  @Permissions('builder.page.update')
  async updatePageRegistry(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePageRegistrySchema)) dto: UpdatePageRegistryInput
  ) {
    return this.builderService.updatePageRegistry(req.user.tenantId, id, dto);
  }

  @Delete('page-registries/:id')
  @Permissions('builder.page.delete')
  async deletePageRegistry(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deletePageRegistry(req.user.tenantId, id);
  }

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
  @Post('page-registries/:id/publish')
  @Permissions('builder.page.update')
  async publishForm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.publishForm(req.user.tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // CUSTOM RECORDS (DYNAMIC DATA)
  // ---------------------------------------------------------------------------
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

  @Get('custom-records/:schemaId/:id')
  @Permissions('builder.record.read')
  async getCustomRecordById(
    @Req() req: AuthenticatedRequest,
    @Param('schemaId') schemaId: string,
    @Param('id') id: string
  ) {
    return this.builderService.getCustomRecordById(req.user.tenantId, schemaId, id, req.user.roles);
  }

  @Post('custom-records/:schemaId')
  @Permissions('builder.record.create')
  async createCustomRecord(
    @Req() req: AuthenticatedRequest,
    @Param('schemaId') schemaId: string,
    @Body(new ZodValidationPipe(customRecordDataSchema)) data: CustomRecordDataInput
  ) {
    return this.builderService.createCustomRecord(req.user.tenantId, schemaId, data, req.user.userId, req.user.roles);
  }

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
  @Get('web-settings')
  @Permissions('builder.page.read')
  async getWebSettings(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebSettings(req.user.tenantId);
  }

  @Patch('web-settings')
  @Permissions('builder.page.update')
  async updateWebSettings(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.builderService.updateWebSettings(req.user.tenantId, data);
  }
}

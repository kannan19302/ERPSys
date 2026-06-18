import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
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

  // ─── Forms ──────────────────────────────────────
  @Get('forms')
  @Permissions('builder.form.read')
  async getForms(@Req() req: AuthenticatedRequest) {
    return this.builderService.getForms(req.user.tenantId);
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
    @Body() dto: { name: string; slug: string; description?: string; icon?: string; fields?: any; settings?: any }
  ) {
    return this.builderService.createForm(req.user.tenantId, dto);
  }

  @Patch('forms/:id')
  @Permissions('builder.form.update')
  async updateForm(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; description: string; icon: string; status: string; fields: any; settings: any }>
  ) {
    return this.builderService.updateForm(req.user.tenantId, id, dto);
  }

  @Delete('forms/:id')
  @Permissions('builder.form.delete')
  async deleteForm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteForm(req.user.tenantId, id);
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
    @Body() dto: { name: string; description?: string; docType?: string; trigger?: string; nodes?: any; edges?: any; settings?: any }
  ) {
    return this.builderService.createWorkflow(req.user.tenantId, dto);
  }

  @Patch('workflows/:id')
  @Permissions('builder.workflow.update')
  async updateWorkflow(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; description: string; docType: string; status: string; trigger: string; nodes: any; edges: any; settings: any }>
  ) {
    return this.builderService.updateWorkflow(req.user.tenantId, id, dto);
  }

  @Delete('workflows/:id')
  @Permissions('builder.workflow.delete')
  async deleteWorkflow(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteWorkflow(req.user.tenantId, id);
  }

  // ─── Dashboards ─────────────────────────────────
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
    @Body() dto: { name: string; description?: string; icon?: string; widgets?: any; layout?: any; refreshRate?: number }
  ) {
    return this.builderService.createDashboard(req.user.tenantId, dto);
  }

  @Patch('dashboards/:id')
  @Permissions('builder.dashboard.update')
  async updateDashboard(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; description: string; icon: string; status: string; widgets: any; layout: any; refreshRate: number }>
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
    @Body() dto: { name: string; slug: string; description?: string; icon?: string; color?: string; entities?: any; relationships?: any; permissions?: any }
  ) {
    return this.builderService.createModule(req.user.tenantId, dto);
  }

  @Patch('modules/:id')
  @Permissions('builder.module.update')
  async updateModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; description: string; icon: string; color: string; status: string; entities: any; relationships: any; permissions: any }>
  ) {
    return this.builderService.updateModule(req.user.tenantId, id, dto);
  }

  @Delete('modules/:id')
  @Permissions('builder.module.delete')
  async deleteModule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.builderService.deleteModule(req.user.tenantId, id);
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
    @Body() dto: { name: string; description?: string; trigger: string; triggerConfig?: any; conditions?: any; actions?: any; settings?: any }
  ) {
    return this.builderService.createAutomationRule(req.user.tenantId, dto);
  }

  @Patch('automation-rules/:id')
  @Permissions('builder.automation.update')
  async updateAutomationRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; description: string; trigger: string; triggerConfig: any; conditions: any; actions: any; status: string; settings: any }>
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
    @Body() dto: { name: string; targetModel: string; fileName: string; fileSize: number; totalRows: number; columnMapping?: any }
  ) {
    return this.builderService.createDataImport(req.user.tenantId, dto);
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
    @Body() dto: { name: string; slug: string; sections?: any; metaTitle?: string; metaDesc?: string; ogImage?: string; visibility?: string }
  ) {
    return this.builderService.createWebPage(req.user.tenantId, dto);
  }

  @Patch('web-pages/:id')
  @Permissions('builder.web.update')
  async updateWebPage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; slug: string; status: string; sections: any; metaTitle: string; metaDesc: string; ogImage: string; visibility: string; sortOrder: number }>
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
    @Body() dto: { title: string; slug: string; content?: string; excerpt?: string; category?: string; tags?: any; author?: string; featuredImage?: string; metaTitle?: string; metaDesc?: string; readTime?: string }
  ) {
    return this.builderService.createBlogPost(req.user.tenantId, dto);
  }

  @Patch('blog-posts/:id')
  @Permissions('builder.blog.update')
  async updateBlogPost(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<{ title: string; content: string; excerpt: string; category: string; tags: any; author: string; status: string; featuredImage: string; metaTitle: string; metaDesc: string; readTime: string }>
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

  // ---------------------------------------------------------------------------
  // WEB TEMPLATES
  // ---------------------------------------------------------------------------
  @Get('web-templates')
  @Permissions('builder.web.read')
  async getWebTemplates(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebTemplates(req.user.tenantId);
  }

  // ---------------------------------------------------------------------------
  // WEB MENUS
  // ---------------------------------------------------------------------------
  @Get('web-menus')
  @Permissions('builder.web.read')
  async getWebMenus(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebMenus(req.user.tenantId);
  }

  // ---------------------------------------------------------------------------
  // WEB SEO
  // ---------------------------------------------------------------------------
  @Get('web-seo')
  @Permissions('builder.web.read')
  async getWebSeo(@Req() req: AuthenticatedRequest) {
    return this.builderService.getWebSeo(req.user.tenantId);
  }

  @Post('analytics')
  async logAnalytics(@Req() req: AuthenticatedRequest, @Body() data: any) {
    // In a real app, save to an Analytics table. For now just log it.
    console.log(`[ANALYTICS] Tenant ${req.user?.tenantId} | Event: ${data.event} | Entity: ${data.entityType} ${data.entityId}`);
    return { success: true };
  }

  @Post('ai-generate')
  async generateSchema(@Req() _req: AuthenticatedRequest, @Body() _data: { prompt: string }) {
    // In a real app, this calls an LLM API (OpenAI/Anthropic) using prompt to generate a JSON schema.
    // For now, return a generic pre-built template based on the prompt content.
    const schema = [
      { id: 'f_ai_1', name: 'title', label: 'Generated Title', type: 'text', width: 12 },
      { id: 'f_ai_2', name: 'description', label: 'Generated Description', type: 'textarea', width: 12 },
      { id: 'f_ai_3', name: 'status', label: 'Status', type: 'select', width: 6, options: [{label: 'Active', value: 'active'}, {label: 'Draft', value: 'draft'}] }
    ];
    return { success: true, schema };
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
    @Body() dto: { module: string; name: string; slug: string; description?: string; fields?: any; settings?: any }
  ) {
    return this.builderService.createSchemaRegistry(req.user.tenantId, dto);
  }

  @Patch('schema-registries/:id')
  @Permissions('builder.schema.update')
  async updateSchemaRegistry(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<{ name: string; description: string; fields: any; settings: any; status: string }>
  ) {
    return this.builderService.updateSchemaRegistry(req.user.tenantId, id, dto);
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
    @Body() dto: { schemaId?: string; module: string; slug: string; title: string; type?: string; layout?: any }
  ) {
    return this.builderService.createPageRegistry(req.user.tenantId, dto);
  }

  @Patch('page-registries/:id')
  @Permissions('builder.page.update')
  async updatePageRegistry(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<{ title: string; layout: any; status: string }>
  ) {
    return this.builderService.updatePageRegistry(req.user.tenantId, id, dto);
  }

  // ---------------------------------------------------------------------------
  // CUSTOM RECORDS (DYNAMIC DATA)
  // ---------------------------------------------------------------------------
  @Get('custom-records/:schemaId')
  @Permissions('builder.record.read')
  async getCustomRecords(@Req() req: AuthenticatedRequest, @Param('schemaId') schemaId: string) {
    return this.builderService.getCustomRecords(req.user.tenantId, schemaId, req.user.roles);
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
    @Body() data: any
  ) {
    return this.builderService.createCustomRecord(req.user.tenantId, schemaId, data, req.user.userId, req.user.roles);
  }

  @Patch('custom-records/:schemaId/:id')
  @Permissions('builder.record.update')
  async updateCustomRecord(
    @Req() req: AuthenticatedRequest,
    @Param('schemaId') schemaId: string,
    @Param('id') id: string,
    @Body() data: any
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
}

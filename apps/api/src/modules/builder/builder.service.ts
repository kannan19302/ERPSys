import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import * as vm from 'vm';

@Injectable()
export class BuilderService {
  // ══════════════════════════════════════════════
  // BUILDER FORMS
  // ══════════════════════════════════════════════

  async getForms(tenantId: string, params: { page?: number; limit?: number; search?: string } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.builderForm.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.builderForm.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getFormById(tenantId: string, id: string) {
    const form = await prisma.builderForm.findFirst({
      where: { id, tenantId },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async createForm(
    tenantId: string,
    dto: { name: string; slug: string; description?: string; icon?: string; fields?: any; settings?: any }
  ) {
    const existing = await prisma.builderForm.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing) throw new BadRequestException('A form with this slug already exists');

    return prisma.builderForm.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        icon: dto.icon || null,
        fields: dto.fields || [],
        settings: dto.settings || {},
      },
    });
  }

  async updateForm(tenantId: string, id: string, dto: Partial<{ name: string; description: string; icon: string; status: string; fields: any; settings: any }>) {
    const form = await prisma.builderForm.findFirst({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Form not found');

    return prisma.builderForm.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.fields !== undefined && { fields: dto.fields }),
        ...(dto.settings !== undefined && { settings: dto.settings }),
      },
    });
  }

  async deleteForm(tenantId: string, id: string) {
    const form = await prisma.builderForm.findFirst({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Form not found');
    return prisma.builderForm.delete({ where: { id } });
  }

  // ══════════════════════════════════════════════
  // BUILDER WORKFLOWS
  // ══════════════════════════════════════════════

  async getWorkflows(tenantId: string) {
    return prisma.builderWorkflow.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkflowById(tenantId: string, id: string) {
    const wf = await prisma.builderWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return wf;
  }

  async createWorkflow(
    tenantId: string,
    dto: { name: string; description?: string; docType?: string; trigger?: string; nodes?: any; edges?: any; settings?: any }
  ) {
    return prisma.builderWorkflow.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        docType: dto.docType || null,
        trigger: dto.trigger || 'SUBMIT',
        nodes: dto.nodes || [],
        edges: dto.edges || [],
        settings: dto.settings || {},
      },
    });
  }

  async updateWorkflow(tenantId: string, id: string, dto: Partial<{ name: string; description: string; docType: string; status: string; trigger: string; nodes: any; edges: any; settings: any }>) {
    const wf = await prisma.builderWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow not found');

    return prisma.builderWorkflow.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.docType !== undefined && { docType: dto.docType }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.trigger !== undefined && { trigger: dto.trigger }),
        ...(dto.nodes !== undefined && { nodes: dto.nodes }),
        ...(dto.edges !== undefined && { edges: dto.edges }),
        ...(dto.settings !== undefined && { settings: dto.settings }),
      },
    });
  }

  async deleteWorkflow(tenantId: string, id: string) {
    const wf = await prisma.builderWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return prisma.builderWorkflow.delete({ where: { id } });
  }

  async executeWorkflow(tenantId: string, id: string) {
    const wf = await prisma.builderWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    
    // Simulate an execution log (normally this uses Phase 8 WorkflowEngine)
    // To avoid creating a new database table just for mocks, we'll store mock logs in memory or return a static success for the UI simulation
    const mockExecution = {
      id: `exec_${Date.now()}`,
      workflowId: id,
      status: 'COMPLETED',
      startedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 1500).toISOString(),
      logs: [
        { time: new Date().toISOString(), level: 'INFO', message: `Triggered ${wf.name}` },
        { time: new Date(Date.now() + 500).toISOString(), level: 'INFO', message: `Evaluating condition... Passed` },
        { time: new Date(Date.now() + 1000).toISOString(), level: 'INFO', message: `Executed 2 nodes successfully` }
      ]
    };
    return mockExecution;
  }

  async getWorkflowExecutions(_tenantId: string, _id: string) {
    // In a real app, fetch execution logs
    return [];
  }

  // ══════════════════════════════════════════════
  // BUILDER DASHBOARDS
  // ══════════════════════════════════════════════

  async getDashboards(tenantId: string) {
    return prisma.builderDashboard.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardById(tenantId: string, id: string) {
    const db = await prisma.builderDashboard.findFirst({ where: { id, tenantId } });
    if (!db) throw new NotFoundException('Dashboard not found');
    return db;
  }

  async createDashboard(
    tenantId: string,
    dto: { name: string; description?: string; icon?: string; widgets?: any; layout?: any; refreshRate?: number }
  ) {
    return prisma.builderDashboard.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        icon: dto.icon || null,
        widgets: dto.widgets || [],
        layout: dto.layout || {},
        refreshRate: dto.refreshRate || 300,
      },
    });
  }

  async updateDashboard(tenantId: string, id: string, dto: Partial<{ name: string; description: string; icon: string; status: string; widgets: any; layout: any; refreshRate: number }>) {
    const db = await prisma.builderDashboard.findFirst({ where: { id, tenantId } });
    if (!db) throw new NotFoundException('Dashboard not found');

    return prisma.builderDashboard.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.widgets !== undefined && { widgets: dto.widgets }),
        ...(dto.layout !== undefined && { layout: dto.layout }),
        ...(dto.refreshRate !== undefined && { refreshRate: dto.refreshRate }),
      },
    });
  }

  async deleteDashboard(tenantId: string, id: string) {
    const db = await prisma.builderDashboard.findFirst({ where: { id, tenantId } });
    if (!db) throw new NotFoundException('Dashboard not found');
    return prisma.builderDashboard.delete({ where: { id } });
  }

  // ══════════════════════════════════════════════
  // BUILDER MODULES
  // ══════════════════════════════════════════════

  async getModules(tenantId: string) {
    return prisma.builderModule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getModuleById(tenantId: string, id: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');
    return mod;
  }

  async createModule(
    tenantId: string,
    dto: { name: string; slug: string; description?: string; icon?: string; color?: string; entities?: any; relationships?: any; permissions?: any }
  ) {
    const existing = await prisma.builderModule.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing) throw new BadRequestException('A module with this slug already exists');

    return prisma.builderModule.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        icon: dto.icon || null,
        color: dto.color || null,
        entities: dto.entities || [],
        relationships: dto.relationships || [],
        permissions: dto.permissions || {},
      },
    });
  }

  async updateModule(tenantId: string, id: string, dto: Partial<{ name: string; description: string; icon: string; color: string; status: string; entities: any; relationships: any; permissions: any }>) {
    const mod = await prisma.builderModule.findFirst({ where: { id, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    return prisma.builderModule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.entities !== undefined && { entities: dto.entities }),
        ...(dto.relationships !== undefined && { relationships: dto.relationships }),
        ...(dto.permissions !== undefined && { permissions: dto.permissions }),
      },
    });
  }

  async deleteModule(tenantId: string, id: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');
    return prisma.builderModule.delete({ where: { id } });
  }

  // ══════════════════════════════════════════════
  // AUTOMATION RULES
  // ══════════════════════════════════════════════

  async getAutomationRules(tenantId: string) {
    return prisma.automationRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAutomationRuleById(tenantId: string, id: string) {
    const rule = await prisma.automationRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return rule;
  }

  async createAutomationRule(
    tenantId: string,
    dto: { name: string; description?: string; trigger: string; triggerConfig?: any; conditions?: any; actions?: any; settings?: any }
  ) {
    return prisma.automationRule.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        trigger: dto.trigger,
        triggerConfig: dto.triggerConfig || {},
        conditions: dto.conditions || [],
        actions: dto.actions || [],
        settings: dto.settings || {},
      },
    });
  }

  async updateAutomationRule(tenantId: string, id: string, dto: Partial<{ name: string; description: string; trigger: string; triggerConfig: any; conditions: any; actions: any; status: string; settings: any }>) {
    const rule = await prisma.automationRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Automation rule not found');

    return prisma.automationRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.trigger !== undefined && { trigger: dto.trigger }),
        ...(dto.triggerConfig !== undefined && { triggerConfig: dto.triggerConfig }),
        ...(dto.conditions !== undefined && { conditions: dto.conditions }),
        ...(dto.actions !== undefined && { actions: dto.actions }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.settings !== undefined && { settings: dto.settings }),
      },
    });
  }

  async deleteAutomationRule(tenantId: string, id: string) {
    const rule = await prisma.automationRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return prisma.automationRule.delete({ where: { id } });
  }

  async testRunAutomationRule(tenantId: string, id: string) {
    const rule = await prisma.automationRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Automation rule not found');

    // Simulate execution
    const execMs = Math.floor(Math.random() * 2000) + 200;

    await prisma.automationRule.update({
      where: { id },
      data: {
        runCount: { increment: 1 },
        lastRunAt: new Date(),
        avgExecMs: execMs,
      },
    });

    return {
      success: true,
      ruleId: id,
      executionTimeMs: execMs,
      simulatedActions: (rule.actions as unknown[]).length,
      message: `Test run completed in ${execMs}ms`,
    };
  }

  // ══════════════════════════════════════════════
  // DATA IMPORT JOBS
  // ══════════════════════════════════════════════

  async getDataImports(tenantId: string) {
    return prisma.dataImportJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDataImport(
    tenantId: string,
    dto: { name: string; targetModel: string; fileName: string; fileSize: number; totalRows: number; columnMapping?: any }
  ) {
    return prisma.dataImportJob.create({
      data: {
        tenantId,
        name: dto.name,
        targetModel: dto.targetModel,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        totalRows: dto.totalRows,
        columnMapping: dto.columnMapping || {},
        status: 'VALIDATING',
        startedAt: new Date(),
      },
    });
  }

  async executeDataImport(tenantId: string, id: string, rows: any[]) {
    const job = await prisma.dataImportJob.findFirst({ where: { id, tenantId } });
    if (!job) throw new NotFoundException('Data import job not found');

    await prisma.dataImportJob.update({
      where: { id },
      data: { status: 'IMPORTING' }
    });

    let successCount = 0;
    let failedCount = 0;
    
    const targetModel = job.targetModel; // e.g., 'customer', 'product'
    const columnMapping = job.columnMapping as Record<string, string>; // CSV header -> DB column

    // Process rows
    const dataToInsert = [];
    for (const row of rows) {
      const dbRecord: any = { tenantId };
      let hasData = false;
      
      for (const [csvCol, dbCol] of Object.entries(columnMapping)) {
        if (dbCol && row[csvCol] !== undefined && row[csvCol] !== '') {
          dbRecord[dbCol] = row[csvCol];
          hasData = true;
        }
      }
      if (hasData) dataToInsert.push(dbRecord);
    }

    try {
      if (dataToInsert.length > 0) {
        // Warning: dynamic prisma model access
        const prismaModel = (prisma as any)[targetModel];
        if (prismaModel && typeof prismaModel.createMany === 'function') {
           const result = await prismaModel.createMany({
             data: dataToInsert,
             skipDuplicates: true
           });
           successCount = result.count;
           failedCount = rows.length - successCount;
        } else {
           failedCount = rows.length;
        }
      } else {
        failedCount = rows.length;
      }
    } catch (e) {
      console.error('Data import failed:', e);
      failedCount = rows.length;
      successCount = 0;
    }

    return prisma.dataImportJob.update({
      where: { id },
      data: {
        status: failedCount > 0 ? (successCount > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED',
        importedRows: successCount,
        failedRows: failedCount,
        completedAt: new Date()
      }
    });
  }

  // ══════════════════════════════════════════════
  // WEB PAGES
  // ══════════════════════════════════════════════

  async getWebPages(tenantId: string) {
    return prisma.webPage.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getWebPageById(tenantId: string, id: string) {
    const page = await prisma.webPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException('Web page not found');
    return page;
  }

  async createWebPage(
    tenantId: string,
    dto: { name: string; slug: string; sections?: any; metaTitle?: string; metaDesc?: string; ogImage?: string; visibility?: string }
  ) {
    const existing = await prisma.webPage.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing) throw new BadRequestException('A page with this slug already exists');

    return prisma.webPage.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        sections: dto.sections || [],
        metaTitle: dto.metaTitle || null,
        metaDesc: dto.metaDesc || null,
        ogImage: dto.ogImage || null,
        visibility: dto.visibility || 'PUBLIC',
      },
    });
  }

  async updateWebPage(tenantId: string, id: string, dto: Partial<{ name: string; slug: string; status: string; sections: any; metaTitle: string; metaDesc: string; ogImage: string; visibility: string; sortOrder: number }>) {
    const page = await prisma.webPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException('Web page not found');

    return prisma.webPage.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.sections !== undefined && { sections: dto.sections }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle }),
        ...(dto.metaDesc !== undefined && { metaDesc: dto.metaDesc }),
        ...(dto.ogImage !== undefined && { ogImage: dto.ogImage }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteWebPage(tenantId: string, id: string) {
    const page = await prisma.webPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException('Web page not found');
    return prisma.webPage.delete({ where: { id } });
  }

  // ══════════════════════════════════════════════
  // BLOG POSTS
  // ══════════════════════════════════════════════

  async getBlogPosts(tenantId: string) {
    return prisma.blogPost.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBlogPostById(tenantId: string, id: string) {
    const post = await prisma.blogPost.findFirst({ where: { id, tenantId } });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async createBlogPost(
    tenantId: string,
    dto: { title: string; slug: string; content?: string; excerpt?: string; category?: string; tags?: any; author?: string; featuredImage?: string; metaTitle?: string; metaDesc?: string; readTime?: string }
  ) {
    const existing = await prisma.blogPost.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing) throw new BadRequestException('A blog post with this slug already exists');

    return prisma.blogPost.create({
      data: {
        tenantId,
        title: dto.title,
        slug: dto.slug,
        content: dto.content || null,
        excerpt: dto.excerpt || null,
        category: dto.category || 'General',
        tags: dto.tags || [],
        author: dto.author || null,
        featuredImage: dto.featuredImage || null,
        metaTitle: dto.metaTitle || null,
        metaDesc: dto.metaDesc || null,
        readTime: dto.readTime || null,
      },
    });
  }

  async updateBlogPost(tenantId: string, id: string, dto: Partial<{ title: string; content: string; excerpt: string; category: string; tags: any; author: string; status: string; featuredImage: string; metaTitle: string; metaDesc: string; readTime: string }>) {
    const post = await prisma.blogPost.findFirst({ where: { id, tenantId } });
    if (!post) throw new NotFoundException('Blog post not found');

    return prisma.blogPost.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.author !== undefined && { author: dto.author }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.featuredImage !== undefined && { featuredImage: dto.featuredImage }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle }),
        ...(dto.metaDesc !== undefined && { metaDesc: dto.metaDesc }),
        ...(dto.readTime !== undefined && { readTime: dto.readTime }),
        ...(dto.status === 'PUBLISHED' && !post.publishedAt && { publishedAt: new Date() }),
      },
    });
  }

  async deleteBlogPost(tenantId: string, id: string) {
    const post = await prisma.blogPost.findFirst({ where: { id, tenantId } });
    if (!post) throw new NotFoundException('Blog post not found');
    return prisma.blogPost.delete({ where: { id } });
  }



  // ---------------------------------------------------------------------------
  // WEB ASSETS
  // ---------------------------------------------------------------------------
  async getWebAssets(tenantId: string) {
    return prisma.webAsset.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebAsset(tenantId: string, dto: { name: string; url: string; type?: string; sizeBytes?: number }) {
    return prisma.webAsset.create({
      data: {
        tenantId,
        name: dto.name,
        url: dto.url,
        type: dto.type || 'IMAGE',
        sizeBytes: dto.sizeBytes || 0,
      }
    });
  }

  async updateWebAsset(tenantId: string, id: string, dto: Partial<{ name: string; url: string; type: string }>) {
    const asset = await prisma.webAsset.findFirst({ where: { id, tenantId } });
    if (!asset) throw new NotFoundException('Web asset not found');
    return prisma.webAsset.update({
      where: { id },
      data: dto
    });
  }

  async deleteWebAsset(tenantId: string, id: string) {
    const asset = await prisma.webAsset.findFirst({ where: { id, tenantId } });
    if (!asset) throw new NotFoundException('Web asset not found');
    return prisma.webAsset.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // WEB TEMPLATES
  // ---------------------------------------------------------------------------
  async getWebTemplates(tenantId: string) {
    return prisma.webTemplate.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebTemplate(tenantId: string, dto: { name: string; description?: string; htmlContent?: string; cssContent?: string; status?: string }) {
    return prisma.webTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        htmlContent: dto.htmlContent || null,
        cssContent: dto.cssContent || null,
        status: dto.status || 'DRAFT',
      }
    });
  }

  async updateWebTemplate(tenantId: string, id: string, dto: Partial<{ name: string; description: string; htmlContent: string; cssContent: string; status: string }>) {
    const template = await prisma.webTemplate.findFirst({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('Web template not found');
    return prisma.webTemplate.update({
      where: { id },
      data: dto
    });
  }

  async deleteWebTemplate(tenantId: string, id: string) {
    const template = await prisma.webTemplate.findFirst({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('Web template not found');
    return prisma.webTemplate.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // WEB MENUS
  // ---------------------------------------------------------------------------
  async getWebMenus(tenantId: string) {
    return prisma.webMenu.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebMenu(tenantId: string, dto: { name: string; location?: string; items?: any; status?: string }) {
    return prisma.webMenu.create({
      data: {
        tenantId,
        name: dto.name,
        location: dto.location || 'HEADER',
        items: dto.items || [],
        status: dto.status || 'ACTIVE',
      }
    });
  }

  async updateWebMenu(tenantId: string, id: string, dto: Partial<{ name: string; location: string; items: any; status: string }>) {
    const menu = await prisma.webMenu.findFirst({ where: { id, tenantId } });
    if (!menu) throw new NotFoundException('Web menu not found');
    return prisma.webMenu.update({
      where: { id },
      data: dto
    });
  }

  async deleteWebMenu(tenantId: string, id: string) {
    const menu = await prisma.webMenu.findFirst({ where: { id, tenantId } });
    if (!menu) throw new NotFoundException('Web menu not found');
    return prisma.webMenu.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // WEB SEO
  // ---------------------------------------------------------------------------
  async getWebSeo(tenantId: string) {
    return prisma.webSeo.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebSeo(tenantId: string, dto: { path: string; title: string; description?: string; keywords?: string; ogImage?: string; status?: string }) {
    const existing = await prisma.webSeo.findFirst({ where: { tenantId, path: dto.path } });
    if (existing) throw new BadRequestException('SEO config for this path already exists');
    return prisma.webSeo.create({
      data: {
        tenantId,
        path: dto.path,
        title: dto.title,
        description: dto.description || null,
        keywords: dto.keywords || null,
        ogImage: dto.ogImage || null,
        status: dto.status || 'ACTIVE',
      }
    });
  }

  async updateWebSeo(tenantId: string, id: string, dto: Partial<{ path: string; title: string; description: string; keywords: string; ogImage: string; status: string }>) {
    const seo = await prisma.webSeo.findFirst({ where: { id, tenantId } });
    if (!seo) throw new NotFoundException('Web SEO not found');
    return prisma.webSeo.update({
      where: { id },
      data: dto
    });
  }

  async deleteWebSeo(tenantId: string, id: string) {
    const seo = await prisma.webSeo.findFirst({ where: { id, tenantId } });
    if (!seo) throw new NotFoundException('Web SEO not found');
    return prisma.webSeo.delete({ where: { id } });
  }

  async getStats(tenantId: string) {
    const [forms, workflows, dashboards, modules, rules, imports, webPages, blogPosts, webAssets, webTemplates, webMenus, webSeo] = await Promise.all([
      prisma.builderForm.count({ where: { tenantId } }),
      prisma.builderWorkflow.count({ where: { tenantId } }),
      prisma.builderDashboard.count({ where: { tenantId } }),
      prisma.builderModule.count({ where: { tenantId } }),
      prisma.automationRule.count({ where: { tenantId } }),
      prisma.dataImportJob.count({ where: { tenantId } }),
      prisma.webPage.count({ where: { tenantId } }),
      prisma.blogPost.count({ where: { tenantId } }),
      prisma.webAsset.count({ where: { tenantId } }),
      prisma.webTemplate.count({ where: { tenantId } }),
      prisma.webMenu.count({ where: { tenantId } }),
      prisma.webSeo.count({ where: { tenantId } }),
    ]);

    const activeRules = await prisma.automationRule.count({ where: { tenantId, status: 'ACTIVE' } });
    const publishedPages = await prisma.webPage.count({ where: { tenantId, status: 'PUBLISHED' } });
    const publishedPosts = await prisma.blogPost.count({ where: { tenantId, status: 'PUBLISHED' } });

    return {
      erp: {
        forms,
        workflows,
        dashboards,
        modules,
        automationRules: rules,
        activeRules,
        dataImports: imports,
      },
      web: {
        pages: webPages,
        publishedPages,
        blogPosts,
        publishedPosts,
        assets: webAssets,
        templates: webTemplates,
        menus: webMenus,
        seo: webSeo,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // SCHEMA REGISTRIES
  // ---------------------------------------------------------------------------
  async getSchemaRegistries(tenantId: string) {
    return prisma.schemaRegistry.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSchemaRegistryBySlug(tenantId: string, slug: string) {
    const schema = await prisma.schemaRegistry.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (!schema) throw new NotFoundException(`Schema ${slug} not found`);
    return schema;
  }

  async createSchemaRegistry(tenantId: string, data: any) {
    return prisma.schemaRegistry.create({
      data: { ...data, tenantId },
    });
  }

  async updateSchemaRegistry(tenantId: string, id: string, data: any) {
    // Used tenantId to suppress ts error and enforce security
    const existing = await prisma.schemaRegistry.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Schema not found');
    return prisma.schemaRegistry.update({
      where: { id },
      data,
    });
  }

  // ---------------------------------------------------------------------------
  // PAGE REGISTRIES
  // ---------------------------------------------------------------------------
  async getPageRegistries(tenantId: string) {
    return prisma.pageRegistry.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPageRegistryById(tenantId: string, id: string) {
    const page = await prisma.pageRegistry.findFirst({
      where: { id, tenantId },
      include: { schemaRegistry: true }
    });
    if (!page) throw new NotFoundException(`Page ${id} not found`);
    return page;
  }

  async getPageRegistryBySlug(tenantId: string, module: string, slug: string) {
    const page = await prisma.pageRegistry.findUnique({
      where: { tenantId_module_slug: { tenantId, module, slug } },
      include: { schemaRegistry: true }
    });
    if (!page) throw new NotFoundException(`Page ${module}/${slug} not found`);
    return page;
  }

  async createPageRegistry(tenantId: string, data: any) {
    return prisma.pageRegistry.create({
      data: { ...data, tenantId },
    });
  }

  async updatePageRegistry(tenantId: string, id: string, data: any) {
    const existing = await prisma.pageRegistry.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Page not found');

    const updateData = { ...data };

    // If layout is being updated, push the old layout to history
    if (data.layout && JSON.stringify(data.layout) !== JSON.stringify(existing.layout)) {
      const currentHistory = Array.isArray(existing.history) ? existing.history : [];
      // Keep last 10 versions
      const newHistory = [{ layout: existing.layout, savedAt: new Date().toISOString() }, ...currentHistory].slice(0, 10);
      updateData.history = newHistory;
    }

    return prisma.pageRegistry.update({
      where: { id },
      data: updateData,
    });
  }

  // ---------------------------------------------------------------------------
  // CUSTOM RECORDS (DYNAMIC DATA)
  // ---------------------------------------------------------------------------
  async getCustomRecords(tenantId: string, schemaId: string, userRoles: string[] = []) {
    const schema = await prisma.schemaRegistry.findFirst({ where: { id: schemaId, tenantId } });
    const records = await prisma.customRecord.findMany({
      where: { tenantId, schemaId },
      orderBy: { createdAt: 'desc' },
    });

    if (!schema || !schema.fields || !Array.isArray(schema.fields)) return records;

    // Scrub data based on readRoles
    const fields = schema.fields as any[];
    return records.map(record => {
      const data = record.data as any;
      const scrubbedData = { ...data };

      fields.forEach(f => {
        if (f.readRoles && typeof f.readRoles === 'string') {
          const allowedRoles = f.readRoles.split(',').map((r: string) => r.trim()).filter(Boolean);
          if (allowedRoles.length > 0 && !userRoles.some((ur: string) => allowedRoles.includes(ur))) {
            delete scrubbedData[f.name];
          }
        }
      });

      return { ...record, data: scrubbedData };
    });
  }

  async getCustomRecordById(tenantId: string, schemaId: string, id: string, userRoles: string[] = []) {
    const record = await prisma.customRecord.findFirst({
      where: { id, tenantId, schemaId },
    });
    if (!record) throw new NotFoundException('Record not found');

    const schema = await prisma.schemaRegistry.findFirst({ where: { id: schemaId, tenantId } });
    if (!schema || !schema.fields || !Array.isArray(schema.fields)) return record;

    const fields = schema.fields as any[];
    const data = record.data as any;
    const scrubbedData = { ...data };

    fields.forEach(f => {
      if (f.readRoles && typeof f.readRoles === 'string') {
        const allowedRoles = f.readRoles.split(',').map((r: string) => r.trim()).filter(Boolean);
        if (allowedRoles.length > 0 && !userRoles.some((ur: string) => allowedRoles.includes(ur))) {
          delete scrubbedData[f.name];
        }
      }
    });

    return { ...record, data: scrubbedData };
  }

  async triggerWebhooks(tenantId: string, schemaId: string, event: string, payload: any) {
    try {
      const page = await prisma.pageRegistry.findFirst({ where: { schemaId: schemaId, tenantId } });
      if (!page || !page.layout) return;
      const layoutObj = typeof page.layout === 'string' ? JSON.parse(page.layout) : page.layout;
      const webhooks = layoutObj?.settings?.webhooks || [];

      for (const wh of webhooks) {
        if (wh.event === event && wh.url) {
          fetch(wh.url, {
            method: wh.method || 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, tenantId, schemaId, data: payload })
          }).catch(err => console.error('Webhook failed:', wh.url, err.message));
        }
      }
    } catch (e) {
      console.error('Error triggering webhooks:', e);
    }
  }

  async executeScripts(tenantId: string, schemaId: string, event: string, data: any) {
    try {
      const page = await prisma.pageRegistry.findFirst({ where: { schemaId: schemaId, tenantId } });
      if (!page || !page.layout) return data;
      const layoutObj = typeof page.layout === 'string' ? JSON.parse(page.layout) : page.layout;
      const scripts = layoutObj?.settings?.scripts || [];

      let currentData = { ...data };

      for (const script of scripts) {
        if (script.event === event && script.code) {
          try {
            const context = { data: currentData, console };
            vm.createContext(context);
            const scriptRunner = new vm.Script(`
              (function() {
                ${script.code}
              })();
            `);
            scriptRunner.runInContext(context, { timeout: 1000 });
            currentData = context.data;
          } catch (err) {
            console.error('Script execution failed:', err);
          }
        }
      }
      return currentData;
    } catch (e) {
      console.error('Error executing scripts:', e);
      return data;
    }
  }

  async createCustomRecord(tenantId: string, schemaId: string, data: any, createdBy: string, userRoles: string[] = []) {
    const schema = await prisma.schemaRegistry.findFirst({ where: { id: schemaId, tenantId } });
    const fields = (schema?.fields as any[]) || [];

    let secureData = { ...data };
    fields.forEach(f => {
      if (f.writeRoles && typeof f.writeRoles === 'string') {
        const allowedRoles = f.writeRoles.split(',').map((r: string) => r.trim()).filter(Boolean);
        if (allowedRoles.length > 0 && !userRoles.some((ur: string) => allowedRoles.includes(ur))) {
          delete secureData[f.name]; // Strip unauthorized writes
        }
      }
    });

    secureData = await this.executeScripts(tenantId, schemaId, 'record.created', secureData);

    const record = await prisma.customRecord.create({
      data: { tenantId, schemaId, data: secureData, createdBy },
    });

    this.triggerWebhooks(tenantId, schemaId, 'record.created', record);
    return record;
  }

  async updateCustomRecord(tenantId: string, schemaId: string, id: string, data: any, userRoles: string[] = []) {
    const existing = await prisma.customRecord.findFirst({ where: { id, tenantId, schemaId } });
    if (!existing) throw new NotFoundException('Record not found');

    const schema = await prisma.schemaRegistry.findFirst({ where: { id: schemaId, tenantId } });
    const fields = (schema?.fields as any[]) || [];

    let secureData = { ...(existing.data as any), ...data };
    fields.forEach(f => {
      if (f.writeRoles && typeof f.writeRoles === 'string') {
        const allowedRoles = f.writeRoles.split(',').map((r: string) => r.trim()).filter(Boolean);
        if (allowedRoles.length > 0 && !userRoles.some((ur: string) => allowedRoles.includes(ur))) {
          // If they don't have write access, revert to existing value
          secureData[f.name] = (existing.data as any)[f.name];
        }
      }
    });

    secureData = await this.executeScripts(tenantId, schemaId, 'record.updated', secureData);

    const record = await prisma.customRecord.update({
      where: { id },
      data: { data: secureData },
    });

    this.triggerWebhooks(tenantId, schemaId, 'record.updated', record);
    return record;
  }

  async deleteCustomRecord(tenantId: string, schemaId: string, id: string) {
    const existing = await prisma.customRecord.findFirst({ where: { id, tenantId, schemaId } });
    if (!existing) throw new NotFoundException('Record not found');
    const record = await prisma.customRecord.delete({
      where: { id },
    });
    this.triggerWebhooks(tenantId, schemaId, 'record.deleted', record);
    return record;
  }

  // ---------------------------------------------------------------------------
  // WEBSITE BUILDER SETTINGS & TEMPLATES
  // ---------------------------------------------------------------------------
  async getWebSettings(tenantId: string) {
    let settings = await prisma.webSettings.findFirst({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.webSettings.create({ data: { tenantId } });
    }
    return settings;
  }

  async updateWebSettings(tenantId: string, data: any) {
    const settings = await this.getWebSettings(tenantId);
    return prisma.webSettings.update({
      where: { id: settings.id },
      data: {
        activeTemplateId: data.activeTemplateId !== undefined ? data.activeTemplateId : undefined,
        globalCss: data.globalCss !== undefined ? data.globalCss : undefined,
        themeTokens: data.themeTokens !== undefined ? data.themeTokens : undefined,
      }
    });
  }
}

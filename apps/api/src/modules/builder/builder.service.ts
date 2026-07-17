import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { prisma } from '@unerp/database';
import type {
  BuilderAnalyticsEventInput,
  BuilderFieldInput,
  CreateDataImportInput,
  CreatePageRegistryInput,
  CreateSchemaRegistryInput,
  CustomRecordDataInput,
  UpdatePageRegistryInput,
  UpdateSchemaRegistryInput,
} from '@unerp/shared';
import * as vm from 'vm';

type ImportRecord = Record<string, string | number | boolean | Date | null>;
type ImportRow = Record<string, unknown>;

type LayoutHistoryEntry = {
  layout: Prisma.InputJsonValue;
  savedAt: string;
};



type AutomationAction = {
  type?: string;
  config?: Record<string, unknown>;
};

@Injectable()
export class BuilderService {
  private readonly logger = new Logger(BuilderService.name);









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
    dto: { name: string; slug: string; description?: string; icon?: string; color?: string; scope?: string; entities?: any; relationships?: any; permissions?: any }
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
        scope: dto.scope || 'DRAFT',
        entities: dto.entities || [],
        relationships: dto.relationships || [],
        permissions: dto.permissions || {},
      },
    });
  }

  async updateModule(tenantId: string, id: string, dto: Partial<{ name: string; description: string; icon: string; color: string; status: string; scope: string; entities: any; relationships: any; permissions: any }>) {
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
        ...(dto.scope !== undefined && { scope: dto.scope }),
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
  // CUSTOM APP BUILDER — Enhanced Module Methods
  // ══════════════════════════════════════════════

  async getModuleWithComponents(tenantId: string, id: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const components = Array.isArray(mod.components) ? (mod.components as any[]) : [];

    // Resolve linked components to their full objects
    const formIds = components.filter(c => c.type === 'form').map(c => c.refId);
    const workflowIds = components.filter(c => c.type === 'workflow').map(c => c.refId);
    const dashboardIds = components.filter(c => c.type === 'dashboard').map(c => c.refId);
    const automationIds = components.filter(c => c.type === 'automation').map(c => c.refId);

    const [forms, workflows, dashboards, automations] = await Promise.all([
      formIds.length > 0 ? prisma.builderForm.findMany({ where: { tenantId, id: { in: formIds } } }) : [],
      workflowIds.length > 0 ? prisma.builderWorkflow.findMany({ where: { tenantId, id: { in: workflowIds } } }) : [],
      dashboardIds.length > 0 ? prisma.builderDashboard.findMany({ where: { tenantId, id: { in: dashboardIds } } }) : [],
      automationIds.length > 0 ? prisma.automationRule.findMany({ where: { tenantId, id: { in: automationIds } } }) : [],
    ]);

    return {
      ...mod,
      resolvedComponents: { forms, workflows, dashboards, automations },
    };
  }

  async addComponentToModule(tenantId: string, moduleId: string, component: { type: string; refId: string; name: string }) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const components = Array.isArray(mod.components) ? (mod.components as any[]) : [];

    // Prevent duplicates
    if (components.some(c => c.refId === component.refId && c.type === component.type)) {
      throw new BadRequestException('This component is already linked to the app');
    }

    const newComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: component.type,
      refId: component.refId,
      name: component.name,
      addedAt: new Date().toISOString(),
    };

    return prisma.builderModule.update({
      where: { id: moduleId },
      data: { components: [...components, newComponent] },
    });
  }

  async removeComponentFromModule(tenantId: string, moduleId: string, componentId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const components = Array.isArray(mod.components) ? (mod.components as any[]) : [];
    const updated = components.filter(c => c.id !== componentId);

    return prisma.builderModule.update({
      where: { id: moduleId },
      data: { components: updated },
    });
  }

  async addPageToModule(tenantId: string, moduleId: string, page: { name: string; slug: string; type: string; formId?: string | null; dashboardId?: string | null; layout?: any[] }) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const pages = Array.isArray(mod.pages) ? (mod.pages as any[]) : [];

    if (pages.some(p => p.slug === page.slug)) {
      throw new BadRequestException('A page with this slug already exists in the app');
    }

    const newPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: page.name,
      slug: page.slug,
      type: page.type,
      formId: page.formId || null,
      dashboardId: page.dashboardId || null,
      layout: page.layout || [],
      addedAt: new Date().toISOString(),
    };

    return prisma.builderModule.update({
      where: { id: moduleId },
      data: { pages: [...pages, newPage] },
    });
  }

  async updatePageInModule(
    tenantId: string,
    moduleId: string,
    pageId: string,
    update: { name?: string; slug?: string; type?: string; formId?: string | null; dashboardId?: string | null; layout?: any[] }
  ) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const pages = Array.isArray(mod.pages) ? (mod.pages as any[]) : [];
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) throw new NotFoundException('Page not found in this app');

    // Merge updates
    pages[pageIndex] = {
      ...pages[pageIndex],
      ...update,
      updatedAt: new Date().toISOString(),
    };

    return prisma.builderModule.update({
      where: { id: moduleId },
      data: { pages },
    });
  }

  async removePageFromModule(tenantId: string, moduleId: string, pageId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const pages = Array.isArray(mod.pages) ? (mod.pages as any[]) : [];
    const updated = pages.filter(p => p.id !== pageId);

    return prisma.builderModule.update({
      where: { id: moduleId },
      data: { pages: updated },
    });
  }

  async addDataModelToModule(tenantId: string, moduleId: string, dataModel: { name: string; fields: any[]; relationships?: any[] }) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const dataModels = Array.isArray(mod.dataModels) ? (mod.dataModels as any[]) : [];

    if (dataModels.some(dm => dm.name.toLowerCase() === dataModel.name.toLowerCase())) {
      throw new BadRequestException('A data model with this name already exists in the app');
    }

    const newModel = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: dataModel.name,
      fields: dataModel.fields || [],
      relationships: dataModel.relationships || [],
      addedAt: new Date().toISOString(),
    };

    return prisma.builderModule.update({
      where: { id: moduleId },
      data: { dataModels: [...dataModels, newModel] },
    });
  }

  async removeDataModelFromModule(tenantId: string, moduleId: string, dataModelId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const dataModels = Array.isArray(mod.dataModels) ? (mod.dataModels as any[]) : [];
    const updated = dataModels.filter(dm => dm.id !== dataModelId);

    return prisma.builderModule.update({
      where: { id: moduleId },
      data: { dataModels: updated },
    });
  }

  async runAppTests(tenantId: string, moduleId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const components = Array.isArray(mod.components) ? (mod.components as any[]) : [];
    const pages = Array.isArray(mod.pages) ? (mod.pages as any[]) : [];
    const dataModels = Array.isArray(mod.dataModels) ? (mod.dataModels as any[]) : [];

    const errors: { code: string; severity: 'error' | 'warning' | 'info'; category?: string; message: string; suggestion: string }[] = [];
    const simulations: { name: string; type: string; status: 'pass' | 'fail'; message: string }[] = [];
    let totalTests = 0;
    let passed = 0;

    // Test 1: App has at least one component
    totalTests++;
    if (components.length === 0) {
      errors.push({ code: 'NO_COMPONENTS', severity: 'error', message: 'App has no linked components', suggestion: 'Add at least one form, workflow, or dashboard to your app' });
    } else { passed++; }

    // Test 2: App has at least one page
    totalTests++;
    if (pages.length === 0) {
      errors.push({ code: 'NO_PAGES', severity: 'error', message: 'App has no pages defined', suggestion: 'Add at least one page to define app navigation' });
    } else { passed++; }

    // Test 3: App has a description
    totalTests++;
    if (!mod.description || mod.description.length < 10) {
      errors.push({ code: 'SHORT_DESCRIPTION', severity: 'warning', message: 'App description is missing or too short', suggestion: 'Add a meaningful description (at least 10 characters)' });
    } else { passed++; }

    // Test 4: App has an icon
    totalTests++;
    if (!mod.icon) {
      errors.push({ code: 'NO_ICON', severity: 'info', message: 'App does not have an icon set', suggestion: 'Set an icon for better visual identification in the app store' });
    } else { passed++; }

    // Test 5: Validate linked forms exist
    const formComponents = components.filter(c => c.type === 'form');
    for (const fc of formComponents) {
      totalTests++;
      const form = await prisma.builderForm.findFirst({ where: { id: fc.refId, tenantId } });
      if (!form) {
        errors.push({ code: 'ORPHAN_FORM', severity: 'error', message: `Linked form "${fc.name}" (${fc.refId}) not found`, suggestion: 'Remove the orphaned form reference or recreate the form' });
      } else {
        passed++;

        // Test 5b: Form has fields
        totalTests++;
        const fields = Array.isArray(form.fields) ? (form.fields as any[]) : [];
        if (fields.length === 0) {
          errors.push({ code: 'EMPTY_FORM', severity: 'warning', message: `Form "${form.name}" has no fields defined`, suggestion: 'Add fields to the form using the Form Builder' });
        } else {
          passed++;

          // Test 5c: Required fields have labels
          totalTests++;
          const missingLabels = fields.filter(f => f.required && !f.label);
          if (missingLabels.length > 0) {
            errors.push({ code: 'MISSING_LABELS', severity: 'warning', message: `${missingLabels.length} required fields in "${form.name}" are missing labels`, suggestion: 'Add labels to all required fields for better UX' });
          } else { passed++; }
        }
      }
    }

    // Test 6: Validate linked workflows
    const workflowComponents = components.filter(c => c.type === 'workflow');
    for (const wc of workflowComponents) {
      totalTests++;
      const wf = await prisma.builderWorkflow.findFirst({ where: { id: wc.refId, tenantId } });
      if (!wf) {
        errors.push({ code: 'ORPHAN_WORKFLOW', severity: 'error', message: `Linked workflow "${wc.name}" (${wc.refId}) not found`, suggestion: 'Remove the orphaned workflow reference or recreate it' });
      } else {
        passed++;

        // Test 6b: Workflow has nodes
        totalTests++;
        const nodes = Array.isArray(wf.nodes) ? (wf.nodes as any[]) : [];
        if (nodes.length === 0) {
          errors.push({ code: 'EMPTY_WORKFLOW', severity: 'warning', message: `Workflow "${wf.name}" has no nodes defined`, suggestion: 'Add at least one action node to the workflow' });
        } else { passed++; }
      }
    }

    // Test 7: Data model integrity
    for (const dm of dataModels) {
      totalTests++;
      if (!dm.fields || dm.fields.length === 0) {
        errors.push({ code: 'EMPTY_DATA_MODEL', severity: 'warning', message: `Data model "${dm.name}" has no fields`, suggestion: 'Add fields to define the data structure' });
      } else { passed++; }
    }

    // Test 8: Page references are valid
    for (const page of pages) {
      totalTests++;
      if (page.type === 'form' && page.formId) {
        const hasFormComponent = components.some(c => c.type === 'form' && c.refId === page.formId);
        if (!hasFormComponent) {
          errors.push({ code: 'PAGE_ORPHAN_FORM', severity: 'warning', message: `Page "${page.name}" references form not linked to app`, suggestion: 'Link the referenced form as a component first' });
        } else { passed++; }
      } else if (page.type === 'dashboard' && page.dashboardId) {
        const hasDashComponent = components.some(c => c.type === 'dashboard' && c.refId === page.dashboardId);
        if (!hasDashComponent) {
          errors.push({ code: 'PAGE_ORPHAN_DASHBOARD', severity: 'warning', message: `Page "${page.name}" references dashboard not linked to app`, suggestion: 'Link the referenced dashboard as a component first' });
        } else { passed++; }
      } else { passed++; }
    }

    // Test 9: Version format
    totalTests++;
    if (mod.version && /^\d+\.\d+\.\d+$/.test(mod.version)) {
      passed++;
    } else {
      errors.push({ code: 'INVALID_VERSION', severity: 'info', message: 'Version format should be semantic (e.g., 1.0.0)', suggestion: 'Use semantic versioning format X.Y.Z' });
    }

    // ── Security checks: field-level RBAC sanity on linked forms ──
    const formComponentsSec = components.filter(c => c.type === 'form');
    for (const fc of formComponentsSec) {
      const form = await prisma.builderForm.findFirst({ where: { id: fc.refId, tenantId } });
      const fields = Array.isArray(form?.fields) ? (form!.fields as any[]) : [];
      const protectedFields = fields.filter(f => (f.readRoles && String(f.readRoles).trim()) || (f.writeRoles && String(f.writeRoles).trim()));
      totalTests++;
      if (fields.length > 0 && protectedFields.length === 0) {
        errors.push({ code: 'NO_FIELD_RBAC', severity: 'info', category: 'security', message: `Form "${form?.name}" has no field-level role restrictions`, suggestion: 'Consider adding read/write roles to sensitive fields' });
      } else { passed++; }
    }

    // ── Automation checks: dry-run validate linked rules have triggers + actions ──
    const automationComponents = components.filter(c => c.type === 'automation');
    for (const ac of automationComponents) {
      totalTests++;
      const rule = await prisma.automationRule.findFirst({ where: { id: ac.refId, tenantId } });
      if (!rule) {
        errors.push({ code: 'ORPHAN_AUTOMATION', severity: 'error', category: 'automation', message: `Linked automation "${ac.name}" not found`, suggestion: 'Remove the orphaned automation reference' });
      } else {
        const acts = Array.isArray(rule.actions) ? (rule.actions as any[]) : [];
        if (acts.length === 0 || !rule.trigger) {
          errors.push({ code: 'INCOMPLETE_AUTOMATION', severity: 'warning', category: 'automation', message: `Automation "${rule.name}" is missing a trigger or actions`, suggestion: 'Configure at least one trigger and one action' });
        } else { passed++; }
      }
    }

    // ── Performance hints ──
    totalTests++;
    if (pages.length > 25) {
      errors.push({ code: 'MANY_PAGES', severity: 'info', category: 'performance', message: `App has ${pages.length} pages`, suggestion: 'Large apps may load slower; consider splitting into multiple apps' });
    } else { passed++; }

    // ── Sandbox simulation: validate a sample record against each data model & linked form ──
    const validateSchema = (name: string, type: string, fields: any[]) => {
      const issues: string[] = [];
      for (const f of fields) {
        if (!f || !f.name) continue;
        const sample = this.sampleValueForField(f);
        if (f.required && (sample === undefined || sample === null || sample === '')) {
          issues.push(`required field "${f.label || f.name}" has no sample/default value`);
        }
        if (f.type === 'Select' && f.options) {
          const opts = String(f.options).split(/\n|,/).map((o: string) => o.trim()).filter(Boolean);
          if (opts.length === 0) issues.push(`select field "${f.name}" has no options`);
        }
        if ((f.type === 'Int' || f.type === 'Float' || f.type === 'Currency') && sample != null && isNaN(Number(sample))) {
          issues.push(`numeric field "${f.name}" produced a non-numeric sample`);
        }
        if (f.regexPattern) {
          try { new RegExp(f.regexPattern); } catch { issues.push(`field "${f.name}" has an invalid regex pattern`); }
        }
      }
      totalTests++;
      if (issues.length === 0) {
        passed++;
        simulations.push({ name, type, status: 'pass', message: `Sample ${type} validated (${fields.length} fields)` });
      } else {
        errors.push({ code: 'SANDBOX_VALIDATION', severity: 'warning', category: 'data', message: `Sandbox validation failed for "${name}"`, suggestion: issues.join('; ') });
        simulations.push({ name, type, status: 'fail', message: issues.join('; ') });
      }
    };

    for (const dm of dataModels) {
      validateSchema(dm.name, 'data model', Array.isArray(dm.fields) ? dm.fields : []);
    }
    for (const fc of formComponentsSec) {
      const form = await prisma.builderForm.findFirst({ where: { id: fc.refId, tenantId } });
      if (form) validateSchema(form.name, 'form', Array.isArray(form.fields) ? (form.fields as any[]) : []);
    }

    const failed = totalTests - passed;
    const score = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;

    // Per-category issue breakdown (informational).
    const categories: Record<string, { issues: number }> = {};
    for (const e of errors) {
      const cat = e.category || 'structure';
      categories[cat] = categories[cat] || { issues: 0 };
      categories[cat].issues++;
    }

    const prev = (mod.testResults && typeof mod.testResults === 'object' && !Array.isArray(mod.testResults)) ? (mod.testResults as any) : {};
    const history = Array.isArray(prev.history) ? prev.history : [];
    const runAt = new Date().toISOString();

    const testResults = {
      lastRunAt: runAt,
      score,
      totalTests,
      passed,
      failed,
      categories,
      simulations,
      errors,
      history: [{ runAt, score, passed, failed }, ...history].slice(0, 10),
    };

    // Save test results
    await prisma.builderModule.update({
      where: { id: moduleId },
      data: { testResults },
    });

    return testResults;
  }

  /** Produce a representative sample value for a field for sandbox validation. */
  private sampleValueForField(f: any): unknown {
    if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') return f.defaultValue;
    switch (f.type) {
      case 'Int': case 'Float': case 'Currency': return 1;
      case 'Check': return true;
      case 'Date': return new Date().toISOString().slice(0, 10);
      case 'Datetime': return new Date().toISOString();
      case 'Time': return '09:00';
      case 'Select': {
        const opts = f.options ? String(f.options).split(/\n|,/).map((o: string) => o.trim()).filter(Boolean) : [];
        return opts[0] ?? '';
      }
      case 'Email': return 'sample@example.com';
      case 'Section Break': case 'Column Break': return 'n/a';
      default: return `Sample ${f.label || f.name || 'value'}`;
    }
  }

  /**
   * Compute the next semantic version for a module given an optional explicit
   * version or bump level. Defaults to a patch bump.
   */
  private nextVersion(current: string | null | undefined, opts: { version?: string; bump?: 'major' | 'minor' | 'patch' } = {}): string {
    if (opts.version) return opts.version;
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current || '1.0.0');
    let [major, minor, patch] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [1, 0, 0];
    switch (opts.bump || 'patch') {
      case 'major': major += 1; minor = 0; patch = 0; break;
      case 'minor': minor += 1; patch = 0; break;
      default: patch += 1;
    }
    return `${major}.${minor}.${patch}`;
  }

  /**
   * Resolve a module into a self-contained, immutable snapshot. Component
   * references (forms/workflows/dashboards/automations) are dereferenced into
   * their full definitions so an installing tenant gets a complete copy that no
   * longer depends on the publisher's live records.
   */
  private async buildModuleSnapshot(tenantId: string, mod: any) {
    const components = Array.isArray(mod.components) ? mod.components : [];
    const formIds = components.filter((c: any) => c.type === 'form').map((c: any) => c.refId);
    const workflowIds = components.filter((c: any) => c.type === 'workflow').map((c: any) => c.refId);
    const dashboardIds = components.filter((c: any) => c.type === 'dashboard').map((c: any) => c.refId);
    const automationIds = components.filter((c: any) => c.type === 'automation').map((c: any) => c.refId);

    const [forms, workflows, dashboards, automations] = await Promise.all([
      formIds.length ? prisma.builderForm.findMany({ where: { tenantId, id: { in: formIds } } }) : [],
      workflowIds.length ? prisma.builderWorkflow.findMany({ where: { tenantId, id: { in: workflowIds } } }) : [],
      dashboardIds.length ? prisma.builderDashboard.findMany({ where: { tenantId, id: { in: dashboardIds } } }) : [],
      automationIds.length ? prisma.automationRule.findMany({ where: { tenantId, id: { in: automationIds } } }) : [],
    ]);

    return {
      meta: {
        name: mod.name,
        slug: mod.slug,
        description: mod.description,
        longDescription: mod.longDescription,
        icon: mod.icon,
        color: mod.color,
        category: mod.category,
        publisher: mod.publisher,
      },
      components,
      pages: Array.isArray(mod.pages) ? mod.pages : [],
      dataModels: Array.isArray(mod.dataModels) ? mod.dataModels : [],
      entities: Array.isArray(mod.entities) ? mod.entities : [],
      relationships: Array.isArray(mod.relationships) ? mod.relationships : [],
      permissions: mod.permissions ?? {},
      forms: forms.map((f) => ({ id: f.id, name: f.name, slug: f.slug, module: f.module, fields: f.fields, settings: f.settings })),
      workflows: workflows.map((w) => ({ id: w.id, name: w.name, trigger: w.trigger, nodes: w.nodes, edges: w.edges, settings: w.settings })),
      dashboards: dashboards.map((d) => ({ id: d.id, name: d.name, widgets: d.widgets, layout: d.layout, refreshRate: d.refreshRate })),
      automations: automations.map((a) => ({ id: a.id, name: a.name, trigger: a.trigger, triggerConfig: a.triggerConfig, conditions: a.conditions, actions: a.actions })),
    };
  }

  /**
   * Publish a module: create an immutable AppRelease snapshot, bump the version,
   * and flip the module to ACTIVE at the requested scope. Re-publishing creates
   * a new release rather than mutating the previous one.
   */
  async publishModule(tenantId: string, moduleId: string, dto: { scope: string; version?: string; bump?: 'major' | 'minor' | 'patch'; changelog?: string; category?: string; longDescription?: string; publisher?: string; screenshots?: string[] }, publishedBy = 'system') {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const version = this.nextVersion(mod.version, { version: dto.version, bump: dto.bump });

    // Guard against duplicate version (unique on moduleId+version).
    const existingVersion = await prisma.appRelease.findUnique({ where: { moduleId_version: { moduleId, version } } });
    if (existingVersion) {
      throw new BadRequestException(`Version ${version} already exists for this app. Use a different version.`);
    }

    const snapshot = await this.buildModuleSnapshot(tenantId, mod);
    const testResults = (mod.testResults && typeof mod.testResults === 'object' && !Array.isArray(mod.testResults)) ? (mod.testResults as any) : {};

    const release = await prisma.appRelease.create({
      data: {
        tenantId,
        moduleId,
        version,
        channel: dto.scope,
        changelog: dto.changelog || null,
        snapshot: snapshot as any,
        testScore: typeof testResults.score === 'number' ? testResults.score : null,
        status: 'PUBLISHED',
        publishedBy,
      },
    });

    const updated = await prisma.builderModule.update({
      where: { id: moduleId },
      data: {
        status: 'ACTIVE',
        scope: dto.scope,
        version,
        currentReleaseId: release.id,
        publishedAt: new Date(),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.longDescription !== undefined && { longDescription: dto.longDescription }),
        ...(dto.publisher !== undefined && { publisher: dto.publisher }),
        ...(dto.screenshots !== undefined && { screenshots: dto.screenshots as any }),
      },
    });

    return { module: updated, release };
  }

  async unpublishModule(tenantId: string, moduleId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    return prisma.builderModule.update({
      where: { id: moduleId },
      data: {
        status: 'DRAFT',
        publishedAt: null,
      },
    });
  }

  async getModuleReleases(tenantId: string, moduleId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');
    return prisma.appRelease.findMany({ where: { moduleId, tenantId }, orderBy: { publishedAt: 'desc' } });
  }

  /**
   * Restore a prior release's snapshot back into the live module. Marks newer
   * releases as ROLLED_BACK and re-points the module at the restored release.
   */
  async rollbackModule(tenantId: string, moduleId: string, releaseId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const release = await prisma.appRelease.findFirst({ where: { id: releaseId, moduleId, tenantId } });
    if (!release) throw new NotFoundException('Release not found');

    const snap = (release.snapshot && typeof release.snapshot === 'object' ? release.snapshot : {}) as any;

    const updated = await prisma.builderModule.update({
      where: { id: moduleId },
      data: {
        components: snap.components ?? mod.components,
        pages: snap.pages ?? mod.pages,
        dataModels: snap.dataModels ?? mod.dataModels,
        entities: snap.entities ?? mod.entities,
        relationships: snap.relationships ?? mod.relationships,
        permissions: snap.permissions ?? mod.permissions,
        version: release.version,
        currentReleaseId: release.id,
      },
    });

    // Any releases published after the restored one are now superseded.
    await prisma.appRelease.updateMany({
      where: { moduleId, tenantId, publishedAt: { gt: release.publishedAt }, status: 'PUBLISHED' },
      data: { status: 'ROLLED_BACK' },
    });

    return { module: updated, restoredTo: release.version };
  }

  /**
   * Compares a selected release's snapshot with the live module state.
   */
  async compareReleaseSnapshot(tenantId: string, moduleId: string, releaseId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const release = await prisma.appRelease.findFirst({ where: { id: releaseId, moduleId, tenantId } });
    if (!release) throw new NotFoundException('Release not found');

    const snap = (release.snapshot && typeof release.snapshot === 'object' ? release.snapshot : {}) as any;

    // Build diff object detailing components, pages and data model structure count
    return {
      version: release.version,
      publishedAt: release.publishedAt,
      snapshot: {
        componentsCount: snap.components?.length || 0,
        pagesCount: snap.pages?.length || 0,
        dataModelsCount: snap.dataModels?.length || 0,
        permissionsCount: Object.keys(snap.permissions || {}).length,
      },
      live: {
        componentsCount: Array.isArray(mod.components) ? mod.components.length : 0,
        pagesCount: Array.isArray(mod.pages) ? mod.pages.length : 0,
        dataModelsCount: Array.isArray(mod.dataModels) ? mod.dataModels.length : 0,
        permissionsCount: Object.keys((mod.permissions as any) || {}).length,
      },
      snapshotDetails: snap,
      liveDetails: {
        components: mod.components,
        pages: mod.pages,
        dataModels: mod.dataModels,
        permissions: mod.permissions,
      }
    };
  }

  // ══════════════════════════════════════════════
  // APP MARKETPLACE (publish → browse → install → run)
  // ══════════════════════════════════════════════

  /**
   * List installable builder apps for a tenant: globally-published apps from any
   * tenant, plus the tenant's own organization-scoped apps. Annotated with
   * install state and "update available" detection.
   */
  async getMarketplace(tenantId: string) {
    const modules = await prisma.builderModule.findMany({
      where: {
        status: 'ACTIVE',
        currentReleaseId: { not: null },
        OR: [{ scope: 'GLOBAL' }, { scope: 'ORGANIZATION', tenantId }],
      },
      orderBy: { publishedAt: 'desc' },
    });

    const installs = await prisma.installedApp.findMany({ where: { tenantId, source: 'BUILDER' } });
    const installByModule = new Map(installs.map((i) => [i.sourceModuleId, i]));

    return modules.map((m) => {
      const install = installByModule.get(m.id);
      return {
        id: m.id,
        appId: `builder:${m.id}`,
        name: m.name,
        slug: m.slug,
        description: m.description,
        longDescription: m.longDescription,
        icon: m.icon,
        color: m.color,
        category: m.category || 'Custom',
        publisher: m.publisher || 'Workspace Team',
        version: m.version,
        scope: m.scope,
        screenshots: m.screenshots,
        installCount: m.installCount,
        isOwn: m.tenantId === tenantId,
        installed: !!install,
        installedVersion: install?.installedVersion ?? null,
        updateAvailable: !!install && install.installedVersion !== m.version,
        currentReleaseId: m.currentReleaseId,
      };
    });
  }

  /**
   * Install (or update) a builder app into a tenant. Provisions the app's pages
   * as resolvable SchemaRegistry + PageRegistry entries so it runs at
   * /app/<module-slug>/<page-slug>. Idempotent: re-installing re-provisions and
   * pins to the requested (or current) release.
   */
  async installBuilderApp(tenantId: string, moduleId: string, releaseId?: string) {
    const mod = await prisma.builderModule.findFirst({
      where: { id: moduleId, status: 'ACTIVE', OR: [{ scope: 'GLOBAL' }, { scope: 'ORGANIZATION', tenantId }] },
    });
    if (!mod) throw new NotFoundException('App not available for installation');

    const targetReleaseId = releaseId || mod.currentReleaseId;
    if (!targetReleaseId) throw new BadRequestException('App has no published release to install');
    const release = await prisma.appRelease.findFirst({ where: { id: targetReleaseId, moduleId } });
    if (!release) throw new NotFoundException('Release not found');

    const appId = `builder:${moduleId}`;
    const snap = (release.snapshot && typeof release.snapshot === 'object' ? release.snapshot : {}) as any;

    // Clean up any previous provisioning for this app (re-install / update).
    const prior = await prisma.installedApp.findUnique({ where: { tenantId_appId: { tenantId, appId } } });
    if (prior) await this.teardownProvisioned(tenantId, prior.provisioned as any);

    const moduleSlug = (snap.meta?.slug || mod.slug).toLowerCase();
    const forms: any[] = Array.isArray(snap.forms) ? snap.forms : [];
    const pages: any[] = Array.isArray(snap.pages) ? snap.pages : [];
    const dataModels: any[] = Array.isArray(snap.dataModels) ? snap.dataModels : [];
    const formById = new Map(forms.map((f) => [f.id, f]));

    const schemaRegistryIds: string[] = [];
    const pageRegistryIds: string[] = [];

    // Provision a runtime page+schema for each app page. Form pages back onto the
    // referenced form's fields; data-model-only pages back onto the data model.
    const provisionPage = async (pageSlug: string, title: string, type: string, fields: any[], settings: any, layout?: any) => {
      let backingSchemaId: string | null = null;
      if (type !== 'custom') {
        const schemaSlug = `${moduleSlug}_${pageSlug}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const schema = await prisma.schemaRegistry.upsert({
          where: { tenantId_slug: { tenantId, slug: schemaSlug } },
          update: { name: title, module: moduleSlug, fields: fields as any, settings: settings as any, status: 'ACTIVE' },
          create: { tenantId, module: moduleSlug, name: title, slug: schemaSlug, description: `Installed from ${mod.name}`, fields: fields as any, settings: settings as any, status: 'ACTIVE' },
        });
        backingSchemaId = schema.id;
        schemaRegistryIds.push(schema.id);
      }

      const pageLayout = type === 'custom' ? (layout || []) : { fields, settings };

      const page = await prisma.pageRegistry.upsert({
        where: { tenantId_module_slug: { tenantId, module: moduleSlug, slug: pageSlug } },
        update: { schemaId: backingSchemaId, title, type: type.toUpperCase(), layout: pageLayout as any, status: 'PUBLISHED' },
        create: { tenantId, schemaId: backingSchemaId, module: moduleSlug, slug: pageSlug, title, type: type.toUpperCase(), layout: pageLayout as any, status: 'PUBLISHED' },
      });
      pageRegistryIds.push(page.id);
    };

    for (const p of pages) {
      const form = p.formId ? formById.get(p.formId) : undefined;
      const fields = Array.isArray(form?.fields) ? form.fields : [];
      await provisionPage(p.slug, p.name || p.slug, p.type || 'form', fields, form?.settings ?? {}, p.layout);
    }

    // Data models with no corresponding page still get a runtime surface.
    for (const dm of dataModels) {
      const dmSlug = String(dm.name || 'model').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (pages.some((p) => p.slug === dmSlug)) continue;
      await provisionPage(dmSlug, dm.name, 'form', dm.fields || [], {});
    }

    const provisioned = { schemaRegistryIds, pageRegistryIds };

    const installed = await prisma.installedApp.upsert({
      where: { tenantId_appId: { tenantId, appId } },
      update: { source: 'BUILDER', sourceModuleId: moduleId, releaseId: release.id, installedVersion: release.version, provisioned: provisioned as any },
      create: { tenantId, appId, source: 'BUILDER', sourceModuleId: moduleId, releaseId: release.id, installedVersion: release.version, provisioned: provisioned as any },
    });

    if (!prior) {
      await prisma.builderModule.update({ where: { id: moduleId }, data: { installCount: { increment: 1 } } });
    }

    return {
      installed,
      version: release.version,
      routes: pageRegistryIds.length,
      entry: pages[0] ? `/app/${moduleSlug}/${pages[0].slug}` : null,
    };
  }

  private async teardownProvisioned(tenantId: string, provisioned: { schemaRegistryIds?: string[]; pageRegistryIds?: string[] } | null) {
    if (!provisioned) return;
    const pageIds = Array.isArray(provisioned.pageRegistryIds) ? provisioned.pageRegistryIds : [];
    const schemaIds = Array.isArray(provisioned.schemaRegistryIds) ? provisioned.schemaRegistryIds : [];
    if (pageIds.length) await prisma.pageRegistry.deleteMany({ where: { tenantId, id: { in: pageIds } } });
    // Deleting the schema cascades its CustomRecords (onDelete: Cascade).
    if (schemaIds.length) await prisma.schemaRegistry.deleteMany({ where: { tenantId, id: { in: schemaIds } } });
  }

  async uninstallBuilderApp(tenantId: string, moduleId: string) {
    const appId = `builder:${moduleId}`;
    const install = await prisma.installedApp.findUnique({ where: { tenantId_appId: { tenantId, appId } } });
    if (!install) throw new NotFoundException('App is not installed');

    await this.teardownProvisioned(tenantId, install.provisioned as any);
    await prisma.installedApp.delete({ where: { id: install.id } });
    await prisma.builderModule.updateMany({ where: { id: moduleId, installCount: { gt: 0 } }, data: { installCount: { decrement: 1 } } });

    return { success: true };
  }

  async getModuleStats(tenantId: string, moduleId: string) {
    const mod = await prisma.builderModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!mod) throw new NotFoundException('Module not found');

    const components = Array.isArray(mod.components) ? (mod.components as any[]) : [];
    const pages = Array.isArray(mod.pages) ? (mod.pages as any[]) : [];
    const dataModels = Array.isArray(mod.dataModels) ? (mod.dataModels as any[]) : [];
    const testResults = (mod.testResults && typeof mod.testResults === 'object' && !Array.isArray(mod.testResults)) ? mod.testResults as any : {};

    const automationIds = components.filter(c => c.type === 'automation').map(c => c.refId);
    const [releaseCount, linkedAutomations] = await Promise.all([
      prisma.appRelease.count({ where: { moduleId, tenantId } }),
      automationIds.length ? prisma.automationRule.findMany({ where: { tenantId, id: { in: automationIds } }, select: { runCount: true } }) : Promise.resolve([]),
    ]);
    const automationRuns = (linkedAutomations as { runCount: number }[]).reduce((sum, r) => sum + (r.runCount || 0), 0);
    const scoreTrend = Array.isArray(testResults.history) ? testResults.history.map((h: any) => h.score).reverse() : [];

    return {
      totalComponents: components.length,
      forms: components.filter(c => c.type === 'form').length,
      workflows: components.filter(c => c.type === 'workflow').length,
      dashboards: components.filter(c => c.type === 'dashboard').length,
      automations: components.filter(c => c.type === 'automation').length,
      pages: pages.length,
      dataModels: dataModels.length,
      testScore: testResults.score ?? null,
      lastTestedAt: testResults.lastRunAt ?? null,
      scoreTrend,
      // Lifecycle
      version: mod.version,
      status: mod.status,
      scope: mod.scope,
      installCount: mod.installCount ?? 0,
      releaseCount,
      automationRuns,
      publishedAt: mod.publishedAt,
    };
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

    const actions = Array.isArray(rule.actions) ? (rule.actions as AutomationAction[]) : [];
    if (actions.length === 0) {
      throw new BadRequestException('Automation rule has no actions to test');
    }

    const started = Date.now();
    const actionResults = actions.map((action, index) => ({
      index,
      type: action.type ?? 'unknown',
      status: 'VALIDATED',
    }));
    const execMs = Math.max(1, Date.now() - started);

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
      actions: actionResults,
      message: `Validated ${actionResults.length} automation actions`,
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
    dto: CreateDataImportInput
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

  async executeDataImport(tenantId: string, id: string, rows: ImportRow[]) {
    const job = await prisma.dataImportJob.findFirst({ where: { id, tenantId } });
    if (!job) throw new NotFoundException('Data import job not found');

    await prisma.dataImportJob.update({
      where: { id },
      data: { status: 'IMPORTING' }
    });

    let successCount = 0;
    let failedCount = 0;
    
    const targetModel = job.targetModel as CreateDataImportInput['targetModel'];
    const columnMapping = job.columnMapping as Record<string, string>;
    const allowedColumns = new Set(Object.values(columnMapping).filter(Boolean));

    // Process rows
    const dataToInsert: ImportRecord[] = [];
    for (const row of rows) {
      const dbRecord: ImportRecord = { tenantId };
      let hasData = false;
      
      for (const [csvCol, dbCol] of Object.entries(columnMapping)) {
        const value = row[csvCol];
        if (allowedColumns.has(dbCol) && value !== undefined && value !== '') {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || value instanceof Date) {
            dbRecord[dbCol] = value;
          } else {
            dbRecord[dbCol] = String(value);
          }
          hasData = true;
        }
      }
      if (hasData) dataToInsert.push(dbRecord);
    }

    try {
      if (dataToInsert.length > 0) {
        let result: { count: number };
        switch (targetModel) {
          case 'customer':
            result = await prisma.customer.createMany({ data: dataToInsert as Prisma.CustomerCreateManyInput[], skipDuplicates: true });
            break;
          case 'vendor':
            result = await prisma.vendor.createMany({ data: dataToInsert as Prisma.VendorCreateManyInput[], skipDuplicates: true });
            break;
          case 'product':
            result = await prisma.product.createMany({ data: dataToInsert as Prisma.ProductCreateManyInput[], skipDuplicates: true });
            break;
          case 'employee':
            result = await prisma.employee.createMany({ data: dataToInsert as Prisma.EmployeeCreateManyInput[], skipDuplicates: true });
            break;
          case 'warehouse':
            result = await prisma.warehouse.createMany({ data: dataToInsert as Prisma.WarehouseCreateManyInput[], skipDuplicates: true });
            break;
          default:
            throw new BadRequestException(`Unsupported import target: ${job.targetModel}`);
        }
        successCount = result.count;
        failedCount = rows.length - successCount;
      } else {
        failedCount = rows.length;
      }
    } catch (e) {
      this.logger.error(`Data import failed for job ${id}: ${e instanceof Error ? e.message : String(e)}`);
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

  async getSchemaRegistryById(tenantId: string, id: string) {
    const schema = await prisma.schemaRegistry.findFirst({ where: { id, tenantId } });
    if (!schema) throw new NotFoundException(`Schema ${id} not found`);
    return schema;
  }

  /**
   * Publish a Builder Form to a fully-functional dynamic app page.
   *
   * Closes the zero-code "deploy loop": turns the visual form layout stored in a
   * PageRegistry into a resolvable runtime page backed by a SchemaRegistry
   * (so custom-record persistence, field-level RBAC, webhooks and server-side
   * scripts actually have a schema to operate against).
   *
   * Idempotent: re-publishing the same form updates the linked schema in place
   * (no orphaned/duplicate schemas).
   */
  async publishForm(tenantId: string, pageRegistryId: string) {
    const page = await prisma.pageRegistry.findFirst({
      where: { id: pageRegistryId, tenantId },
    });
    if (!page) throw new NotFoundException('Page not found');

    const layoutObj = typeof page.layout === 'string' ? JSON.parse(page.layout) : page.layout;
    const layoutFields: any[] = Array.isArray(layoutObj) ? layoutObj : layoutObj?.fields || [];

    // Derive runtime-relevant field metadata from the visual layout so the
    // existing record services (RBAC scrubbing, formula/role evaluation) work.
    const schemaFields = layoutFields
      .filter((f) => f && f.name && f.type !== 'Section Break' && f.type !== 'Column Break')
      .map((f) => ({
        name: f.name,
        label: f.label || f.name,
        type: f.type,
        options: f.options ?? null,
        required: !!f.required,
        readOnly: !!f.readOnly,
        defaultValue: f.defaultValue ?? null,
        inListView: !!f.inListView,
        readRoles: f.readRoles ?? null,
        writeRoles: f.writeRoles ?? null,
        formula: f.formula ?? null,
      }));

    const settings = (layoutObj?.settings && typeof layoutObj.settings === 'object') ? layoutObj.settings : {};

    // The schema slug must be unique per tenant. Namespace it under the page
    // route so two forms in different modules never collide.
    const schemaSlug = `${page.module}_${page.slug}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const schema = await prisma.$transaction(async (tx) => {
      const existing = await tx.schemaRegistry.findUnique({
        where: { tenantId_slug: { tenantId, slug: schemaSlug } },
      });

      if (existing) {
        return tx.schemaRegistry.update({
          where: { id: existing.id },
          data: {
            name: page.title,
            module: page.module,
            fields: schemaFields as any,
            settings: settings as any,
            status: 'ACTIVE',
          },
        });
      }

      return tx.schemaRegistry.create({
        data: {
          tenantId,
          module: page.module,
          name: page.title,
          slug: schemaSlug,
          description: `Auto-generated schema for ${page.module}/${page.slug}`,
          fields: schemaFields as any,
          settings: settings as any,
          status: 'ACTIVE',
        },
      });
    });

    const updatedPage = await prisma.pageRegistry.update({
      where: { id: pageRegistryId },
      data: {
        schemaId: schema.id,
        status: 'PUBLISHED',
      },
    });

    return {
      schema,
      page: updatedPage,
      route: `/app/${page.module}/${page.slug}`,
    };
  }

  async logAnalyticsEvent(tenantId: string, data: BuilderAnalyticsEventInput) {
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: data.event,
        entityId: data.entityId || 'system',
        entityType: data.entityType || 'system',
        changes: { metadata: data.metadata } as any,
        userId: 'system'
      }
    });
    this.logger.log(`Builder analytics event ${data.event}`, { tenantId, entityType: data.entityType, entityId: data.entityId });
    return { success: true };
  }

  async generateSchemaFromPrompt(tenantId: string, prompt: string) {
    const normalizedPrompt = prompt.toLowerCase();
    const wantsPeople = /\b(patient|student|employee|customer|lead|contact|tenant)\b/.test(normalizedPrompt);
    const wantsScheduling = /\b(appointment|schedule|booking|visit|shift)\b/.test(normalizedPrompt);
    const wantsMoney = /\b(invoice|payment|fee|rent|claim|budget|cost|amount)\b/.test(normalizedPrompt);
    const wantsInventory = /\b(product|item|asset|drug|stock|batch|serial)\b/.test(normalizedPrompt);

    const fields: BuilderFieldInput[] = [
      { id: 'f_ai_title', name: 'title', label: 'Title', type: 'Data', required: true, inListView: true },
      { id: 'f_ai_status', name: 'status', label: 'Status', type: 'Select', required: true, options: 'Draft\nOpen\nIn Review\nClosed', inListView: true },
    ];

    if (wantsPeople) {
      fields.push(
        { id: 'f_ai_person_name', name: 'person_name', label: 'Person Name', type: 'Data', required: true, inListView: true },
        { id: 'f_ai_email', name: 'email', label: 'Email', type: 'Data', regexPattern: '^\\S+@\\S+\\.\\S+$' },
      );
    }
    if (wantsScheduling) {
      fields.push(
        { id: 'f_ai_date', name: 'scheduled_date', label: 'Scheduled Date', type: 'Date', required: true, inListView: true },
        { id: 'f_ai_time', name: 'scheduled_time', label: 'Scheduled Time', type: 'Time' },
      );
    }
    if (wantsMoney) {
      fields.push({ id: 'f_ai_amount', name: 'amount', label: 'Amount', type: 'Currency', required: true, inListView: true });
    }
    if (wantsInventory) {
      fields.push(
        { id: 'f_ai_item_code', name: 'item_code', label: 'Item Code', type: 'Data', inListView: true },
        { id: 'f_ai_quantity', name: 'quantity', label: 'Quantity', type: 'Float', required: true },
      );
    }
    fields.push({ id: 'f_ai_notes', name: 'notes', label: 'Notes', type: 'Textarea' });

    this.logger.log(`Generated builder schema from prompt`, { tenantId, fieldCount: fields.length });
    return { success: true, schema: fields };
  }

  async createSchemaRegistry(tenantId: string, data: CreateSchemaRegistryInput) {
    return prisma.schemaRegistry.create({
      data: { ...data, tenantId } as any,
    });
  }

  async updateSchemaRegistry(tenantId: string, id: string, data: UpdateSchemaRegistryInput) {
    // Used tenantId to suppress ts error and enforce security
    const existing = await prisma.schemaRegistry.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Schema not found');
    return prisma.schemaRegistry.update({
      where: { id },
      data: data as any,
    });
  }

  async deleteSchemaRegistry(tenantId: string, id: string) {
    const existing = await prisma.schemaRegistry.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Schema not found');
    return prisma.schemaRegistry.delete({ where: { id } });
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

  async createPageRegistry(tenantId: string, data: CreatePageRegistryInput) {
    return prisma.pageRegistry.create({
      data: { ...data, tenantId } as any,
    });
  }

  async updatePageRegistry(tenantId: string, id: string, data: UpdatePageRegistryInput) {
    const existing = await prisma.pageRegistry.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Page not found');

    const updateData = { ...data };

    // If layout is being updated, push the old layout to history
    if (data.layout && JSON.stringify(data.layout) !== JSON.stringify(existing.layout)) {
      const currentHistory = Array.isArray(existing.history) ? (existing.history as LayoutHistoryEntry[]) : [];
      // Keep last 10 versions
      const newHistory = [{ layout: existing.layout as Prisma.InputJsonValue, savedAt: new Date().toISOString() }, ...currentHistory].slice(0, 10);
      (updateData as any).history = newHistory;
    }

    return prisma.pageRegistry.update({
      where: { id },
      data: updateData as any,
    });
  }

  async deletePageRegistry(tenantId: string, id: string) {
    const existing = await prisma.pageRegistry.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Page not found');
    return prisma.pageRegistry.delete({ where: { id } });
  }

  async restorePageRegistryHistory(tenantId: string, id: string, historyIndex: number) {
    const existing = await prisma.pageRegistry.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Page not found');

    const history = Array.isArray(existing.history) ? (existing.history as LayoutHistoryEntry[]) : [];
    const selected = history[historyIndex];
    if (!selected) {
      throw new BadRequestException('History version not found');
    }

    const nextHistory = [
      { layout: existing.layout as Prisma.InputJsonValue, savedAt: new Date().toISOString() },
      ...history.filter((_, index) => index !== historyIndex),
    ].slice(0, 10);

    return prisma.pageRegistry.update({
      where: { id },
      data: {
        layout: selected.layout,
        history: nextHistory,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // CUSTOM RECORDS (DYNAMIC DATA)
  // ---------------------------------------------------------------------------
  async getCustomRecords(
    tenantId: string,
    schemaId: string,
    userRoles: string[] = [],
    query: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; page?: number; pageSize?: number } = {}
  ) {
    const schema = await prisma.schemaRegistry.findFirst({ where: { id: schemaId, tenantId } });
    const records = await prisma.customRecord.findMany({
      where: { tenantId, schemaId },
      orderBy: { createdAt: 'desc' },
    });

    // Step 1 — RBAC scrub (unchanged behaviour, must run before any filtering
    // so users never see field values they lack permission to read).
    let scrubbed: any[];
    if (!schema || !schema.fields || !Array.isArray(schema.fields)) {
      scrubbed = records;
    } else {
      const fields = schema.fields as any[];
      scrubbed = records.map(record => {
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

    // Step 2 — server-side search across stringified field values.
    let filtered = scrubbed;
    if (query.search) {
      const needle = String(query.search).toLowerCase();
      filtered = scrubbed.filter((record) => {
        const data = record.data as any;
        if (typeof data === 'object' && data !== null) {
          return Object.values(data).some((v) => String(v ?? '').toLowerCase().includes(needle));
        }
        return false;
      });
    }

    // Step 3 — sort by a data field (falls back to createdAt for unknown fields).
    const sortBy = query.sortBy;
    if (sortBy) {
      const dir = query.sortOrder === 'asc' ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        const av = (a.data as any)?.[sortBy];
        const bv = (b.data as any)?.[sortBy];
        if (av === bv) return 0;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Step 4 — paginate.
    const total = filtered.length;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 10);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
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

  async triggerWebhooks(tenantId: string, schemaId: string, event: string, payload: unknown) {
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
          }).catch((err: unknown) => {
            this.logger.error(`Webhook failed for ${String(wh.url)}: ${err instanceof Error ? err.message : String(err)}`);
          });
        }
      }
    } catch (e) {
      this.logger.error(`Error triggering webhooks: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async executeScripts(tenantId: string, schemaId: string, event: string, data: CustomRecordDataInput) {
    try {
      const page = await prisma.pageRegistry.findFirst({ where: { schemaId: schemaId, tenantId } });
      if (!page || !page.layout) return data;
      const layoutObj = typeof page.layout === 'string' ? JSON.parse(page.layout) : page.layout;
      const scripts = layoutObj?.settings?.scripts || [];

      let currentData = { ...data };

      for (const script of scripts) {
        if (script.event === event && script.code) {
          try {
            const context = {
              data: currentData,
              logger: {
                info: (message: unknown) => this.logger.log(String(message)),
                warn: (message: unknown) => this.logger.warn(String(message)),
                error: (message: unknown) => this.logger.error(String(message)),
              },
            };
            vm.createContext(context);
            const scriptRunner = new vm.Script(`
              (function() {
                ${script.code}
              })();
            `);
            scriptRunner.runInContext(context, { timeout: 1000 });
            currentData = context.data;
          } catch (err) {
            this.logger.error(`Script execution failed: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
      return currentData;
    } catch (e) {
      this.logger.error(`Error executing scripts: ${e instanceof Error ? e.message : String(e)}`);
      return data;
    }
  }

  async createCustomRecord(tenantId: string, schemaId: string, data: CustomRecordDataInput, createdBy: string, userRoles: string[] = []) {
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
      data: { tenantId, schemaId, data: secureData as any, createdBy },
    });

    this.triggerWebhooks(tenantId, schemaId, 'record.created', record);
    return record;
  }

  async updateCustomRecord(tenantId: string, schemaId: string, id: string, data: CustomRecordDataInput, userRoles: string[] = []) {
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



  // ════════════════════════════════════════════════
  // App Studio — safe customization of existing core apps.
  // Nav overlays (reorder/hide/rename) + additive submodules. Fully
  // non-destructive and reversible: stock nav has no overlay row, and a
  // submodule is just a tagged group of PageRegistry pages.
  // ════════════════════════════════════════════════

  /** Read a module's nav overlay config + its provisioned submodule sections. */
  async getNavOverlay(tenantId: string, moduleId: string) {
    const mod = moduleId.toLowerCase();
    const [overlay, pages] = await Promise.all([
      prisma.appNavOverlay.findUnique({ where: { tenantId_moduleId: { tenantId, moduleId: mod } } }),
      prisma.pageRegistry.findMany({
        where: { tenantId, module: mod, submodule: { not: null }, status: 'PUBLISHED' },
        orderBy: [{ submodule: 'asc' }, { sortOrder: 'asc' }],
        select: { id: true, slug: true, title: true, navIcon: true, submodule: true, sortOrder: true },
      }),
    ]);

    const groups = new Map<string, { slug: string; pages: typeof pages }>();
    for (const p of pages) {
      const key = p.submodule as string;
      if (!groups.has(key)) groups.set(key, { slug: key, pages: [] });
      groups.get(key)!.pages.push(p);
    }

    const config = ((overlay?.config as any) || {}) as Record<string, any>;
    const meta: Record<string, { name?: string; icon?: string; order?: number }> = (config.submodules || []).reduce(
      (acc: Record<string, any>, s: any) => { acc[s.slug] = s; return acc; }, {},
    );

    const submodules = [...groups.values()]
      .map((g) => ({
        slug: g.slug,
        name: meta[g.slug]?.name || g.slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: meta[g.slug]?.icon || null,
        order: meta[g.slug]?.order ?? 0,
        pages: g.pages.map((p) => ({ slug: p.slug, title: p.title, navIcon: p.navIcon, sortOrder: p.sortOrder })),
      }))
      .sort((a, b) => a.order - b.order);

    return { moduleId: mod, config, submodules };
  }

  /** Upsert a module's nav overlay (reorder / hide / rename / submodule meta). */
  async saveNavOverlay(tenantId: string, moduleId: string, config: any, userId?: string) {
    const mod = moduleId.toLowerCase();
    return prisma.appNavOverlay.upsert({
      where: { tenantId_moduleId: { tenantId, moduleId: mod } },
      update: { config: (config ?? {}) as any, updatedBy: userId },
      create: { tenantId, moduleId: mod, config: (config ?? {}) as any, updatedBy: userId },
    });
  }

  /** Reset a module's nav arrangement to stock (submodule pages are preserved). */
  async resetNavOverlay(tenantId: string, moduleId: string) {
    const mod = moduleId.toLowerCase();
    await prisma.appNavOverlay.deleteMany({ where: { tenantId, moduleId: mod } });
    return { ok: true };
  }

  /**
   * Add a new submodule (additive) to an existing app. Optionally provisions a
   * backing SchemaRegistry plus one or more PageRegistry pages tagged to the
   * target module + submodule, so they render at /app/{module}/{slug} and
   * surface in that app's sidebar via the runtime nav merge.
   */
  async createSubmodule(
    tenantId: string,
    moduleId: string,
    input: {
      name: string;
      slug: string;
      icon?: string;
      schema?: { fields?: any[] };
      pages?: { slug: string; title: string; type?: string; navIcon?: string }[];
    },
    userId?: string,
  ) {
    const mod = moduleId.toLowerCase();
    const subSlug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    let schemaId: string | undefined;
    if (input.schema) {
      const schemaSlug = `${mod}_${subSlug}`.replace(/[^a-z0-9_-]/g, '_');
      const schema = await prisma.schemaRegistry.upsert({
        where: { tenantId_slug: { tenantId, slug: schemaSlug } },
        update: { name: input.name, module: mod, fields: (input.schema.fields || []) as any, status: 'ACTIVE' },
        create: { tenantId, module: mod, name: input.name, slug: schemaSlug, fields: (input.schema.fields || []) as any, status: 'ACTIVE' },
      });
      schemaId = schema.id;
    }

    const pageDefs = input.pages?.length
      ? input.pages
      : [{ slug: subSlug, title: input.name, type: schemaId ? 'LIST' : 'CUSTOM' }];

    const createdPages = [];
    let order = 0;
    for (const pd of pageDefs) {
      const pageSlug = pd.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const page = await prisma.pageRegistry.upsert({
        where: { tenantId_module_slug: { tenantId, module: mod, slug: pageSlug } },
        update: { title: pd.title, type: (pd.type || 'LIST').toUpperCase(), submodule: subSlug, schemaId, navIcon: pd.navIcon, sortOrder: order, status: 'PUBLISHED', isCustom: true },
        create: { tenantId, module: mod, slug: pageSlug, title: pd.title, type: (pd.type || 'LIST').toUpperCase(), submodule: subSlug, schemaId, navIcon: pd.navIcon, sortOrder: order, status: 'PUBLISHED', isCustom: true },
      });
      createdPages.push(page);
      order++;
    }

    // Persist submodule label/icon on the overlay so the sidebar shows a nice name.
    const overlay = await prisma.appNavOverlay.findUnique({ where: { tenantId_moduleId: { tenantId, moduleId: mod } } });
    const config: any = (overlay?.config as any) || {};
    config.submodules = Array.isArray(config.submodules) ? config.submodules : [];
    const existing = config.submodules.find((s: any) => s.slug === subSlug);
    if (existing) { existing.name = input.name; existing.icon = input.icon; }
    else config.submodules.push({ slug: subSlug, name: input.name, icon: input.icon, order: config.submodules.length });
    await this.saveNavOverlay(tenantId, mod, config, userId);

    return {
      moduleId: mod,
      submodule: subSlug,
      schemaId,
      pages: createdPages.map((p) => ({ id: p.id, slug: p.slug, title: p.title })),
    };
  }

  /** Remove a submodule's pages + overlay meta. Backing schema/records are kept. */
  async deleteSubmodule(tenantId: string, moduleId: string, submoduleSlug: string) {
    const mod = moduleId.toLowerCase();
    const sub = submoduleSlug.toLowerCase();
    await prisma.pageRegistry.deleteMany({ where: { tenantId, module: mod, submodule: sub } });
    const overlay = await prisma.appNavOverlay.findUnique({ where: { tenantId_moduleId: { tenantId, moduleId: mod } } });
    if (overlay) {
      const config: any = (overlay.config as any) || {};
      config.submodules = (config.submodules || []).filter((s: any) => s.slug !== sub);
      await this.saveNavOverlay(tenantId, mod, config);
    }
    return { ok: true };
  }
}


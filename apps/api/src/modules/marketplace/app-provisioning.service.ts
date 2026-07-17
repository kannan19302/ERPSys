import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { AppManifest } from './manifest';

export interface ModuleMapEntry {
  name: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  roles?: string[];
  pages: { slug: string; title: string; type: string }[];
}

export interface ProvisionResult {
  schemaRegistryIds: string[];
  pageRegistryIds: string[];
  automationRuleIds: string[];
  entry: string | null; // first page route
  /** moduleSlug → metadata + its pages, for the in-app admin console / nav. */
  moduleMap: Record<string, ModuleMapEntry>;
}

/**
 * Provisions a declarative app manifest into the dynamic runtime so it resolves at
 * /app/<appSlug>/<page-slug> via PageRegistry/SchemaRegistry, and tears it back down.
 *
 * This generalizes the proven builder install path (builder.service installBuilderApp /
 * teardownProvisioned) so marketplace bundles and builder apps share one code path.
 */
@Injectable()
export class AppProvisioningService {
  async provision(tenantId: string, manifest: AppManifest, sourceLabel: string): Promise<ProvisionResult> {
    const moduleSlug = manifest.slug.toLowerCase();
    // When the bundle extends an existing app, its pages live under that app's
    // module and are grouped as submodule sections rather than a new shell.
    const targetApp = manifest.targetApp?.toLowerCase();
    const pageModule = targetApp || moduleSlug;
    const schemaRegistryIds: string[] = [];
    const pageRegistryIds: string[] = [];
    const automationRuleIds: string[] = [];

    // Map a manifest schema slug → its provisioned SchemaRegistry row.
    const schemaIdBySlug = new Map<string, string>();
    for (const s of manifest.schemas || []) {
      // Keep hyphens so the clean slug (used by metrics/tables/FHIR lookups) round-trips.
      const schemaSlug = `${moduleSlug}_${s.slug}`.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const schema = await prisma.schemaRegistry.upsert({
        where: { tenantId_slug: { tenantId, slug: schemaSlug } },
        update: { name: s.name, module: moduleSlug, fields: (s.fields || []) as any, settings: (s.settings || {}) as any, status: 'ACTIVE' },
        create: { tenantId, module: moduleSlug, name: s.name, slug: schemaSlug, description: s.description || `Installed from ${sourceLabel}`, fields: (s.fields || []) as any, settings: (s.settings || {}) as any, status: 'ACTIVE' },
      });
      schemaIdBySlug.set(s.slug, schema.id);
      schemaRegistryIds.push(schema.id);

      // Seed sample data once — only if the schema currently has no records.
      if (Array.isArray(s.sampleData) && s.sampleData.length) {
        const existing = await prisma.customRecord.count({ where: { tenantId, schemaId: schema.id } });
        if (existing === 0) {
          await prisma.customRecord.createMany({
            data: s.sampleData.map((data) => ({ tenantId, schemaId: schema.id, data: data as any, createdBy: 'system' })),
          });
        }
      }
    }

    // Build the module map (industry-app sub-modules → their pages).
    const moduleMap: Record<string, ModuleMapEntry> = {};
    for (const m of manifest.modules || []) {
      moduleMap[m.slug] = { name: m.name, description: m.description, icon: m.icon, enabled: m.enabledByDefault !== false, roles: m.roles || [], pages: [] };
    }

    for (const p of manifest.pages || []) {
      const backingSchemaId = p.schema ? schemaIdBySlug.get(p.schema) || null : null;
      const backingSchema = (manifest.schemas || []).find((s) => s.slug === p.schema);
      const fields = backingSchema?.fields || [];
      const settings = backingSchema?.settings || {};
      const type = (p.type || 'form');
      // `custom` keeps its widget array; `remote` keeps its { dataUrl, columns }
      // object (data lives in the app's service); others store the backing schema.
      const pageLayout = type === 'custom' ? (p.layout || [])
        : type === 'remote' ? (p.layout || {})
        : { fields, settings };

      // For an app extension, tag each page with its submodule group so the
      // host app's sidebar can render it under a labelled section.
      const submodule = targetApp ? (p.module || moduleSlug) : undefined;

      const page = await prisma.pageRegistry.upsert({
        where: { tenantId_module_slug: { tenantId, module: pageModule, slug: p.slug } },
        update: { schemaId: backingSchemaId, title: p.title, type: type.toUpperCase(), layout: pageLayout as any, status: 'PUBLISHED', submodule },
        create: { tenantId, schemaId: backingSchemaId, module: pageModule, slug: p.slug, title: p.title, type: type.toUpperCase(), layout: pageLayout as any, status: 'PUBLISHED', submodule },
      });
      pageRegistryIds.push(page.id);
      const mod = p.module ? moduleMap[p.module] : undefined;
      if (mod) mod.pages.push({ slug: p.slug, title: p.title, type: type.toUpperCase() });
    }

    // Record submodule labels on the host app's nav overlay so the extension's
    // sections show friendly names in the sidebar.
    if (targetApp && (manifest.modules || []).length) {
      const overlay = await prisma.appNavOverlay.findUnique({ where: { tenantId_moduleId: { tenantId, moduleId: targetApp } } });
      const config: any = (overlay?.config as any) || {};
      config.submodules = Array.isArray(config.submodules) ? config.submodules : [];
      for (const m of manifest.modules || []) {
        if (!config.submodules.find((s: any) => s.slug === m.slug)) {
          config.submodules.push({ slug: m.slug, name: m.name, icon: m.icon, order: config.submodules.length });
        }
      }
      await prisma.appNavOverlay.upsert({
        where: { tenantId_moduleId: { tenantId, moduleId: targetApp } },
        update: { config: config as any },
        create: { tenantId, moduleId: targetApp, config: config as any },
      });
    }

    for (const a of manifest.automations || []) {
      const rule = await prisma.automationRule.create({
        data: {
          tenantId,
          name: a.name,
          description: `Installed from ${sourceLabel}`,
          trigger: (a.trigger?.type || a.trigger?.event || 'record.created') as string,
          triggerConfig: (a.trigger || {}) as any,
          conditions: [] as any,
          actions: (a.actions || []) as any,
          status: a.enabled === false ? 'PAUSED' : 'ACTIVE',
        },
      });
      automationRuleIds.push(rule.id);
    }

    const firstPage = (manifest.pages || [])[0];
    return {
      schemaRegistryIds,
      pageRegistryIds,
      automationRuleIds,
      entry: firstPage ? `/app/${pageModule}/${firstPage.slug}` : null,
      moduleMap,
    };
  }

  /** Remove all DB rows provisioned for an app. Mirrors builder teardownProvisioned. */
  async teardown(
    tenantId: string,
    provisioned: { schemaRegistryIds?: string[]; pageRegistryIds?: string[]; automationRuleIds?: string[] } | null,
  ): Promise<void> {
    if (!provisioned) return;
    const pageIds = Array.isArray(provisioned.pageRegistryIds) ? provisioned.pageRegistryIds : [];
    const schemaIds = Array.isArray(provisioned.schemaRegistryIds) ? provisioned.schemaRegistryIds : [];
    const ruleIds = Array.isArray(provisioned.automationRuleIds) ? provisioned.automationRuleIds : [];
    if (ruleIds.length) await prisma.automationRule.deleteMany({ where: { tenantId, id: { in: ruleIds } } });
    if (pageIds.length) await prisma.pageRegistry.deleteMany({ where: { tenantId, id: { in: pageIds } } });
    // Deleting the schema cascades its CustomRecords (onDelete: Cascade).
    if (schemaIds.length) await prisma.schemaRegistry.deleteMany({ where: { tenantId, id: { in: schemaIds } } });
  }
}

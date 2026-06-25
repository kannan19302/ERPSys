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
      const pageLayout = type === 'custom' ? (p.layout || []) : { fields, settings };

      const page = await prisma.pageRegistry.upsert({
        where: { tenantId_module_slug: { tenantId, module: moduleSlug, slug: p.slug } },
        update: { schemaId: backingSchemaId, title: p.title, type: type.toUpperCase(), layout: pageLayout as any, status: 'PUBLISHED' },
        create: { tenantId, schemaId: backingSchemaId, module: moduleSlug, slug: p.slug, title: p.title, type: type.toUpperCase(), layout: pageLayout as any, status: 'PUBLISHED' },
      });
      pageRegistryIds.push(page.id);
      const mod = p.module ? moduleMap[p.module] : undefined;
      if (mod) mod.pages.push({ slug: p.slug, title: p.title, type: type.toUpperCase() });
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
      entry: firstPage ? `/app/${moduleSlug}/${firstPage.slug}` : null,
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

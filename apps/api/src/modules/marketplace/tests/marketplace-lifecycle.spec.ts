import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import { prisma } from '@unerp/database';
import { BundleStoreService } from '../bundle-store.service';
import { AppProvisioningService } from '../app-provisioning.service';
import { VendorService } from '../vendor.service';
import { MarketplaceService } from '../../admin/marketplace.service';
import { validateManifest } from '../manifest';
import { ServiceRegistryService } from '../../ext-gateway/service-registry.service';
import { ExtProxyService } from '../../ext-gateway/ext-proxy.service';
import { CircuitBreakerService } from '../../ext-gateway/circuit-breaker.service';

/**
 * End-to-end proof of the bundle lifecycle: publishing a third-party bundle, then
 * installing it (real files extracted + runtime provisioned) and uninstalling it
 * (files removed from disk in real time + provisioning torn down).
 */
describe('marketplace bundle lifecycle', () => {
  const bundleStore = new BundleStoreService();
  const provisioning = new AppProvisioningService();
  const vendors = new VendorService(bundleStore);
  const service = new MarketplaceService(
    bundleStore,
    provisioning,
    vendors,
    new ServiceRegistryService(),
    new ExtProxyService(new CircuitBreakerService()),
  );

  // A representative declarative industry bundle (toggleable modules), inline
  // now that industry bundles live in their own unierp-app-* repos.
  const manifest = validateManifest({
    name: 'Lifecycle Test App', slug: 'lifecycle-test-app', version: '1.0.0',
    category: 'Industry', vendor: 'healthtech', runtime: 'declarative',
    modules: [{
      slug: 'main', name: 'Main',
      schemas: [{ slug: 'thing', name: 'Thing', fields: [{ name: 'title', type: 'text', required: true }], sampleData: [{ title: 'First' }] }],
      pages: [
        { slug: 'things', title: 'Things', type: 'list', schema: 'thing' },
        { slug: 'thing-form', title: 'New Thing', type: 'form', schema: 'thing' },
      ],
    }],
  });
  let tenantId: string;

  beforeAll(async () => {
    let tenant: { id: string } | null = null;
    try {
      tenant = await prisma.tenant.findFirst();
    } catch {
      // DB not available — skip integration tests
    }
    if (!tenant) {
      console.warn('Skipping marketplace lifecycle tests: no tenant in dev DB');
      return;
    }
    tenantId = tenant.id;

    // Publish the bundle through the third-party pipeline.
    const vendor = await vendors.ensureVendor('healthtech', { name: 'HealthTech', verified: true });
    await vendors.seedPublishedApp(
      { id: vendor.id, slug: vendor.slug, name: vendor.name, websiteUrl: vendor.websiteUrl, verified: vendor.verified },
      manifest,
    );
  });

  afterAll(async () => {
    // Best-effort cleanup so reruns are clean.
    try { await service.uninstallApp(tenantId, manifest.slug); } catch { /* already gone */ }
  });

  it('publishes a listing projected from the bundle', async () => {
    if (!tenantId) return;
    const listing = await prisma.marketplaceApp.findUnique({ where: { slug: manifest.slug } });
    expect(listing).toBeTruthy();
    expect(listing!.isCore).toBe(false);
    expect(listing!.bundleId).toBeTruthy();
    expect(listing!.vendorId).toBeTruthy();
  });

  it('install extracts real files and provisions runtime pages', async () => {
    if (!tenantId) return;
    const result: any = await service.installApp(tenantId, manifest.slug, 'test-user');
    expect(result.installPath).toBeTruthy();

    // Real files on disk.
    const manifestFile = `${result.installPath}/manifest.json`;
    const onDisk = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
    expect(onDisk.slug).toBe(manifest.slug);

    // Runtime pages resolvable at /app/<slug>/<page>.
    const pages = await prisma.pageRegistry.findMany({ where: { tenantId, module: manifest.slug } });
    expect(pages.length).toBe(manifest.pages!.length);

    const schemas = await prisma.schemaRegistry.findMany({ where: { tenantId, module: manifest.slug } });
    expect(schemas.length).toBe(manifest.schemas!.length);
  });

  it('uninstall removes files from disk in real time and tears down provisioning', async () => {
    if (!tenantId) return;
    const before = await prisma.installedApp.findFirst({ where: { tenantId, appSlug: manifest.slug } });
    expect(before).toBeTruthy();
    const installPath = before!.installPath!;
    expect(await bundleStore.installExists(installPath)).toBe(true);

    await service.uninstallApp(tenantId, manifest.slug);

    // Directory gone.
    expect(await bundleStore.installExists(installPath)).toBe(false);
    // Provisioning gone.
    const pages = await prisma.pageRegistry.findMany({ where: { tenantId, module: manifest.slug } });
    expect(pages.length).toBe(0);
    const schemas = await prisma.schemaRegistry.findMany({ where: { tenantId, module: manifest.slug } });
    expect(schemas.length).toBe(0);
    const stillInstalled = await prisma.installedApp.findFirst({ where: { tenantId, appSlug: manifest.slug } });
    expect(stillInstalled).toBeNull();
  });

  it('refuses to uninstall a core app', async () => {
    if (!tenantId) return;
    const core = await prisma.marketplaceApp.findFirst({ where: { isCore: true } });
    if (!core) return;
    await expect(service.uninstallApp(tenantId, core.slug)).rejects.toThrow(/core/i);
  });
});

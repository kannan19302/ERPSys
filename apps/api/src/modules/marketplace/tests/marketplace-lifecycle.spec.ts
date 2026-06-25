import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import { prisma } from '@unerp/database';
import { BundleStoreService } from '../bundle-store.service';
import { AppProvisioningService } from '../app-provisioning.service';
import { VendorService } from '../vendor.service';
import { MarketplaceService } from '../../admin/marketplace.service';
import { HEALTHCARE_BUNDLES } from '../healthcare-bundles';
import { validateManifest } from '../manifest';

/**
 * End-to-end proof of the bundle lifecycle: publishing a third-party bundle, then
 * installing it (real files extracted + runtime provisioned) and uninstalling it
 * (files removed from disk in real time + provisioning torn down).
 */
describe('marketplace bundle lifecycle', () => {
  const bundleStore = new BundleStoreService();
  const provisioning = new AppProvisioningService();
  const vendors = new VendorService(bundleStore);
  const service = new MarketplaceService(bundleStore, provisioning, vendors);

  // The Healthcare industry app (single bundle with toggleable modules).
  const manifest = validateManifest(HEALTHCARE_BUNDLES.find((m) => m.slug === 'healthcare')!);
  let tenantId: string;

  beforeAll(async () => {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('no tenant in dev DB to test against');
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
    const listing = await prisma.marketplaceApp.findUnique({ where: { slug: manifest.slug } });
    expect(listing).toBeTruthy();
    expect(listing!.isCore).toBe(false);
    expect(listing!.bundleId).toBeTruthy();
    expect(listing!.vendorId).toBeTruthy();
  });

  it('install extracts real files and provisions runtime pages', async () => {
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
    const core = await prisma.marketplaceApp.findFirst({ where: { isCore: true } });
    if (!core) return; // seed core not run in this DB; skip
    await expect(service.uninstallApp(tenantId, core.slug)).rejects.toThrow(/core/i);
  });
});

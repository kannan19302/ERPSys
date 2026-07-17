import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { BundleStoreService } from './bundle-store.service';
import { validateManifest, AppManifest } from './manifest';
import { resolveUniqueSlug } from '../../common/utils/slug.util';

/**
 * Third-party publishing pipeline: a Vendor owns AppPackages; each package has
 * versioned AppBundles. A bundle is uploaded as DRAFT, submitted for review, and on
 * admin approval is PUBLISHED — which materializes its blob into the BundleStore and
 * projects a MarketplaceApp listing that the store + install path consume.
 */
@Injectable()
export class VendorService {
  constructor(private readonly bundleStore: BundleStoreService) {}

  // ─── Vendors ───

  async listVendors() {
    return prisma.appVendor.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { packages: true } } } });
  }

  async getVendor(id: string) {
    const v = await prisma.appVendor.findUnique({ where: { id }, include: { packages: true } });
    if (!v) throw new NotFoundException('Vendor not found');
    return v;
  }

  /** A user's vendor (developer account). Auto-provisioned on first use. */
  async getOrCreateMyVendor(userId: string, tenantId: string, defaults?: { name?: string; contactEmail?: string }) {
    const existing = await prisma.appVendor.findFirst({ where: { ownerUserId: userId } });
    if (existing) return existing;
    const base = (defaults?.name || `vendor-${userId}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `vendor-${userId}`;
    const slug = await this.uniqueSlug('appVendor', base);
    return prisma.appVendor.create({
      data: { name: defaults?.name || 'My Developer Account', slug, contactEmail: defaults?.contactEmail, ownerUserId: userId, ownerTenantId: tenantId },
    });
  }

  async createVendor(data: { name: string; contactEmail?: string; websiteUrl?: string; description?: string; ownerUserId?: string; ownerTenantId?: string; verified?: boolean }) {
    const slug = await this.uniqueSlug('appVendor', this.slugify(data.name));
    return prisma.appVendor.create({ data: { ...data, slug } });
  }

  async updateVendor(id: string, data: { name?: string; contactEmail?: string; websiteUrl?: string; description?: string }) {
    return prisma.appVendor.update({ where: { id }, data });
  }

  // ─── Packages (apps a vendor owns) ───

  async listPackages(vendorId: string) {
    return prisma.appPackage.findMany({ where: { vendorId }, orderBy: { updatedAt: 'desc' }, include: { bundles: { orderBy: { createdAt: 'desc' } } } });
  }

  async createPackage(vendorId: string, data: { name: string; description?: string; longDescription?: string; category: string; icon?: string; pricing?: string; price?: number; tags?: string[]; screenshots?: any[] }) {
    const slug = await this.uniqueSlug('appPackage', this.slugify(data.name));
    return prisma.appPackage.create({
      data: {
        vendorId, slug, name: data.name, description: data.description, longDescription: data.longDescription,
        category: data.category, icon: data.icon, pricing: data.pricing || 'FREE', price: data.price as any,
        tags: (data.tags || []) as any, screenshots: (data.screenshots || []) as any, status: 'DRAFT',
      },
    });
  }

  // ─── Bundles (versions) ───

  /**
   * Create a new DRAFT bundle from a manifest. The vendor "uploads/defines" the app
   * here; we validate, force the manifest slug to the package slug, and stash a DRAFT
   * blob (only published on approval).
   */
  async createBundle(packageId: string, manifestInput: any, opts?: { channel?: string; changelog?: string }) {
    const pkg = await prisma.appPackage.findUnique({ where: { id: packageId }, include: { vendor: true } });
    if (!pkg) throw new NotFoundException('App package not found');

    // Pin manifest identity to the package + vendor so vendors can't spoof another app.
    const manifest: AppManifest = validateManifest({ ...manifestInput, slug: pkg.slug, vendor: pkg.vendor.slug, category: manifestInput.category || pkg.category });

    const dup = await prisma.appBundle.findUnique({ where: { packageId_version: { packageId, version: manifest.version } } });
    if (dup) throw new ConflictException(`Version ${manifest.version} already exists for this app`);

    const blobKey = `${pkg.slug}/${manifest.version}`;
    const { checksum, sizeBytes } = await this.bundleStore.putBundle(blobKey, { manifest });

    return prisma.appBundle.create({
      data: {
        packageId, version: manifest.version, channel: opts?.channel || 'STABLE',
        manifest: manifest as any, blobKey, checksum, sizeBytes, changelog: opts?.changelog,
        status: 'DRAFT',
      },
    });
  }

  async submitForReview(bundleId: string) {
    const bundle = await prisma.appBundle.findUnique({ where: { id: bundleId } });
    if (!bundle) throw new NotFoundException('Bundle not found');
    if (bundle.status !== 'DRAFT' && bundle.status !== 'REJECTED') throw new BadRequestException('Only draft/rejected bundles can be submitted');
    await prisma.appPackage.update({ where: { id: bundle.packageId }, data: { status: 'IN_REVIEW' } });
    return prisma.appBundle.update({ where: { id: bundleId }, data: { status: 'IN_REVIEW', reviewNotes: null } });
  }

  // ─── Review (admin) ───

  async listPendingBundles() {
    return prisma.appBundle.findMany({
      where: { status: 'IN_REVIEW' },
      orderBy: { updatedAt: 'asc' },
      include: { package: { include: { vendor: true } } },
    });
  }

  async rejectBundle(bundleId: string, reviewedBy: string, reviewNotes: string) {
    const bundle = await prisma.appBundle.findUnique({ where: { id: bundleId } });
    if (!bundle) throw new NotFoundException('Bundle not found');
    return prisma.appBundle.update({ where: { id: bundleId }, data: { status: 'REJECTED', reviewedBy, reviewNotes } as any });
  }

  /**
   * Approve + publish a bundle: marks it PUBLISHED, sets it as the package's current
   * version, and upserts the MarketplaceApp listing projection (which the store and
   * install path read). "Deploy"/update = approving a newer version.
   */
  async approveBundle(bundleId: string, reviewedBy: string) {
    const bundle = await prisma.appBundle.findUnique({ where: { id: bundleId }, include: { package: { include: { vendor: true } } } });
    if (!bundle) throw new NotFoundException('Bundle not found');
    const pkg = bundle.package;
    const vendor = pkg.vendor;
    const manifest = validateManifest(bundle.manifest);

    const published = await prisma.appBundle.update({
      where: { id: bundleId },
      data: { status: 'PUBLISHED', reviewedBy, publishedBy: reviewedBy, publishedAt: new Date() },
    });

    await prisma.appPackage.update({ where: { id: pkg.id }, data: { status: 'PUBLISHED', currentVersionId: published.id } });

    const listing = await this.projectListing(pkg, vendor, published, manifest);

    // Record a changelog entry for the version.
    await prisma.appChangelog.upsert({
      where: { appId_version: { appId: listing.id, version: bundle.version } },
      update: { changes: bundle.changelog || `Version ${bundle.version}` },
      create: { appId: listing.id, version: bundle.version, changes: bundle.changelog || `Version ${bundle.version}` },
    });

    return { bundle: published, listing };
  }

  /** Roll back a package's live version to a prior published bundle. */
  async rollbackPackage(packageId: string, toBundleId: string, _reviewedBy: string) {
    const pkg = await prisma.appPackage.findUnique({ where: { id: packageId }, include: { vendor: true } });
    if (!pkg) throw new NotFoundException('App package not found');
    const target = await prisma.appBundle.findFirst({ where: { id: toBundleId, packageId, status: 'PUBLISHED' } });
    if (!target) throw new BadRequestException('Target version is not a published bundle of this app');
    const manifest = validateManifest(target.manifest);
    await prisma.appPackage.update({ where: { id: packageId }, data: { currentVersionId: target.id } });
    await this.projectListing(pkg, pkg.vendor, target, manifest);
    return { success: true };
  }

  /** Upserts the MarketplaceApp row that represents the live published version. */
  private async projectListing(pkg: any, vendor: any, bundle: any, manifest: AppManifest) {
    return prisma.marketplaceApp.upsert({
      where: { slug: pkg.slug },
      update: {
        name: manifest.name, description: manifest.description || pkg.description || manifest.name,
        longDescription: manifest.longDescription || pkg.longDescription, category: manifest.category,
        icon: manifest.icon || pkg.icon, publisher: vendor.name, publisherWebsite: vendor.websiteUrl,
        version: bundle.version, pricing: manifest.pricing || pkg.pricing || 'FREE', price: (manifest.price ?? pkg.price) as any,
        features: ((manifest as any).features || []) as any, screenshots: (manifest.screenshots || pkg.screenshots || []) as any,
        tags: (manifest.tags || pkg.tags || []) as any, requiresApps: (manifest.requiresApps || []) as any,
        configSchema: (manifest.configSchema || {}) as any, verified: !!vendor.verified, status: 'PUBLISHED',
        isCore: false, vendorId: vendor.id, packageId: pkg.id, bundleId: bundle.id,
      },
      create: {
        slug: pkg.slug, name: manifest.name, description: manifest.description || pkg.description || manifest.name,
        longDescription: manifest.longDescription || pkg.longDescription, category: manifest.category,
        icon: manifest.icon || pkg.icon, publisher: vendor.name, publisherWebsite: vendor.websiteUrl,
        version: bundle.version, pricing: manifest.pricing || pkg.pricing || 'FREE', price: (manifest.price ?? pkg.price) as any,
        features: ((manifest as any).features || []) as any, screenshots: (manifest.screenshots || pkg.screenshots || []) as any,
        tags: (manifest.tags || pkg.tags || []) as any, requiresApps: (manifest.requiresApps || []) as any,
        configSchema: (manifest.configSchema || {}) as any, verified: !!vendor.verified, status: 'PUBLISHED',
        isCore: false, vendorId: vendor.id, packageId: pkg.id, bundleId: bundle.id,
      },
    });
  }

  // ─── Seeding (first-party publishing of bundled verticals, e.g. Healthcare) ───

  async ensureVendor(slug: string, data: { name: string; description?: string; websiteUrl?: string; verified?: boolean }) {
    const existing = await prisma.appVendor.findUnique({ where: { slug } });
    if (existing) return existing;
    return prisma.appVendor.create({ data: { slug, name: data.name, description: data.description, websiteUrl: data.websiteUrl, verified: data.verified ?? false } });
  }

  /**
   * Publish a manifest end-to-end (vendor → package → bundle → PUBLISHED listing),
   * idempotently. Used by seeders to populate the store with real bundles instead of
   * mock rows. `manifest.vendor` must match the given vendor slug.
   */
  async seedPublishedApp(vendor: { id: string; slug: string; name: string; websiteUrl?: string | null; verified?: boolean }, manifestInput: any) {
    const manifest = validateManifest({ ...manifestInput, vendor: vendor.slug });

    const pkg = await prisma.appPackage.upsert({
      where: { slug: manifest.slug },
      update: { name: manifest.name, category: manifest.category, icon: manifest.icon, description: manifest.description, longDescription: manifest.longDescription, tags: (manifest.tags || []) as any },
      create: {
        vendorId: vendor.id, slug: manifest.slug, name: manifest.name, category: manifest.category, icon: manifest.icon,
        description: manifest.description, longDescription: manifest.longDescription, pricing: manifest.pricing || 'FREE',
        tags: (manifest.tags || []) as any, status: 'DRAFT',
      },
    });

    const blobKey = `${manifest.slug}/${manifest.version}`;
    const { checksum, sizeBytes } = await this.bundleStore.putBundle(blobKey, { manifest });

    const bundle = await prisma.appBundle.upsert({
      where: { packageId_version: { packageId: pkg.id, version: manifest.version } },
      update: { manifest: manifest as any, blobKey, checksum, sizeBytes, status: 'PUBLISHED', publishedAt: new Date() },
      create: { packageId: pkg.id, version: manifest.version, manifest: manifest as any, blobKey, checksum, sizeBytes, status: 'PUBLISHED', publishedBy: 'system', publishedAt: new Date() },
    });

    await prisma.appPackage.update({ where: { id: pkg.id }, data: { status: 'PUBLISHED', currentVersionId: bundle.id } });
    return this.projectListing(pkg, vendor, bundle, manifest);
  }

  // ─── helpers ───

  private slugify(s: string) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'app';
  }

  private uniqueSlug(model: 'appVendor' | 'appPackage', base: string): Promise<string> {
    return resolveUniqueSlug(base, async (slug) => {
      const found = model === 'appVendor'
        ? await prisma.appVendor.findUnique({ where: { slug } })
        : await prisma.appPackage.findUnique({ where: { slug } });
      return found != null;
    });
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AppManifest } from './manifest';

/**
 * A bundle "blob" as stored in the BundleStore: the manifest plus any binary/text
 * assets. On install this is materialized into a real directory tree of files under
 * a per-tenant app directory; on uninstall that directory is deleted (real-time).
 */
export interface BundleArchive {
  manifest: AppManifest;
}

/**
 * Filesystem-backed object store for app bundles, with a swappable surface so an
 * S3/object-storage driver can replace it later. Bundle blobs and extracted tenant
 * app directories live OUTSIDE the core module source tree (under `var/`), so core
 * modules are never touched by the bundle file lifecycle.
 */
@Injectable()
export class BundleStoreService {
  /**
   * Repo root, resolved deterministically by walking up from this file to the
   * directory containing `pnpm-workspace.yaml`. This keeps bundle/install paths
   * stable regardless of the process cwd (server vs. test runner vs. tooling).
   */
  private static repoRoot(): string {
    let dir = __dirname;
    for (let i = 0; i < 8; i++) {
      try {
        if (require('fs').existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
      } catch { /* ignore */ }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return process.cwd();
  }

  /** Where published bundle blobs live (the "registry"). */
  private readonly bundleRoot = path.resolve(
    process.env.APP_BUNDLE_ROOT || path.join(BundleStoreService.repoRoot(), 'var', 'app-bundles'),
  );
  /** Where installed apps are extracted, namespaced per tenant. */
  private readonly tenantRoot = path.resolve(
    process.env.APP_TENANT_ROOT || path.join(BundleStoreService.repoRoot(), 'var', 'tenant-apps'),
  );

  // ─── Blob storage (the published bundle registry) ───

  async putBundle(blobKey: string, archive: BundleArchive): Promise<{ checksum: string; sizeBytes: number }> {
    const file = this.resolveBlobPath(blobKey);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const json = JSON.stringify(archive);
    await fs.writeFile(file, json, 'utf8');
    const checksum = crypto.createHash('sha256').update(json).digest('hex');
    return { checksum, sizeBytes: Buffer.byteLength(json, 'utf8') };
  }

  async getBundle(blobKey: string): Promise<BundleArchive> {
    const file = this.resolveBlobPath(blobKey);
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as BundleArchive;
  }

  async deleteBundle(blobKey: string): Promise<void> {
    const file = this.resolveBlobPath(blobKey);
    await fs.rm(file, { force: true });
  }

  // ─── Per-tenant install directories (real extracted files) ───

  installPathFor(tenantId: string, slug: string, version: string): string {
    const dir = `${this.safeSegment(slug)}@${this.safeSegment(version)}`;
    const full = path.resolve(this.tenantRoot, this.safeSegment(tenantId), dir);
    this.assertUnderTenantRoot(full);
    return full;
  }

  /**
   * Materialize a bundle archive into a real directory tree under the tenant's app
   * folder: manifest.json + schemas/*.json + pages/*.json + automations/*.json + assets/*.
   * Returns the absolute install path (recorded on InstalledApp for teardown).
   */
  async extractToInstallDir(tenantId: string, archive: BundleArchive): Promise<string> {
    const { manifest } = archive;
    const dest = this.installPathFor(tenantId, manifest.slug, manifest.version);
    // Clean any stale dir first so re-install is deterministic.
    await this.removeDir(dest);
    await fs.mkdir(dest, { recursive: true });

    await this.writeJson(path.join(dest, 'manifest.json'), manifest);

    for (const s of manifest.schemas || []) {
      await this.writeJson(path.join(dest, 'schemas', `${this.safeSegment(s.slug)}.json`), s);
    }
    for (const p of manifest.pages || []) {
      await this.writeJson(path.join(dest, 'pages', `${this.safeSegment(p.slug)}.json`), p);
    }
    (manifest.automations || []).forEach(() => void 0);
    if ((manifest.automations || []).length) {
      await this.writeJson(path.join(dest, 'automations', 'automations.json'), manifest.automations);
    }
    for (const a of manifest.assets || []) {
      const target = path.join(dest, this.safeRelative(a.path));
      this.assertUnderTenantRoot(target);
      await fs.mkdir(path.dirname(target), { recursive: true });
      if (a.contentBase64 != null) {
        await fs.writeFile(target, Buffer.from(a.contentBase64, 'base64'));
      } else {
        await fs.writeFile(target, a.content ?? '', 'utf8');
      }
    }

    return dest;
  }

  /** Recursively delete an installed app directory. The real-time uninstall. */
  async removeDir(installPath: string | null | undefined): Promise<void> {
    if (!installPath) return;
    const full = path.resolve(installPath);
    this.assertUnderTenantRoot(full);
    await fs.rm(full, { recursive: true, force: true });
  }

  async installExists(installPath: string | null | undefined): Promise<boolean> {
    if (!installPath) return false;
    try {
      await fs.access(path.resolve(installPath));
      return true;
    } catch {
      return false;
    }
  }

  // ─── helpers ───

  private async writeJson(file: string, data: any): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  }

  private resolveBlobPath(blobKey: string): string {
    const safe = this.safeRelative(blobKey).replace(/\.json$/i, '') + '.json';
    const full = path.resolve(this.bundleRoot, safe);
    if (!full.startsWith(this.bundleRoot + path.sep) && full !== this.bundleRoot) {
      throw new BadRequestException('Invalid bundle key');
    }
    return full;
  }

  private assertUnderTenantRoot(p: string): void {
    const full = path.resolve(p);
    if (!full.startsWith(this.tenantRoot + path.sep)) {
      throw new BadRequestException('Refusing to operate outside tenant app root');
    }
  }

  /** Strip traversal + drive letters from an arbitrary relative path. */
  private safeRelative(rel: string): string {
    return String(rel)
      .replace(/\\/g, '/')
      .split('/')
      .filter((seg) => seg && seg !== '.' && seg !== '..')
      .map((seg) => seg.replace(/[^a-zA-Z0-9._@-]/g, '_'))
      .join(path.sep);
  }

  private safeSegment(seg: string): string {
    return String(seg).replace(/[^a-zA-Z0-9._@-]/g, '_');
  }
}

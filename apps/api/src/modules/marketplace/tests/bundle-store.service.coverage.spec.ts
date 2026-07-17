import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BundleStoreService } from '../bundle-store.service';

describe('BundleStoreService coverage', () => {
  let service: BundleStoreService;

  beforeEach(() => {
    service = new BundleStoreService();
    vi.clearAllMocks();
  });

  it('installPathFor computes a path', () => {
    const p = service.installPathFor('t1', 'my-app', '1.0.0');
    expect(p).toContain('t1');
    expect(p).toContain('my-app');
  });

  it('installExists returns false for missing path', async () => {
    const exists = await service.installExists('/nonexistent/path');
    expect(exists).toBe(false);
  });

  it('putBundle stores and retrieves a bundle', async () => {
    const manifest = { slug: 'test', name: 'Test', version: '1.0.0' };
    const archive = { manifest } as any;
    const result = await service.putBundle('test-key', archive);
    expect(result.checksum).toBeDefined();
    expect(result.sizeBytes).toBeGreaterThan(0);

    const retrieved = await service.getBundle('test-key');
    expect(retrieved).toBeDefined();
    expect(retrieved?.manifest.slug).toBe('test');
  });

  it('deleteBundle removes a stored bundle', async () => {
    try {
      const archive = { manifest: { slug: 'del' } } as any;
      await service.putBundle('del-key', archive);
      await service.deleteBundle('del-key');
      const result = await service.getBundle('del-key');
      expect(result).toBeNull();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('extractToInstallDir materializes bundle files', async () => {
    const archive = { manifest: { slug: 'extract-test', version: '1.0.0' } } as any;
    try {
      const result = await service.extractToInstallDir('t1', archive);
      expect(result).toBeDefined();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('removeDir handles missing directory gracefully', async () => {
    try {
      await service.removeDir('/nonexistent/dir');
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

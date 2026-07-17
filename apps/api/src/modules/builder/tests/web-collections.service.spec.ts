import { Test, TestingModule } from '@nestjs/testing';
import { WebCollectionsService } from '../web-collections.service';
import { prisma } from '@unerp/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@unerp/database', () => {
  const gen = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  });
  return {
    prisma: {
      webCollection: gen(),
      webCollectionItem: gen(),
      webFormSubmission: gen(),
      webOrder: gen(),
      tenant: gen(),
    },
  };
});

describe('WebCollectionsService', () => {
  let service: WebCollectionsService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({ providers: [WebCollectionsService] }).compile();
    service = moduleRef.get(WebCollectionsService);
    vi.clearAllMocks();
  });

  describe('getCollections', () => {
    it('annotates each collection with item count', async () => {
      (prisma.webCollection.findMany as any).mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
      (prisma.webCollectionItem.groupBy as any).mockResolvedValue([{ collectionId: 'c1', _count: { _all: 5 } }]);
      const res = await service.getCollections('t1');
      expect(res[0].itemCount).toBe(5);
      expect(res[1].itemCount).toBe(0);
    });
  });

  describe('createCollection', () => {
    it('rejects duplicate slug', async () => {
      (prisma.webCollection.findUnique as any).mockResolvedValue({ id: 'exists' });
      await expect(service.createCollection('t1', { name: 'Products', slug: 'products' } as any)).rejects.toThrow(/already exists/);
    });

    it('creates with defaults', async () => {
      (prisma.webCollection.findUnique as any).mockResolvedValue(null);
      (prisma.webCollection.create as any).mockImplementation(({ data }: any) => Promise.resolve({ id: 'c1', ...data }));
      const res = await service.createCollection('t1', { name: 'Products', slug: 'products' } as any, 'u1');
      expect(res.kind).toBe('GENERIC');
      expect(res.singular).toBe('Products');
    });
  });

  describe('seedCollection', () => {
    it('creates a preset collection plus sample items', async () => {
      (prisma.webCollection.findUnique as any).mockResolvedValue(null);
      (prisma.webCollection.create as any).mockResolvedValue({ id: 'c1', name: 'Products', slug: 'products' });
      (prisma.webCollectionItem.createMany as any).mockResolvedValue({ count: 3 });
      (prisma.webCollectionItem.count as any).mockResolvedValue(3);
      const res = await service.seedCollection('t1', 'products', 'u1');
      expect(res.itemCount).toBe(3);
      expect(prisma.webCollectionItem.createMany).toHaveBeenCalled();
    });

    it('throws on unknown preset', async () => {
      await expect(service.seedCollection('t1', 'nope')).rejects.toThrow(/Unknown preset/);
    });
  });

  describe('createItem', () => {
    it('auto-derives slug from the title field and sets publishedAt when published', async () => {
      (prisma.webCollection.findFirst as any).mockResolvedValue({ id: 'c1', settings: { titleField: 'name' } });
      (prisma.webCollectionItem.findFirst as any).mockResolvedValue(null); // slug free
      (prisma.webCollectionItem.create as any).mockImplementation(({ data }: any) => Promise.resolve({ id: 'i1', ...data }));
      const res = await service.createItem('t1', 'c1', { data: { name: 'Aurora Headphones' }, status: 'PUBLISHED' } as any, 'u1');
      expect(res.slug).toBe('aurora-headphones');
      expect(res.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('getPublicItems', () => {
    it('returns only published items for a collection slug', async () => {
      (prisma.webCollection.findUnique as any).mockResolvedValue({ id: 'c1', name: 'Products', slug: 'products', fields: [], settings: {} });
      (prisma.webCollectionItem.findMany as any).mockResolvedValue([{ id: 'i1', status: 'PUBLISHED' }]);
      const res = await service.getPublicItems('t1', 'products');
      expect(res.items).toHaveLength(1);
      expect(prisma.webCollectionItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'PUBLISHED' }) }));
    });
  });

  describe('createSubmission', () => {
    it('captures a public form submission', async () => {
      (prisma.webFormSubmission.create as any).mockResolvedValue({ id: 's1' });
      const res = await service.createSubmission('t1', { formName: 'contact', data: { email: 'a@b.com' } } as any);
      expect(res.id).toBe('s1');
    });
  });

  describe('checkout', () => {
    it('computes totals server-side and creates an order', async () => {
      (prisma.webOrder.create as any).mockImplementation(({ data }: any) => Promise.resolve({ ...data }));
      const res = await service.checkout('t1', {
        customer: { name: 'Jo', email: 'jo@x.com' },
        items: [{ name: 'A', price: 10, qty: 2 }, { name: 'B', price: 5, qty: 1 }],
      } as any);
      expect(res.total).toBe(25);
      expect(res.status).toBe('PENDING');
      expect(res.orderNumber).toMatch(/^ORD-/);
    });
  });

  describe('getOrderStats', () => {
    it('sums revenue excluding cancelled orders', async () => {
      (prisma.webOrder.findMany as any).mockResolvedValue([
        { total: 100, status: 'PAID' },
        { total: 50, status: 'CANCELLED' },
        { total: 25, status: 'PENDING' },
      ]);
      const res = await service.getOrderStats('t1');
      expect(res.revenue).toBe(125);
      expect(res.total).toBe(3);
      expect(res.pending).toBe(1);
    });
  });
});

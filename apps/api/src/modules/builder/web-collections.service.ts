import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import type {
  CreateWebCollectionInput,
  UpdateWebCollectionInput,
  CreateWebCollectionItemInput,
  UpdateWebCollectionItemInput,
  CreateWebFormSubmissionInput,
  WebCheckoutInput,
} from '@unerp/shared';
import { COLLECTION_PRESETS } from './web-collections.presets';
import { resolveUniqueSlug } from '../../common/utils/slug.util';

function slugify(input: string): string {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 160) || `item-${Date.now()}`;
}

@Injectable()
export class WebCollectionsService {
  // ══════════════════════════════════════════════
  // COLLECTIONS
  // ══════════════════════════════════════════════

  async getCollections(tenantId: string) {
    const collections = await prisma.webCollection.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    const counts = await prisma.webCollectionItem.groupBy({
      by: ['collectionId'],
      where: { tenantId },
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((c) => [c.collectionId, c._count._all]));
    return collections.map((c) => ({ ...c, itemCount: countMap.get(c.id) ?? 0 }));
  }

  async getCollectionById(tenantId: string, id: string) {
    const col = await prisma.webCollection.findFirst({ where: { id, tenantId } });
    if (!col) throw new NotFoundException('Collection not found');
    return col;
  }

  async getCollectionBySlug(tenantId: string, slug: string) {
    const col = await prisma.webCollection.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
    if (!col) throw new NotFoundException('Collection not found');
    return col;
  }

  async createCollection(tenantId: string, dto: CreateWebCollectionInput, userId?: string) {
    const existing = await prisma.webCollection.findUnique({ where: { tenantId_slug: { tenantId, slug: dto.slug } } });
    if (existing) throw new BadRequestException('A collection with this slug already exists');
    return prisma.webCollection.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        singular: dto.singular || dto.name,
        description: dto.description || null,
        icon: dto.icon || '📦',
        color: dto.color || '#6366f1',
        kind: dto.kind || 'GENERIC',
        fields: (dto.fields || []) as any,
        settings: (dto.settings || {}) as any,
        createdBy: userId || null,
      },
    });
  }

  async updateCollection(tenantId: string, id: string, dto: UpdateWebCollectionInput) {
    await this.getCollectionById(tenantId, id);
    return prisma.webCollection.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.singular !== undefined && { singular: dto.singular }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.kind !== undefined && { kind: dto.kind }),
        ...(dto.fields !== undefined && { fields: dto.fields as any }),
        ...(dto.settings !== undefined && { settings: dto.settings as any }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async deleteCollection(tenantId: string, id: string) {
    await this.getCollectionById(tenantId, id);
    return prisma.webCollection.delete({ where: { id } }); // items cascade
  }

  /** Instantiate a ready-made collection (with sample content) from a preset. */
  async seedCollection(tenantId: string, preset: string, userId?: string) {
    const def = COLLECTION_PRESETS[preset];
    if (!def) throw new BadRequestException(`Unknown preset: ${preset}`);

    // Ensure a unique slug if the preset slug is taken.
    const slug = await resolveUniqueSlug(
      def.slug,
      async (candidate) =>
        (await prisma.webCollection.findUnique({
          where: { tenantId_slug: { tenantId, slug: candidate } },
        })) != null,
    );

    const collection = await prisma.webCollection.create({
      data: {
        tenantId,
        name: def.name,
        slug,
        singular: def.singular,
        description: def.description,
        icon: def.icon,
        color: def.color,
        kind: def.kind,
        fields: def.fields as any,
        settings: def.settings as any,
        createdBy: userId || null,
      },
    });

    if (def.sampleItems.length) {
      await prisma.webCollectionItem.createMany({
        data: def.sampleItems.map((item, i) => ({
          tenantId,
          collectionId: collection.id,
          slug: item.slug,
          data: item.data as any,
          status: item.status,
          featured: !!item.featured,
          sortOrder: i,
          publishedAt: item.status === 'PUBLISHED' ? new Date() : null,
          createdBy: userId || null,
        })),
        skipDuplicates: true,
      });
    }

    const itemCount = await prisma.webCollectionItem.count({ where: { collectionId: collection.id } });
    return { ...collection, itemCount };
  }

  listPresets() {
    return Object.entries(COLLECTION_PRESETS).map(([key, p]) => ({
      preset: key,
      name: p.name,
      description: p.description,
      icon: p.icon,
      color: p.color,
      kind: p.kind,
      fieldCount: p.fields.length,
      sampleCount: p.sampleItems.length,
    }));
  }

  // ══════════════════════════════════════════════
  // ITEMS
  // ══════════════════════════════════════════════

  async getItems(
    tenantId: string,
    collectionId: string,
    query: { search?: string; status?: string; page?: number; pageSize?: number } = {},
  ) {
    await this.getCollectionById(tenantId, collectionId);
    const where: any = { tenantId, collectionId };
    if (query.status && query.status !== 'ALL') where.status = query.status;

    let items = await prisma.webCollectionItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    if (query.search) {
      const needle = query.search.toLowerCase();
      items = items.filter((it) => {
        const data = it.data as any;
        return it.slug.toLowerCase().includes(needle)
          || (data && typeof data === 'object' && Object.values(data).some((v) => String(v ?? '').toLowerCase().includes(needle)));
      });
    }

    const total = items.length;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 20);
    const data = items.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getItemById(tenantId: string, collectionId: string, id: string) {
    const item = await prisma.webCollectionItem.findFirst({ where: { id, tenantId, collectionId } });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  private resolveItemSlug(collectionId: string, desired: string, ignoreId?: string) {
    // Ensure uniqueness within the collection.
    return resolveUniqueSlug(slugify(desired), async (candidate) => {
      const clash = await prisma.webCollectionItem.findFirst({
        where: { collectionId, slug: candidate, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
        select: { id: true },
      });
      return clash != null;
    });
  }

  async createItem(tenantId: string, collectionId: string, dto: CreateWebCollectionItemInput, userId?: string) {
    const collection = await this.getCollectionById(tenantId, collectionId);
    const settings = (collection.settings as any) || {};
    const titleField = settings.titleField || 'title';
    const data = dto.data || {};
    const desired = dto.slug || (data as any)[titleField] || (data as any).name || (data as any).title || `item-${Date.now()}`;
    const slug = await this.resolveItemSlug(collectionId, String(desired));
    const status = dto.status || 'DRAFT';

    return prisma.webCollectionItem.create({
      data: {
        tenantId,
        collectionId,
        slug,
        data: data as any,
        status,
        featured: !!dto.featured,
        sortOrder: dto.sortOrder ?? 0,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        createdBy: userId || null,
      },
    });
  }

  async updateItem(tenantId: string, collectionId: string, id: string, dto: UpdateWebCollectionItemInput) {
    const existing = await this.getItemById(tenantId, collectionId, id);
    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await this.resolveItemSlug(collectionId, dto.slug, id);
    }
    const nextStatus = dto.status ?? existing.status;
    const justPublished = nextStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED';

    return prisma.webCollectionItem.update({
      where: { id },
      data: {
        slug,
        ...(dto.data !== undefined && { data: dto.data as any }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.featured !== undefined && { featured: dto.featured }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(justPublished && { publishedAt: new Date() }),
      },
    });
  }

  async deleteItem(tenantId: string, collectionId: string, id: string) {
    await this.getItemById(tenantId, collectionId, id);
    return prisma.webCollectionItem.delete({ where: { id } });
  }

  // ══════════════════════════════════════════════
  // PUBLIC READ (no auth) — for the live website
  // ══════════════════════════════════════════════

  async getPublicItems(tenantId: string, collectionSlug: string) {
    const collection = await prisma.webCollection.findUnique({ where: { tenantId_slug: { tenantId, slug: collectionSlug } } });
    if (!collection) throw new NotFoundException('Collection not found');
    const items = await prisma.webCollectionItem.findMany({
      where: { tenantId, collectionId: collection.id, status: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
    });
    return { collection: { name: collection.name, slug: collection.slug, fields: collection.fields, settings: collection.settings }, items };
  }

  async getPublicItem(tenantId: string, collectionSlug: string, itemSlug: string) {
    const collection = await prisma.webCollection.findUnique({ where: { tenantId_slug: { tenantId, slug: collectionSlug } } });
    if (!collection) throw new NotFoundException('Collection not found');
    const item = await prisma.webCollectionItem.findFirst({
      where: { tenantId, collectionId: collection.id, slug: itemSlug, status: 'PUBLISHED' },
    });
    if (!item) throw new NotFoundException('Item not found');
    return { collection: { name: collection.name, slug: collection.slug, fields: collection.fields, settings: collection.settings }, item };
  }

  // ══════════════════════════════════════════════
  // FORM SUBMISSIONS
  // ══════════════════════════════════════════════

  async createSubmission(tenantId: string, dto: CreateWebFormSubmissionInput) {
    return prisma.webFormSubmission.create({
      data: {
        tenantId,
        formName: dto.formName,
        pageSlug: dto.pageSlug || null,
        data: dto.data as any,
        meta: (dto.meta || {}) as any,
      },
    });
  }

  async getSubmissions(tenantId: string, query: { formName?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (query.formName) where.formName = query.formName;
    if (query.status && query.status !== 'ALL') where.status = query.status;
    return prisma.webFormSubmission.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  }

  async updateSubmissionStatus(tenantId: string, id: string, status: string) {
    const existing = await prisma.webFormSubmission.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Submission not found');
    return prisma.webFormSubmission.update({ where: { id }, data: { status } });
  }

  async deleteSubmission(tenantId: string, id: string) {
    const existing = await prisma.webFormSubmission.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Submission not found');
    return prisma.webFormSubmission.delete({ where: { id } });
  }

  // ══════════════════════════════════════════════
  // STOREFRONT ORDERS (e-commerce)
  // ══════════════════════════════════════════════

  /** Create an order from a public checkout. Recomputes totals server-side. */
  async checkout(tenantId: string, dto: WebCheckoutInput) {
    const items = dto.items || [];
    const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
    const total = subtotal; // taxes/shipping can be layered later
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const order = await prisma.webOrder.create({
      data: {
        tenantId,
        orderNumber,
        status: 'PENDING',
        customer: dto.customer as any,
        items: items as any,
        subtotal,
        total,
        currency: dto.currency || 'USD',
        notes: dto.notes || null,
      },
    });
    return { orderNumber: order.orderNumber, total: order.total, currency: order.currency, status: order.status };
  }

  async getOrders(tenantId: string, query: { status?: string } = {}) {
    const where: any = { tenantId };
    if (query.status && query.status !== 'ALL') where.status = query.status;
    return prisma.webOrder.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  }

  async getOrderStats(tenantId: string) {
    const orders = await prisma.webOrder.findMany({ where: { tenantId }, select: { total: true, status: true } });
    const revenue = orders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + (o.total || 0), 0);
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      fulfilled: orders.filter((o) => o.status === 'FULFILLED').length,
      revenue,
    };
  }

  async updateOrderStatus(tenantId: string, id: string, status: string) {
    const existing = await prisma.webOrder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Order not found');
    return prisma.webOrder.update({ where: { id }, data: { status } });
  }

  async deleteOrder(tenantId: string, id: string) {
    const existing = await prisma.webOrder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Order not found');
    return prisma.webOrder.delete({ where: { id } });
  }
}

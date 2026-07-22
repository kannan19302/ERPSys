import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const registerTagSchema = z.object({
  epc: z.string().min(1),
  tagType: z.enum(['ITEM', 'CASE', 'PALLET', 'CONTAINER', 'ASSET']).default('ITEM'),
  productId: z.string().optional(),
  licensePlateId: z.string().optional(),
  status: z.enum(['ACTIVE', 'IN_TRANSIT', 'CONSUMED', 'RETIRED']).default('ACTIVE'),
  lastLocation: z.string().optional(),
});
export type RegisterTagInput = z.infer<typeof registerTagSchema>;

export const recordReadEventSchema = z.object({
  tagId: z.string().min(1),
  antenna: z.string().optional(),
  reader: z.string().optional(),
  location: z.string().optional(),
  rssi: z.number().optional(),
  readAt: z.string().datetime(),
});
export type RecordReadEventInput = z.infer<typeof recordReadEventSchema>;

export const updateTagLocationSchema = z.object({
  location: z.string().min(1),
  lastReadAt: z.string().datetime().optional(),
});
export type UpdateTagLocationInput = z.infer<typeof updateTagLocationSchema>;

@Injectable()
export class InventoryRfidService {

  async registerTag(tenantId: string, dto: RegisterTagInput) {
    const existing = await prisma.rfidTag.findUnique({ where: { epc: dto.epc } });
    if (existing) {
      throw new BadRequestException(`RFID tag with EPC '${dto.epc}' already exists`);
    }
    return prisma.rfidTag.create({
      data: {
        tenantId,
        epc: dto.epc,
        tagType: dto.tagType,
        productId: dto.productId ?? null,
        status: dto.status,
        lastLocation: dto.lastLocation ?? null,
      },
    });
  }

  async bulkRegisterTags(tenantId: string, tags: RegisterTagInput[]) {
    const epcs = tags.map((t) => t.epc);
    const existing = await prisma.rfidTag.findMany({
      where: { epc: { in: epcs } },
      select: { epc: true },
    });
    if (existing.length > 0) {
      throw new BadRequestException(`EPCs already exist: ${existing.map((e) => e.epc).join(', ')}`);
    }
    return prisma.rfidTag.createMany({
      data: tags.map((t) => ({
        tenantId: t.tenantId,
        epc: t.epc,
        tagType: t.tagType,
        productId: t.productId ?? null,
        status: t.status,
        lastLocation: t.lastLocation ?? null,
      })),
    });
  }

  async getTagByEpc(tenantId: string, epc: string) {
    const tag = await prisma.rfidTag.findUnique({ where: { epc } });
    if (!tag || tag.tenantId !== tenantId) throw new NotFoundException('RFID tag not found');
    return tag;
  }

  async getTagById(tenantId: string, id: string) {
    const tag = await prisma.rfidTag.findFirst({
      where: { id, tenantId },
      include: { readEvents: { orderBy: { readAt: 'desc' }, take: 50 } },
    });
    if (!tag) throw new NotFoundException('RFID tag not found');
    return tag;
  }

  async listTags(
    tenantId: string,
    query: { page?: number; limit?: number; status?: string; productId?: string; tagType?: string },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.RfidTagWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.productId) where.productId = query.productId;
    if (query.tagType) where.tagType = query.tagType;

    const [data, total] = await Promise.all([
      prisma.rfidTag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rfidTag.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async updateTag(tenantId: string, id: string, dto: Partial<RegisterTagInput>) {
    const tag = await prisma.rfidTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException('RFID tag not found');
    return prisma.rfidTag.update({
      where: { id },
      data: {
        ...(dto.productId !== undefined && { productId: dto.productId }),
        ...(dto.tagType !== undefined && { tagType: dto.tagType }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.lastLocation !== undefined && { lastLocation: dto.lastLocation }),
      },
    });
  }

  async updateTagLocation(tenantId: string, id: string, dto: UpdateTagLocationInput) {
    const tag = await prisma.rfidTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException('RFID tag not found');
    return prisma.rfidTag.update({
      where: { id },
      data: {
        lastLocation: dto.location,
        ...(dto.lastReadAt !== undefined && { lastReadAt: new Date(dto.lastReadAt) }),
      },
    });
  }

  async retireTag(tenantId: string, id: string) {
    const tag = await prisma.rfidTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException('RFID tag not found');
    return prisma.rfidTag.update({ where: { id }, data: { status: 'RETIRED' } });
  }

  async recordReadEvent(tenantId: string, dto: RecordReadEventInput) {
    const tag = await prisma.rfidTag.findFirst({ where: { id: dto.tagId, tenantId } });
    if (!tag) throw new NotFoundException('RFID tag not found');

    const event = await prisma.rfidReadEvent.create({
      data: {
        tenantId,
        tagId: dto.tagId,
        antenna: dto.antenna ?? null,
        reader: dto.reader ?? null,
        location: dto.location ?? null,
        rssi: dto.rssi ?? null,
        readAt: new Date(dto.readAt),
      },
    });

    await prisma.rfidTag.update({
      where: { id: dto.tagId },
      data: { lastLocation: dto.location ?? undefined, lastReadAt: new Date(dto.readAt) },
    });

    return event;
  }

  async listReadEvents(
    tenantId: string,
    query: { page?: number; limit?: number; tagId?: string; location?: string; startDate?: string; endDate?: string },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.RfidReadEventWhereInput = { tenantId };
    if (query.tagId) where.tagId = query.tagId;
    if (query.location) where.location = query.location;
    if (query.startDate || query.endDate) {
      where.readAt = {};
      if (query.startDate) where.readAt.gte = new Date(query.startDate);
      if (query.endDate) where.readAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      prisma.rfidReadEvent.findMany({
        where,
        orderBy: { readAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { tag: { select: { epc: true, tagType: true } } },
      }),
      prisma.rfidReadEvent.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getTagLocationHistory(tenantId: string, tagId: string) {
    const tag = await prisma.rfidTag.findFirst({ where: { id: tagId, tenantId } });
    if (!tag) throw new NotFoundException('RFID tag not found');
    return prisma.rfidReadEvent.findMany({
      where: { tagId, location: { not: null } },
      orderBy: { readAt: 'asc' },
      select: { location: true, readAt: true, antenna: true, reader: true },
    });
  }

  async getRfidDashboard(tenantId: string) {
    const [byStatus, recentReads, activeTags] = await Promise.all([
      prisma.rfidTag.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.rfidReadEvent.findMany({
        where: { tenantId, readAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        orderBy: { readAt: 'desc' },
        take: 20,
        include: { tag: { select: { epc: true, tagType: true } } },
      }),
      prisma.rfidTag.count({
        where: { tenantId, lastReadAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      recentReads: recentReads,
      activeTags24h: activeTags,
    };
  }
}
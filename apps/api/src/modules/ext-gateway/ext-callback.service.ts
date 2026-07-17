import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ExtCallbackService {
  async loadRecords(tenantId: string, slug: string, where?: Record<string, unknown>, limit?: number) {
    const schema = await prisma.schemaRegistry.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      select: { id: true },
    });
    if (!schema) return [];
    const rows = await prisma.customRecord.findMany({
      where: {
        tenantId,
        schemaId: schema.id,
        // Equality filters on JSON data fields (Prisma JSON path filter).
        ...(where && Object.keys(where).length
          ? { AND: Object.entries(where).map(([k, v]) => ({ data: { path: [k], equals: v as any } })) }
          : {}),
      },
      select: { id: true, data: true, createdAt: true },
      ...(limit ? { take: Math.min(Math.max(1, limit), 500) } : {}),
    });
    return rows.map((r) => ({ _id: r.id, _createdAt: r.createdAt, ...((r.data || {}) as any) }));
  }

  async createRecord(tenantId: string, slug: string, data: Record<string, unknown>) {
    const schema = await prisma.schemaRegistry.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      select: { id: true },
    });
    if (!schema) throw new BadRequestException(`Schema "${slug}" is not provisioned for this tenant`);
    const rec = await prisma.customRecord.create({
      data: { tenantId, schemaId: schema.id, data: data as any },
      select: { id: true, data: true, createdAt: true },
    });
    return { _id: rec.id, _createdAt: rec.createdAt, ...((rec.data || {}) as any) };
  }
}

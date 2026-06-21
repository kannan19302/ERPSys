import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class GdprService {

  /* ── Retention Policies ─────────────────────── */

  async getRetentionPolicies(tenantId: string) {
    return prisma.dataRetentionPolicy.findMany({
      where: { tenantId },
      orderBy: { entityType: 'asc' },
    });
  }

  async upsertRetentionPolicy(
    tenantId: string,
    data: {
      entityType: string;
      retentionDays: number;
      action: string;
      isActive: boolean;
    },
  ) {
    return prisma.dataRetentionPolicy.upsert({
      where: { tenantId_entityType: { tenantId, entityType: data.entityType } },
      update: {
        retentionDays: data.retentionDays,
        action: data.action,
        isActive: data.isActive,
      },
      create: {
        tenantId,
        entityType: data.entityType,
        retentionDays: data.retentionDays,
        action: data.action,
        isActive: data.isActive,
      },
    });
  }

  /* ── Erasure Requests ───────────────────────── */

  async getErasureRequests(tenantId: string) {
    return prisma.dataErasureRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createErasureRequest(
    tenantId: string,
    requestedBy: string,
    data: { subjectEmail: string; subjectName?: string; entityTypes: string[] },
  ) {
    return prisma.dataErasureRequest.create({
      data: {
        tenantId,
        requestedBy,
        subjectEmail: data.subjectEmail,
        subjectName: data.subjectName,
        entityTypes: data.entityTypes,
        status: 'PENDING',
      },
    });
  }

  async executeErasure(tenantId: string, requestId: string) {
    const request = await prisma.dataErasureRequest.findFirst({
      where: { id: requestId, tenantId },
    });
    if (!request) throw new Error('Erasure request not found');
    if (request.status === 'COMPLETED') throw new Error('Already executed');

    const entityTypes = (request.entityTypes as string[]) || [];
    const email = request.subjectEmail;

    // Delete matching records by email across entity types
    const modelMap: Record<string, () => Promise<number>> = {
      customers: async () => {
        const { count } = await prisma.customer.deleteMany({ where: { tenantId, email } });
        return count;
      },
      vendors: async () => {
        const { count } = await prisma.vendor.deleteMany({ where: { tenantId, email } });
        return count;
      },
      contacts: async () => {
        const { count } = await prisma.contact.deleteMany({ where: { tenantId, email } });
        return count;
      },
      leads: async () => {
        const { count } = await prisma.lead.deleteMany({ where: { tenantId, email } });
        return count;
      },
      employees: async () => {
        const { count } = await prisma.employee.deleteMany({ where: { tenantId, email } });
        return count;
      },
    };

    let totalDeleted = 0;
    for (const et of entityTypes) {
      const fn = modelMap[et];
      if (fn) totalDeleted += await fn();
    }

    await prisma.dataErasureRequest.update({
      where: { id: requestId },
      data: { status: 'COMPLETED', erasedAt: new Date() },
    });

    return { deletedRecords: totalDeleted };
  }

  /* ── Data Export (Right of Access) ──────────── */

  async exportSubjectData(tenantId: string, email: string) {
    const [customers, contacts, leads, employees, vendors] = await Promise.all([
      prisma.customer.findMany({ where: { tenantId, email } }),
      prisma.contact.findMany({ where: { tenantId, email } }),
      prisma.lead.findMany({ where: { tenantId, email } }),
      prisma.employee.findMany({ where: { tenantId, email } }),
      prisma.vendor.findMany({ where: { tenantId, email } }),
    ]);

    return { customers, contacts, leads, employees, vendors };
  }
}

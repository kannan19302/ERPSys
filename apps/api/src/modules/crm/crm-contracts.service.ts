import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { resolveOrgId } from './crm-shared';

export const createContractSchema = z
  .object({
    title: z.string().min(1),
    customerId: z.string().optional().nullable(),
    vendorId: z.string().optional().nullable(),
    type: z.enum(['SALES', 'PURCHASE', 'SERVICE', 'NDA', 'OTHER']).default('SALES'),
    value: z.number().min(0),
    currency: z.string().min(1).default('USD'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    renewalDate: z.coerce.date().optional(),
    autoRenew: z.boolean().optional().default(false),
    renewalTermMonths: z.number().int().min(1).optional().nullable(),
    terms: z.string().optional().nullable(),
    ownerId: z.string().optional().nullable(),
  })
  .refine((d) => !!d.customerId || !!d.vendorId, {
    message: 'At least one of customerId or vendorId is required',
    path: ['customerId'],
  });
export const updateContractSchema = z.object({
  title: z.string().min(1).optional(),
  customerId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  type: z.enum(['SALES', 'PURCHASE', 'SERVICE', 'NDA', 'OTHER']).optional(),
  value: z.number().min(0).optional(),
  currency: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  renewalDate: z.coerce.date().optional(),
  autoRenew: z.boolean().optional(),
  renewalTermMonths: z.number().int().min(1).optional().nullable(),
  terms: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
});
export const contractStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED', 'RENEWED']),
});
export const renewContractSchema = z.object({
  // If omitted, defaults to renewalTermMonths on the existing contract.
  renewalTermMonths: z.number().int().min(1).optional(),
  // If true, extends the existing contract's dates in place rather than
  // creating a new follow-on Contract row.
  extendInPlace: z.boolean().optional().default(false),
  newValue: z.number().min(0).optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractStatusInput = z.infer<typeof contractStatusSchema>;
export type RenewContractInput = z.infer<typeof renewContractSchema>;

// Contract lifecycle (schema.prisma `Contract.status` comment): DRAFT, ACTIVE,
// EXPIRING_SOON, EXPIRED, TERMINATED, RENEWED. RENEWED and TERMINATED are
// terminal — a renewed/terminated contract's lineage continues via the
// renewedFrom/renewals self-relation and the dedicated renew() action, not by
// flipping status back on the old row.
const CONTRACT_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE', 'TERMINATED'],
  ACTIVE: ['EXPIRING_SOON', 'EXPIRED', 'TERMINATED'],
  EXPIRING_SOON: ['ACTIVE', 'EXPIRED', 'TERMINATED'],
  EXPIRED: ['TERMINATED'],
  TERMINATED: [],
  RENEWED: [],
};

@Injectable()
export class CrmContractsService {
  async getContracts(
    tenantId: string,
    filters: {
      status?: string;
      type?: string;
      customerId?: string;
      vendorId?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ) {
    const where: Prisma.ContractWhereInput = { tenantId, deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { contractNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['title', 'contractNumber', 'value', 'startDate', 'endDate', 'renewalDate', 'createdAt', 'status'];
    const sortBy = filters.sortBy && validSortFields.includes(filters.sortBy) ? filters.sortBy : 'renewalDate';
    const sortOrder = filters.sortOrder === 'desc' ? 'desc' : 'asc';
    const orderBy: Prisma.ContractOrderByWithRelationInput = { [sortBy]: sortOrder };

    const page = filters.page ? Math.max(1, filters.page) : 1;
    const limit = filters.limit ? Math.max(1, Math.min(100, filters.limit)) : 20;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      data,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getContractById(tenantId: string, id: string) {
    const found = await prisma.contract.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        renewedFrom: { select: { id: true, contractNumber: true, title: true } },
        renewals: { select: { id: true, contractNumber: true, title: true, status: true, startDate: true, endDate: true } },
      },
    });
    if (!found) throw new NotFoundException('Contract not found');
    return found;
  }

  /** KPI rollups for the list page header (active count, expiring-soon count, total value). */
  async getStats(tenantId: string) {
    const where: Prisma.ContractWhereInput = { tenantId, deletedAt: null };
    const [total, active, expiringSoon, expired, valueAgg] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.contract.count({ where: { ...where, status: 'EXPIRING_SOON' } }),
      prisma.contract.count({ where: { ...where, status: 'EXPIRED' } }),
      prisma.contract.aggregate({ where: { ...where, status: { in: ['ACTIVE', 'EXPIRING_SOON'] } }, _sum: { value: true } }),
    ]);
    return {
      total,
      active,
      expiringSoon,
      expired,
      totalActiveValue: valueAgg._sum.value ? Number(valueAgg._sum.value) : 0,
    };
  }

  async createContract(tenantId: string, orgId: string, dto: CreateContractInput) {
    if (dto.customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: dto.customerId, tenantId } });
      if (!customer) throw new BadRequestException('customerId does not belong to this tenant');
    }
    if (dto.vendorId) {
      const vendor = await prisma.vendor.findFirst({ where: { id: dto.vendorId, tenantId } });
      if (!vendor) throw new BadRequestException('vendorId does not belong to this tenant');
    }
    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const count = await prisma.contract.count({ where: { tenantId } });
    const contractNumber = `CON-${String(count + 1).padStart(5, '0')}`;

    const renewalDate = dto.renewalDate ?? dto.endDate;

    return prisma.contract.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        contractNumber,
        title: dto.title,
        customerId: dto.customerId || null,
        vendorId: dto.vendorId || null,
        type: dto.type,
        value: dto.value,
        currency: dto.currency,
        startDate: dto.startDate,
        endDate: dto.endDate,
        renewalDate,
        autoRenew: dto.autoRenew,
        renewalTermMonths: dto.renewalTermMonths ?? null,
        terms: dto.terms || null,
        ownerId: dto.ownerId || null,
      },
    });
  }

  async updateContract(tenantId: string, id: string, dto: UpdateContractInput) {
    const existing = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Contract not found');

    if (dto.customerId === null && dto.vendorId === null) {
      throw new BadRequestException('At least one of customerId or vendorId is required');
    }
    if (dto.customerId !== undefined && dto.customerId === null && !(dto.vendorId || existing.vendorId)) {
      throw new BadRequestException('At least one of customerId or vendorId is required');
    }
    if (dto.vendorId !== undefined && dto.vendorId === null && !(dto.customerId || existing.customerId)) {
      throw new BadRequestException('At least one of customerId or vendorId is required');
    }

    const startDate = dto.startDate ?? existing.startDate;
    const endDate = dto.endDate ?? existing.endDate;
    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    return prisma.contract.update({
      where: { id },
      data: {
        ...dto,
        value: dto.value !== undefined ? dto.value : undefined,
      },
    });
  }

  async deleteContract(tenantId: string, id: string) {
    const existing = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Contract not found');
    return prisma.contract.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async updateStatus(tenantId: string, id: string, dto: ContractStatusInput) {
    const existing = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Contract not found');

    if (dto.status !== existing.status) {
      const allowed = CONTRACT_STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(dto.status)) {
        if (dto.status === 'RENEWED') {
          throw new BadRequestException(
            'Cannot set status to RENEWED directly — use POST /crm/contracts/:id/renew, which sets this automatically.',
          );
        }
        throw new BadRequestException(
          `Cannot transition contract from ${existing.status} to ${dto.status}. Allowed transitions from ${existing.status}: ${allowed.length ? allowed.join(', ') : 'none (terminal status)'}.`,
        );
      }
    }

    return prisma.contract.update({ where: { id }, data: { status: dto.status } });
  }

  /**
   * Renewal action. Two modes:
   *  - extendInPlace=true: extends the same Contract row's startDate/endDate/
   *    renewalDate forward by renewalTermMonths and marks it ACTIVE again —
   *    used for simple auto-renew cases with no need for a distinct record.
   *  - extendInPlace=false (default): creates a new follow-on Contract linked
   *    via renewedFromId, carrying forward customer/vendor/type/value/terms,
   *    and marks the original RENEWED (terminal). This preserves full history
   *    of each term as its own record, which is the more common enterprise
   *    contract-renewal pattern (each term audited/signed independently) and
   *    is why it's the default.
   */
  async renewContract(tenantId: string, orgId: string, id: string, dto: RenewContractInput) {
    const existing = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Contract not found');
    if (['TERMINATED', 'RENEWED'].includes(existing.status)) {
      throw new BadRequestException(`Cannot renew a contract in terminal status ${existing.status}`);
    }

    const termMonths = dto.renewalTermMonths ?? existing.renewalTermMonths;
    if (!termMonths) {
      throw new BadRequestException('renewalTermMonths must be provided (or set on the contract) to renew');
    }

    const addMonths = (d: Date, months: number) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + months);
      return next;
    };

    const newStartDate = existing.endDate;
    const newEndDate = addMonths(existing.endDate, termMonths);

    if (dto.extendInPlace) {
      return prisma.contract.update({
        where: { id },
        data: {
          startDate: existing.startDate,
          endDate: newEndDate,
          renewalDate: newEndDate,
          status: 'ACTIVE',
          value: dto.newValue !== undefined ? dto.newValue : undefined,
        },
      });
    }

    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const count = await prisma.contract.count({ where: { tenantId } });
    const contractNumber = `CON-${String(count + 1).padStart(5, '0')}`;

    const [, created] = await prisma.$transaction([
      prisma.contract.update({ where: { id }, data: { status: 'RENEWED' } }),
      prisma.contract.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          contractNumber,
          title: existing.title,
          customerId: existing.customerId,
          vendorId: existing.vendorId,
          type: existing.type,
          value: dto.newValue !== undefined ? dto.newValue : existing.value,
          currency: existing.currency,
          startDate: newStartDate,
          endDate: newEndDate,
          renewalDate: newEndDate,
          autoRenew: existing.autoRenew,
          renewalTermMonths: existing.renewalTermMonths,
          terms: existing.terms,
          ownerId: existing.ownerId,
          renewedFromId: existing.id,
          status: 'ACTIVE',
        },
      }),
    ]);

    return created;
  }

  /**
   * Scans ACTIVE contracts whose renewalDate is within 30 days and flips them
   * to EXPIRING_SOON, and ACTIVE/EXPIRING_SOON contracts whose endDate has
   * already passed to EXPIRED. Intended to be invoked by a scheduled job;
   * exposed here as a callable action for now (no cron wiring in this slice).
   */
  async scanRenewals(tenantId: string) {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringSoon = await prisma.contract.updateMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        renewalDate: { lte: in30Days, gt: now },
      },
      data: { status: 'EXPIRING_SOON' },
    });

    const expired = await prisma.contract.updateMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        endDate: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    return { markedExpiringSoon: expiringSoon.count, markedExpired: expired.count };
  }
}

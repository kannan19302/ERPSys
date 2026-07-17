import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { resolveOrgId } from './crm-shared';

export const contractLineItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
});

export const createContractSchema = z
  .object({
    title: z.string().min(1),
    customerId: z.string().optional().nullable(),
    vendorId: z.string().optional().nullable(),
    type: z.enum(['SALES', 'PURCHASE', 'SERVICE', 'NDA', 'OTHER']).default('SALES'),
    contractType: z.enum(['ONE_TIME', 'RECURRING', 'MILESTONE', 'SUBSCRIPTION']).default('ONE_TIME'),
    value: z.number().min(0),
    currency: z.string().min(1).default('USD'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    renewalDate: z.coerce.date().optional(),
    autoRenew: z.boolean().optional().default(false),
    renewalTermMonths: z.number().int().min(1).optional().nullable(),
    terms: z.string().optional().nullable(),
    ownerId: z.string().optional().nullable(),
    revisedFromId: z.string().optional().nullable(),
    approvalStatus: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']).optional().default('DRAFT'),
    approverId: z.string().optional().nullable(),
    signatureStatus: z.enum(['UNSIGNED', 'PENDING_SIGNATURE', 'SIGNED']).optional().default('UNSIGNED'),
    signerName: z.string().optional().nullable(),
    signerEmail: z.string().optional().nullable(),
    signedAt: z.coerce.date().optional().nullable(),
    shippingHandlingCharges: z.number().min(0).optional().default(0),
    priceAdjustment: z.number().optional().default(0),
    taxRate: z.number().min(0).max(100).optional().default(0),
    billingAddress: z.string().optional().nullable(),
    shippingAddress: z.string().optional().nullable(),
    deliveryNotes: z.string().optional().nullable(),
    shippingCarrier: z.string().optional().nullable(),
    trackingNumber: z.string().optional().nullable(),
    lineItems: z.array(contractLineItemSchema).optional(),
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
  contractType: z.enum(['ONE_TIME', 'RECURRING', 'MILESTONE', 'SUBSCRIPTION']).optional(),
  value: z.number().min(0).optional(),
  currency: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  renewalDate: z.coerce.date().optional(),
  autoRenew: z.boolean().optional(),
  renewalTermMonths: z.number().int().min(1).optional().nullable(),
  terms: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  revisedFromId: z.string().optional().nullable(),
  approvalStatus: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']).optional(),
  approverId: z.string().optional().nullable(),
  signatureStatus: z.enum(['UNSIGNED', 'PENDING_SIGNATURE', 'SIGNED']).optional(),
  signerName: z.string().optional().nullable(),
  signerEmail: z.string().optional().nullable(),
  signedAt: z.coerce.date().optional().nullable(),
  shippingHandlingCharges: z.number().min(0).optional(),
  priceAdjustment: z.number().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  billingAddress: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  deliveryNotes: z.string().optional().nullable(),
  shippingCarrier: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  lineItems: z.array(contractLineItemSchema).optional(),
});

export const contractStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED', 'RENEWED']),
});

export const renewContractSchema = z.object({
  renewalTermMonths: z.number().int().min(1).optional(),
  extendInPlace: z.boolean().optional().default(false),
  newValue: z.number().min(0).optional(),
});

export const inviteSignSchema = z.object({
  signerName: z.string().min(1),
  signerEmail: z.string().email(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractStatusInput = z.infer<typeof contractStatusSchema>;
export type RenewContractInput = z.infer<typeof renewContractSchema>;
export type InviteSignInput = z.infer<typeof inviteSignSchema>;

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
        lineItems: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        billingMilestones: {
          orderBy: { dueDate: 'asc' },
        },
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
    const { lineItems, ...rest } = dto;

    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          contractNumber,
          title: rest.title,
          customerId: rest.customerId || null,
          vendorId: rest.vendorId || null,
          type: rest.type,
          value: rest.value,
          currency: rest.currency,
          startDate: rest.startDate,
          endDate: rest.endDate,
          renewalDate,
          autoRenew: rest.autoRenew,
          renewalTermMonths: rest.renewalTermMonths ?? null,
          terms: rest.terms || null,
          ownerId: rest.ownerId || null,
          approvalStatus: rest.approvalStatus || 'DRAFT',
          approverId: rest.approverId || null,
          signatureStatus: rest.signatureStatus || 'UNSIGNED',
          signerName: rest.signerName || null,
          signerEmail: rest.signerEmail || null,
          signedAt: rest.signedAt || null,
          shippingHandlingCharges: rest.shippingHandlingCharges ?? 0,
          priceAdjustment: rest.priceAdjustment ?? 0,
          taxRate: rest.taxRate ?? 0,
          billingAddress: rest.billingAddress || null,
          shippingAddress: rest.shippingAddress || null,
          deliveryNotes: rest.deliveryNotes || null,
          shippingCarrier: rest.shippingCarrier || null,
          trackingNumber: rest.trackingNumber || null,
        },
      });

      if (lineItems && lineItems.length > 0) {
        await tx.contractLineItem.createMany({
          data: lineItems.map((item) => ({
            tenantId,
            contractId: contract.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
          })),
        });
      }

      return contract;
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

    const { lineItems, ...rest } = dto;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id },
        data: {
          ...rest,
          value: rest.value !== undefined ? rest.value : undefined,
        },
      });

      if (lineItems !== undefined) {
        await tx.contractLineItem.deleteMany({ where: { contractId: id, tenantId } });
        if (lineItems.length > 0) {
          await tx.contractLineItem.createMany({
            data: lineItems.map((item) => ({
              tenantId,
              contractId: id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
            })),
          });
        }
      }

      return updated;
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

  async approveContract(tenantId: string, id: string, userId: string) {
    const existing = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Contract not found');
    if (existing.approvalStatus !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Contract is not pending approval');
    }
    return prisma.contract.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approverId: userId,
        signatureStatus: 'UNSIGNED',
      },
    });
  }

  async rejectContract(tenantId: string, id: string, userId: string) {
    const existing = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Contract not found');
    if (existing.approvalStatus !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Contract is not pending approval');
    }
    return prisma.contract.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        approverId: userId,
      },
    });
  }

  async submitForApproval(tenantId: string, id: string) {
    const existing = await prisma.contract.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        lineItems: {
          include: { product: true },
        },
      },
    });
    if (!existing) throw new NotFoundException('Contract not found');

    const valueRequiresApproval = Number(existing.value) >= 10000;
    const productRequiresApproval = (existing.lineItems || []).some(
      (item) => item.product?.requiresApproval === true,
    );

    const requiresApproval = valueRequiresApproval || productRequiresApproval;

    return prisma.contract.update({
      where: { id },
      data: {
        approvalStatus: requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED',
        signatureStatus: 'UNSIGNED',
      },
    });
  }

  async reviseContract(tenantId: string, orgId: string, id: string) {
    const existing = await prisma.contract.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { lineItems: true },
    });
    if (!existing) throw new NotFoundException('Contract not found');

    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const count = await prisma.contract.count({ where: { tenantId } });
    const contractNumber = `CON-${String(count + 1).padStart(5, '0')}`;

    return prisma.$transaction(async (tx) => {
      const clone = await tx.contract.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          contractNumber,
          title: `${existing.title} (Amended)`,
          customerId: existing.customerId,
          vendorId: existing.vendorId,
          type: existing.type,
          contractType: existing.contractType,
          value: existing.value,
          currency: existing.currency,
          startDate: existing.startDate,
          endDate: existing.endDate,
          renewalDate: existing.renewalDate,
          autoRenew: existing.autoRenew,
          renewalTermMonths: existing.renewalTermMonths,
          terms: existing.terms,
          ownerId: existing.ownerId,
          revisedFromId: existing.id,
          status: 'DRAFT',
          approvalStatus: 'DRAFT',
          signatureStatus: 'UNSIGNED',
        },
      });

      if (existing.lineItems && existing.lineItems.length > 0) {
        await tx.contractLineItem.createMany({
          data: existing.lineItems.map((item) => ({
            tenantId,
            contractId: clone.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
          })),
        });
      }

      return clone;
    });
  }

  async convertToSalesOrder(tenantId: string, orgId: string, id: string, userId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        lineItems: {
          include: { product: true },
        },
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    if (!contract.customerId) {
      throw new BadRequestException('Contract must be linked to a customer to generate a sales order');
    }

    const existingOrder = await prisma.salesOrder.findFirst({
      where: { contractId: id, tenantId, deletedAt: null },
    });
    if (existingOrder) {
      throw new BadRequestException(`Contract has already been converted to Sales Order ${existingOrder.orderNumber}`);
    }

    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const orderCount = await prisma.salesOrder.count({ where: { tenantId } });
    const orderNumber = `SO-${String(orderCount + 1).padStart(5, '0')}`;

    const totalCalculated = Number(contract.value) + Number(contract.shippingHandlingCharges) + Number(contract.priceAdjustment);

    return prisma.$transaction(async (tx) => {
      const salesOrder = await tx.salesOrder.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          customerId: contract.customerId!,
          orderNumber,
          status: 'DRAFT',
          orderDate: new Date(),
          subtotal: contract.value,
          totalAmount: new Prisma.Decimal(totalCalculated),
          currency: contract.currency,
          salesChannel: 'B2B',
          paymentStatus: 'UNPAID',
          shippingAddress: (contract.shippingAddress ? { address: contract.shippingAddress } : null) as any,
          notes: `Generated automatically from contract ${contract.contractNumber}.${contract.deliveryNotes ? '\nDelivery Notes: ' + contract.deliveryNotes : ''}`,
          contractId: contract.id,
          shippingHandlingCharges: contract.shippingHandlingCharges,
          priceAdjustment: contract.priceAdjustment,
          createdBy: userId,
        },
      });

      if (contract.lineItems && contract.lineItems.length > 0) {
        await tx.salesOrderItem.createMany({
          data: contract.lineItems.map((item, idx) => {
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);
            const discount = Number(item.discount);
            const totalAmount = quantity * unitPrice - discount;
            return {
              tenantId,
              salesOrderId: salesOrder.id,
              productId: item.productId,
              description: item.product?.name || 'Line Item',
              quantity,
              unitPrice,
              totalAmount,
              sortOrder: idx,
            };
          }),
        });
      }

      return salesOrder;
    });
  }

  async inviteToSign(tenantId: string, id: string, signerName: string, signerEmail: string) {
    const existing = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Contract not found');
    if (existing.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Contract must be approved before inviting signers');
    }
    return prisma.contract.update({
      where: { id },
      data: {
        signatureStatus: 'PENDING_SIGNATURE',
        signerName,
        signerEmail,
      },
    });
  }

  async signContract(tenantId: string, id: string) {
    const existing = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Contract not found');
    if (existing.signatureStatus !== 'PENDING_SIGNATURE') {
      throw new BadRequestException('Contract signature is not pending');
    }
    return prisma.contract.update({
      where: { id },
      data: {
        signatureStatus: 'SIGNED',
        signedAt: new Date(),
        status: 'ACTIVE',
      },
    });
  }

  async addBillingMilestone(tenantId: string, contractId: string, dto: { title: string; percentage: number; dueDate?: string }) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, tenantId, deletedAt: null },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const amount = (Number(contract.value) * dto.percentage) / 100;

    return prisma.contractBillingMilestone.create({
      data: {
        tenantId,
        contractId,
        title: dto.title,
        percentage: dto.percentage,
        amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: 'PENDING',
      },
    });
  }

  async deleteBillingMilestone(tenantId: string, contractId: string, id: string) {
    const milestone = await prisma.contractBillingMilestone.findFirst({
      where: { id, contractId, tenantId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== 'PENDING') {
      throw new BadRequestException('Cannot delete an invoiced/paid milestone');
    }
    return prisma.contractBillingMilestone.delete({ where: { id } });
  }

  async triggerMilestoneInvoice(tenantId: string, orgId: string, contractId: string, id: string, userId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, tenantId, deletedAt: null },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.approvalStatus !== 'APPROVED' && contract.status !== 'ACTIVE') {
      throw new BadRequestException('Contract must be approved or active to trigger invoices');
    }
    if (!contract.customerId) {
      throw new BadRequestException('Contract must be linked to a customer to invoice');
    }

    const milestone = await prisma.contractBillingMilestone.findFirst({
      where: { id, contractId, tenantId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== 'PENDING') {
      throw new BadRequestException('Milestone is already invoiced or paid');
    }

    return prisma.$transaction(async (tx) => {
      const prefix = 'INV';
      const year = new Date().getFullYear();
      const count = await tx.invoice.count({
        where: { tenantId, invoiceNumber: { startsWith: `${prefix}-${year}` } },
      });
      const seq = String(count + 1).padStart(5, '0');
      const invoiceNumber = `${prefix}-${year}-${seq}`;

      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          orgId: orgId || contract.orgId,
          customerId: contract.customerId!,
          invoiceNumber,
          status: 'DRAFT',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal: milestone.amount,
          totalAmount: milestone.amount,
          currency: contract.currency,
          notes: `Generated billing milestone: ${milestone.title} from Contract ${contract.contractNumber}`,
          createdBy: userId,
          lineItems: {
            create: [
              {
                tenantId,
                description: `Billing Milestone: ${milestone.title} (${milestone.percentage}% of Contract ${contract.contractNumber})`,
                quantity: 1,
                unitPrice: milestone.amount,
                totalAmount: milestone.amount,
              },
            ],
          },
        },
      });

      await tx.contractBillingMilestone.update({
        where: { id },
        data: {
          status: 'INVOICED',
          invoiceId: invoice.id,
        },
      });

      return invoice;
    });
  }
}

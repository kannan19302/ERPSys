import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateCustomerInput, CreateVendorInput, UpdateCustomerInput, UpdateVendorInput, VendorNoteInput, CustomerNoteInput, CreateCustomerTagInput } from '@unerp/shared';

@Injectable()
export class CrmCustomersService {
  async getCustomers(
    tenantId: string,
    query?: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (query?.type) {
      where.type = query.type;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { name: { contains: searchLower, mode: 'insensitive' } },
        { email: { contains: searchLower, mode: 'insensitive' } },
        { phone: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['name', 'createdAt', 'creditLimit', 'status'];
    const sortBy = query?.sortBy && validSortFields.includes(query.sortBy) ? query.sortBy : 'name';
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    if (query && (query.page !== undefined || query.limit !== undefined)) {
      const page = query.page ? Math.max(1, query.page) : 1;
      const limit = query.limit ? Math.max(1, query.limit) : 10;
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: { _count: { select: { invoices: true, quotations: true, salesOrders: true } } },
        }),
        prisma.customer.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data,
        totalCount,
        page,
        limit,
        totalPages,
      };
    }

    return prisma.customer.findMany({
      where,
      orderBy,
      include: { _count: { select: { invoices: true, quotations: true, salesOrders: true } } },
    });
  }

  async getCustomerById(tenantId: string, id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { invoices: true, quotations: true, salesOrders: true } } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async getCustomerSummary(tenantId: string, id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const [salesOrders, salesOrderCountResult] = await Promise.all([
      prisma.salesOrder.findMany({
        where: { customerId: id, tenantId, deletedAt: null },
        orderBy: { orderDate: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          orderDate: true,
        },
      }),
      prisma.salesOrder.aggregate({
        where: {
          customerId: id,
          tenantId,
          deletedAt: null,
          status: { in: ['CONFIRMED', 'PROCESSING', 'DELIVERED'] },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    const ltv = Number(salesOrderCountResult._sum.totalAmount || 0);

    const [invoices, invoiceCountResult] = await Promise.all([
      prisma.invoice.findMany({
        where: { customerId: id, tenantId, deletedAt: null },
        orderBy: { issueDate: 'desc' },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          status: true,
          issueDate: true,
          dueDate: true,
        },
      }),
      prisma.invoice.aggregate({
        where: {
          customerId: id,
          tenantId,
          deletedAt: null,
          status: { not: 'PAID' },
        },
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),
    ]);

    const unpaidBalance = Number(invoiceCountResult._sum.totalAmount || 0) - Number(invoiceCountResult._sum.paidAmount || 0);

    const [cases, casesCountResult] = await Promise.all([
      prisma.case.findMany({
        where: { customerId: id, tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          caseNumber: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      }),
      prisma.case.groupBy({
        by: ['status'],
        where: { customerId: id, tenantId },
        _count: {
          id: true,
        },
      }),
    ]);

    const openCases = casesCountResult
      .filter((c) => ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'].includes(c.status))
      .reduce((acc, c) => acc + c._count.id, 0);

    const resolvedCases = casesCountResult
      .filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status))
      .reduce((acc, c) => acc + c._count.id, 0);

    const creditLimit = customer.creditLimit ? Number(customer.creditLimit) : 0;
    const availableCredit = customer.creditLimit ? Math.max(0, creditLimit - unpaidBalance) : 0;
    const isCreditLimitExceeded = customer.creditLimit ? unpaidBalance > creditLimit : false;

    return {
      customer,
      metrics: {
        ltv,
        unpaidBalance,
        creditLimit,
        availableCredit,
        isCreditLimitExceeded,
        openCases,
        resolvedCases,
      },
      recentSalesOrders: salesOrders,
      recentInvoices: invoices,
      recentCases: cases,
    };
  }

  async createCustomer(tenantId: string, orgId: string, dto: CreateCustomerInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered in this tenant');
      resolvedOrgId = org.id;
    }
    return prisma.customer.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, type: dto.type,
        email: dto.email || null, phone: dto.phone || null, taxId: dto.taxId || null,
        billingAddress: dto.billingAddress ? (dto.billingAddress as Prisma.InputJsonValue) : Prisma.DbNull,
        shippingAddress: dto.shippingAddress ? (dto.shippingAddress as Prisma.InputJsonValue) : Prisma.DbNull,
        creditLimit: dto.creditLimit || null, paymentTerms: dto.paymentTerms, notes: dto.notes || null,
      },
    });
  }

  async updateCustomer(tenantId: string, id: string, dto: UpdateCustomerInput) {
    const existing = await prisma.customer.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Customer not found');
    return prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.creditLimit !== undefined && { creditLimit: dto.creditLimit }),
        ...(dto.paymentTerms !== undefined && { paymentTerms: dto.paymentTerms }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.billingAddress && { billingAddress: dto.billingAddress as Prisma.InputJsonValue }),
        ...(dto.shippingAddress && { shippingAddress: dto.shippingAddress as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteCustomer(tenantId: string, id: string) {
    const existing = await prisma.customer.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Customer not found');
    return prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getVendors(tenantId: string, query?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const where: Prisma.VendorWhereInput = { tenantId, deletedAt: null };
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const orderBy: Prisma.VendorOrderByWithRelationInput = {};
    if (query?.sortBy === 'name') orderBy.name = query.sortOrder || 'asc';
    else if (query?.sortBy === 'createdAt') orderBy.createdAt = query.sortOrder || 'desc';
    else orderBy.createdAt = 'desc';
    const [data, totalCount] = await Promise.all([
      prisma.vendor.findMany({ where, skip, take: limit, orderBy }),
      prisma.vendor.count({ where }),
    ]);
    return { data, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
  }

  async createVendor(tenantId: string, orgId: string, dto: CreateVendorInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered in this tenant');
      resolvedOrgId = org.id;
    }
    return prisma.vendor.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, email: dto.email || null, phone: dto.phone || null,
        taxId: dto.taxId || null,
        type: dto.type || 'COMPANY',
        address: dto.address ? (dto.address as Prisma.InputJsonValue) : Prisma.DbNull,
        paymentTerms: dto.paymentTerms, notes: dto.notes || null,
      },
    });
  }

  // ── ADVANCED VENDOR METHODS ────────────────────────

  async getVendorById(tenantId: string, id: string) {
    const vendor = await prisma.vendor.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            debitNotes: true,
            purchaseReturns: true,
            blanketPurchaseAgreements: true,
            portalUsers: true,
          },
        },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async getVendorSummary(tenantId: string, id: string) {
    const vendor = await prisma.vendor.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    // Purchase Orders (recent 5 + aggregates)
    const [recentPOs, poAgg, openPOCount] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { vendorId: id, tenantId, deletedAt: null },
        orderBy: { orderDate: 'desc' },
        take: 5,
        select: {
          id: true, orderNumber: true, totalAmount: true,
          status: true, orderDate: true, expectedDate: true,
        },
      }),
      prisma.purchaseOrder.aggregate({
        where: { vendorId: id, tenantId, deletedAt: null },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.purchaseOrder.count({
        where: {
          vendorId: id, tenantId, deletedAt: null,
          status: { in: ['DRAFT', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED'] },
        },
      }),
    ]);

    const totalSpend = Number(poAgg._sum.totalAmount || 0);
    const totalPOs = poAgg._count.id;

    // Debit Notes (recent 5)
    const recentDebitNotes = await prisma.debitNote.findMany({
      where: { vendorId: id, tenantId },
      orderBy: { issueDate: 'desc' },
      take: 5,
      select: {
        id: true, noteNumber: true, totalAmount: true,
        status: true, issueDate: true, reason: true,
      },
    });

    // Purchase Returns (recent 5)
    const recentReturns = await prisma.purchaseReturn.findMany({
      where: { vendorId: id, tenantId },
      orderBy: { returnDate: 'desc' },
      take: 5,
      select: {
        id: true, returnNumber: true, totalAmount: true,
        status: true, returnDate: true, reason: true,
      },
    });

    // Blanket Purchase Agreements
    const activeAgreements = await prisma.blanketPurchaseAgreement.findMany({
      where: { vendorId: id, tenantId, status: { in: ['ACTIVE', 'APPROVED'] } },
      orderBy: { startDate: 'desc' },
      take: 5,
      select: {
        id: true, agreementNumber: true, totalValue: true,
        status: true, startDate: true, endDate: true,
      },
    });

    // On-time delivery calculation (from POs with receipts)
    const posWithReceipts = await prisma.purchaseOrder.findMany({
      where: { vendorId: id, tenantId, deletedAt: null, expectedDate: { not: null } },
      include: { receipts: { select: { receivedDate: true } } },
    });

    let onTimeCount = 0;
    let lateCount = 0;
    let totalLeadTimeDays = 0;
    let leadTimeEntries = 0;

    for (const po of posWithReceipts) {
      if (po.receipts.length > 0 && po.expectedDate) {
        const latestReceipt = new Date(Math.max(...po.receipts.map(r => r.receivedDate.getTime())));
        if (latestReceipt <= new Date(po.expectedDate)) {
          onTimeCount++;
        } else {
          lateCount++;
        }
        const leadMs = latestReceipt.getTime() - po.orderDate.getTime();
        totalLeadTimeDays += Math.max(0, Math.floor(leadMs / (1000 * 60 * 60 * 24)));
        leadTimeEntries++;
      }
    }

    const deliveredPOs = onTimeCount + lateCount;
    const onTimeDeliveryRate = deliveredPOs > 0 ? Math.round((onTimeCount / deliveredPOs) * 1000) / 10 : 100;
    const avgLeadTimeDays = leadTimeEntries > 0 ? Math.round((totalLeadTimeDays / leadTimeEntries) * 10) / 10 : 0;

    // Vendor notes
    const recentNotes = await this.getVendorNotes(tenantId, id);

    return {
      vendor,
      metrics: {
        totalSpend,
        totalPOs,
        openPOs: openPOCount,
        onTimeDeliveryRate,
        avgLeadTimeDays,
        totalReturns: recentReturns.length,
        activeAgreements: activeAgreements.length,
      },
      recentPurchaseOrders: recentPOs,
      recentDebitNotes,
      recentReturns,
      activeAgreements,
      recentNotes: recentNotes.slice(0, 10),
    };
  }

  async updateVendor(tenantId: string, id: string, dto: UpdateVendorInput) {
    const existing = await prisma.vendor.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Vendor not found');

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email || null;
    if (dto.phone !== undefined) updateData.phone = dto.phone || null;
    if (dto.taxId !== undefined) updateData.taxId = dto.taxId || null;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.paymentTerms !== undefined) updateData.paymentTerms = dto.paymentTerms;
    if (dto.notes !== undefined) updateData.notes = dto.notes || null;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.address !== undefined) {
      updateData.address = dto.address ? (dto.address as Prisma.InputJsonValue) : Prisma.DbNull;
    }

    return prisma.vendor.update({ where: { id }, data: updateData });
  }

  async deleteVendor(tenantId: string, id: string) {
    const existing = await prisma.vendor.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Vendor not found');
    return prisma.vendor.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async updateVendorStatus(tenantId: string, id: string, status: string) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_HOLD', 'BLOCKED', 'PREFERRED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const existing = await prisma.vendor.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Vendor not found');
    return prisma.vendor.update({ where: { id }, data: { status } });
  }

  async getVendorNotes(tenantId: string, vendorId: string) {
    // Use the Activity model to store vendor notes (type: VENDOR_NOTE)
    const notes = await prisma.activity.findMany({
      where: {
        tenantId,
        type: { in: ['NOTE', 'CALL', 'EMAIL', 'MEETING'] },
        subject: { startsWith: `[VENDOR:${vendorId}]` },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, subject: true, description: true,
        createdAt: true,
      },
    });
    // Strip the vendor prefix from subject for display
    return notes.map(n => ({
      ...n,
      subject: n.subject.replace(`[VENDOR:${vendorId}] `, ''),
    }));
  }

  async addVendorNote(tenantId: string, orgId: string, vendorId: string, dto: VendorNoteInput) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId, deletedAt: null } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }

    return prisma.activity.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        type: dto.type || 'NOTE',
        subject: `[VENDOR:${vendorId}] ${dto.content.substring(0, 100)}`,
        description: dto.content,
        status: 'COMPLETED',
      },
    });
  }

  async bulkUpdateVendorStatus(tenantId: string, ids: string[], status: string) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_HOLD', 'BLOCKED', 'PREFERRED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const result = await prisma.vendor.updateMany({
      where: { id: { in: ids }, tenantId, deletedAt: null },
      data: { status },
    });
    return { updated: result.count, status };
  }

  async exportVendors(tenantId: string, query?: { search?: string; status?: string }) {
    const where: Prisma.VendorWhereInput = { tenantId, deletedAt: null };
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return prisma.vendor.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, email: true, phone: true, taxId: true,
        type: true, status: true, paymentTerms: true, notes: true,
        address: true, createdAt: true, updatedAt: true,
      },
    });
  }

  // ── CUSTOMER MECHANICAL FEATURES ────────────────

  async updateCustomerStatus(tenantId: string, id: string, status: string) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_HOLD', 'BLOCKED', 'PREFERRED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const existing = await prisma.customer.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Customer not found');
    return prisma.customer.update({ where: { id }, data: { status } });
  }

  async getCustomerNotes(tenantId: string, customerId: string) {
    // Use the Activity model to store customer notes (type: NOTE/CALL/EMAIL/MEETING)
    const notes = await prisma.activity.findMany({
      where: {
        tenantId,
        type: { in: ['NOTE', 'CALL', 'EMAIL', 'MEETING'] },
        subject: { startsWith: `[CUSTOMER:${customerId}]` },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, subject: true, description: true,
        createdAt: true,
      },
    });
    // Strip the customer prefix from subject for display
    return notes.map(n => ({
      ...n,
      subject: n.subject.replace(`[CUSTOMER:${customerId}] `, ''),
    }));
  }

  async addCustomerNote(tenantId: string, orgId: string, customerId: string, dto: CustomerNoteInput) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');

    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }

    return prisma.activity.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        type: dto.type || 'NOTE',
        subject: `[CUSTOMER:${customerId}] ${dto.content.substring(0, 100)}`,
        description: dto.content,
        customerId,
      },
    });
  }

  async bulkUpdateCustomerStatus(tenantId: string, ids: string[], status: string) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_HOLD', 'BLOCKED', 'PREFERRED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const result = await prisma.customer.updateMany({
      where: { id: { in: ids }, tenantId, deletedAt: null },
      data: { status },
    });
    return { updated: result.count, status };
  }

  async exportCustomers(tenantId: string, query?: { search?: string; status?: string }) {
    const where: Prisma.CustomerWhereInput = { tenantId, deletedAt: null };
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, email: true, phone: true, taxId: true,
        type: true, status: true, creditLimit: true, paymentTerms: true,
        notes: true, billingAddress: true, shippingAddress: true,
        createdAt: true, updatedAt: true,
      },
    });
  }

  // ── CUSTOMER TAGS ──────────────────────────────

  async getCustomerTags(tenantId: string) {
    return prisma.customerTag.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async createCustomerTag(tenantId: string, dto: CreateCustomerTagInput) {
    return prisma.customerTag.create({ data: { tenantId, name: dto.name, color: dto.color || '#3b82f6' } });
  }

  async deleteCustomerTag(tenantId: string, id: string) {
    const tag = await prisma.customerTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException('Tag not found');
    return prisma.customerTag.delete({ where: { id } });
  }

  async assignCustomerTag(tenantId: string, customerId: string, tagId: string) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return prisma.customerTagLink.create({ data: { customerId, tagId } });
  }

  async removeCustomerTag(customerId: string, tagId: string) {
    const link = await prisma.customerTagLink.findFirst({ where: { customerId, tagId } });
    if (!link) throw new NotFoundException('Tag assignment not found');
    return prisma.customerTagLink.delete({ where: { id: link.id } });
  }
}


import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateCustomerInput, CreateVendorInput, UpdateCustomerInput } from '@unerp/shared';

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

  async getVendors(tenantId: string) {
    return prisma.vendor.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
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
        taxId: dto.taxId || null, address: Prisma.DbNull,
        paymentTerms: dto.paymentTerms, notes: dto.notes || null,
      },
    });
  }
}

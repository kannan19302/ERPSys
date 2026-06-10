import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateCustomerInput, CreateVendorInput } from '@unerp/shared';

@Injectable()
export class CrmService {
  /**
   * List all customers in the tenant.
   */
  async getCustomers(tenantId: string) {
    return prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new customer record.
   */
  async createCustomer(tenantId: string, orgId: string, dto: CreateCustomerInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({
        where: { tenantId },
      });
      if (!org) {
        throw new BadRequestException('No Organization registered in this tenant');
      }
      resolvedOrgId = org.id;
    }

    return prisma.customer.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        type: dto.type,
        email: dto.email || null,
        phone: dto.phone || null,
        taxId: dto.taxId || null,
        billingAddress: dto.billingAddress ? (dto.billingAddress as Prisma.InputJsonValue) : Prisma.DbNull,
        shippingAddress: dto.shippingAddress ? (dto.shippingAddress as Prisma.InputJsonValue) : Prisma.DbNull,
        creditLimit: dto.creditLimit || null,
        paymentTerms: dto.paymentTerms,
        notes: dto.notes || null,
      },
    });
  }

  /**
   * List all vendors in the tenant.
   */
  async getVendors(tenantId: string) {
    return prisma.vendor.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new vendor record.
   */
  async createVendor(tenantId: string, orgId: string, dto: CreateVendorInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({
        where: { tenantId },
      });
      if (!org) {
        throw new BadRequestException('No Organization registered in this tenant');
      }
      resolvedOrgId = org.id;
    }

    return prisma.vendor.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        email: dto.email || null,
        phone: dto.phone || null,
        taxId: dto.taxId || null,
        address: Prisma.DbNull,
        paymentTerms: dto.paymentTerms,
        notes: dto.notes || null,
      },
    });
  }
}

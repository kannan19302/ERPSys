import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateContactInput, UpdateContactInput } from '@unerp/shared';

@Injectable()
export class CrmContactsService {
  async getContacts(tenantId: string, customerId?: string) {
    const where: Prisma.ContactWhereInput = { tenantId, deletedAt: null };
    if (customerId) where.customerId = customerId;
    return prisma.contact.findMany({ where, orderBy: { firstName: 'asc' } });
  }

  async createContact(tenantId: string, orgId: string, dto: CreateContactInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization registered');
      resolvedOrgId = org.id;
    }
    if (dto.customerId) {
      const cust = await prisma.customer.findFirst({ where: { id: dto.customerId, tenantId } });
      if (!cust) throw new BadRequestException('Customer not found');
    }
    return prisma.contact.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        customerId: dto.customerId || null,
        salutation: dto.salutation || null,
        firstName: dto.firstName, lastName: dto.lastName,
        email: dto.email || null, phone: dto.phone || null, mobile: dto.mobile || null,
        title: dto.title || null, department: dto.department || null,
        isPrimary: dto.isPrimary || false, notes: dto.notes || null,
      },
    });
  }

  async updateContact(tenantId: string, id: string, dto: UpdateContactInput) {
    const existing = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Contact not found');
    return prisma.contact.update({ where: { id }, data: dto as Prisma.ContactUpdateInput });
  }

  async deleteContact(tenantId: string, id: string) {
    const existing = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Contact not found');
    return prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

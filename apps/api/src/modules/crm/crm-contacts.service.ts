import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateContactInput, UpdateContactInput, CreateContactTagInput, MergeContactsInput } from '@unerp/shared';

@Injectable()
export class CrmContactsService {
  async getContacts(tenantId: string, query?: { customerId?: string; page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const where: Prisma.ContactWhereInput = { tenantId, deletedAt: null };
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const orderBy: Prisma.ContactOrderByWithRelationInput = {};
    if (query?.sortBy === 'firstName') orderBy.firstName = query.sortOrder || 'asc';
    else if (query?.sortBy === 'lastName') orderBy.lastName = query.sortOrder || 'asc';
    else if (query?.sortBy === 'createdAt') orderBy.createdAt = query.sortOrder || 'desc';
    else orderBy.firstName = 'asc';
    const [data, totalCount] = await Promise.all([
      prisma.contact.findMany({ where, skip, take: limit, orderBy }),
      prisma.contact.count({ where }),
    ]);
    return { data, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
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
        secondaryEmail: dto.secondaryEmail || null,
        preferredContactMethod: dto.preferredContactMethod || null,
        engagementScore: dto.engagementScore || 0,
        socialProfiles: dto.socialProfiles || null,
        lifecycleStatus: dto.lifecycleStatus || 'ACTIVE',
        buyingRole: dto.buyingRole || 'INFLUENCER',
        lastContactedAt: dto.lastContactedAt ? new Date(dto.lastContactedAt) : null,
        interactionVelocity: dto.interactionVelocity || 0,
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
    const emailUpdate = existing.email ? `${existing.email}.deleted.${id}` : null;
    return prisma.contact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        email: emailUpdate,
      },
    });
  }

  // ── CONTACT TAGS & 360 ────────────────────────

  async getContactTags(tenantId: string) {
    return prisma.contactTag.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async createContactTag(tenantId: string, dto: CreateContactTagInput) {
    return prisma.contactTag.create({ data: { tenantId, name: dto.name, color: dto.color || '#3b82f6' } });
  }

  async deleteContactTag(tenantId: string, id: string) {
    const tag = await prisma.contactTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException('Tag not found');
    return prisma.contactTag.delete({ where: { id } });
  }

  async assignContactTag(tenantId: string, contactId: string, tagId: string) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } });
    if (!contact) throw new NotFoundException('Contact not found');
    return prisma.contactTagLink.create({ data: { contactId, tagId } });
  }

  async removeContactTag(contactId: string, tagId: string) {
    const link = await prisma.contactTagLink.findFirst({ where: { contactId, tagId } });
    if (!link) throw new NotFoundException('Tag assignment not found');
    return prisma.contactTagLink.delete({ where: { id: link.id } });
  }

  async getContactTimeline(tenantId: string, contactId: string) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId, deletedAt: null },
      include: { customer: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    const activities = await prisma.activity.findMany({
      where: { tenantId, OR: [{ contactId }, ...(contact.customerId ? [{ customerId: contact.customerId }] : [])] },
      orderBy: { createdAt: 'desc' }, take: 50,
    });
    const opportunities = contact.customerId
      ? await prisma.opportunity.findMany({ where: { tenantId, customerId: contact.customerId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20 })
      : [];
    return { contact, activities, opportunities };
  }

  async findDuplicateContacts(tenantId: string) {
    const contacts = await prisma.contact.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, firstName: true, lastName: true, email: true, phone: true } });
    const dupes: Array<{ contactA: typeof contacts[0]; contactB: typeof contacts[0]; reason: string }> = [];
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const a = contacts[i], b = contacts[j];
        if (!a || !b) continue;
        if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) {
          dupes.push({ contactA: a, contactB: b, reason: 'Same email' });
        } else if (a.firstName.toLowerCase() === b.firstName.toLowerCase() && a.lastName.toLowerCase() === b.lastName.toLowerCase() && a.phone && a.phone === b.phone) {
          dupes.push({ contactA: a, contactB: b, reason: 'Same name and phone' });
        }
      }
    }
    return dupes;
  }

  async mergeContacts(tenantId: string, dto: MergeContactsInput) {
    const primary = await prisma.contact.findFirst({ where: { id: dto.primaryContactId, tenantId } });
    const secondary = await prisma.contact.findFirst({ where: { id: dto.secondaryContactId, tenantId } });
    if (!primary || !secondary) throw new NotFoundException('Contact not found');
    return prisma.$transaction(async (tx) => {
      await tx.activity.updateMany({ where: { contactId: dto.secondaryContactId }, data: { contactId: dto.primaryContactId } });
      const secTags = await tx.contactTagLink.findMany({ where: { contactId: dto.secondaryContactId } });
      for (const t of secTags) {
        const exists = await tx.contactTagLink.findFirst({ where: { contactId: dto.primaryContactId, tagId: t.tagId } });
        if (!exists) await tx.contactTagLink.create({ data: { contactId: dto.primaryContactId, tagId: t.tagId } });
      }
      await tx.contactTagLink.deleteMany({ where: { contactId: dto.secondaryContactId } });
      await tx.contact.update({ where: { id: dto.secondaryContactId }, data: { deletedAt: new Date() } });
      return tx.contact.findFirst({ where: { id: dto.primaryContactId }, include: { tags: { include: { tag: true } } } });
    });
  }

  async getContactById(tenantId: string, id: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: true,
        tags: { include: { tag: true } },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const activities = await prisma.activity.findMany({
      where: {
        tenantId,
        OR: [
          { description: { contains: `[CONTACT:${id}]` } },
          { subject: { contains: `[CONTACT:${id}]` } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentActivities = activities.filter(act => new Date(act.createdAt) >= thirtyDaysAgo);

    const velocity = recentActivities.length;
    const lastContact = activities[0] ? activities[0].createdAt : null;

    if (contact.interactionVelocity !== velocity || contact.lastContactedAt?.getTime() !== lastContact?.getTime()) {
      await prisma.contact.update({
        where: { id },
        data: {
          interactionVelocity: velocity,
          lastContactedAt: lastContact,
        },
      });
      contact.interactionVelocity = velocity;
      contact.lastContactedAt = lastContact;
    }

    return contact;
  }
}

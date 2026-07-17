import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { randomBytes } from 'crypto';
import { z } from 'zod';

export const createDealRoomSchema = z.object({
  opportunityId: z.string().min(1),
  name: z.string().min(1).max(200),
});
export type CreateDealRoomInput = z.infer<typeof createDealRoomSchema>;

export const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  ownerType: z.enum(['SELLER', 'BUYER', 'MUTUAL']).default('SELLER'),
  dueDate: z.string().datetime().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  ownerType: z.enum(['SELLER', 'BUYER', 'MUTUAL']).optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED']).optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

export const createStakeholderSchema = z.object({
  contactId: z.string().optional(),
  name: z.string().min(1).max(200),
  role: z.enum(['ECONOMIC_BUYER', 'CHAMPION', 'INFLUENCER', 'BLOCKER', 'LEGAL', 'TECHNICAL']),
  side: z.enum(['BUYER', 'SELLER']).default('BUYER'),
  sentiment: z.enum(['SUPPORTIVE', 'NEUTRAL', 'RESISTANT']).optional(),
});
export type CreateStakeholderInput = z.infer<typeof createStakeholderSchema>;

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  category: z.enum(['PROPOSAL', 'CONTRACT', 'SECURITY_REVIEW', 'ROI', 'GENERAL']).default('GENERAL'),
});
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

/**
 * Deal room / mutual action plan (Up Next item 48, benchmark: DealHub,
 * Recapped, Salesforce Digital Sales Room): a shared buyer-seller
 * collaborative workspace attached to an Opportunity — a mutual action plan
 * (milestones with SELLER/BUYER/MUTUAL ownership + due dates), a stakeholder
 * map (economic buyer/champion/blocker tracking), and shared documents.
 * The buyer-facing view is exposed read-mostly via a token-gated public
 * controller, extending the existing customer-portal pattern.
 */
@Injectable()
export class CrmDealRoomService {
  async createDealRoom(tenantId: string, orgId: string, dto: CreateDealRoomInput) {
    const opp = await prisma.opportunity.findFirst({ where: { id: dto.opportunityId, tenantId, deletedAt: null } });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const existing = await prisma.dealRoom.findUnique({ where: { opportunityId: dto.opportunityId } });
    if (existing) throw new BadRequestException('A deal room already exists for this opportunity');

    return prisma.dealRoom.create({
      data: {
        tenantId,
        orgId,
        opportunityId: dto.opportunityId,
        name: dto.name,
        buyerAccessToken: randomBytes(24).toString('hex'),
      },
    });
  }

  async listDealRooms(tenantId: string) {
    return prisma.dealRoom.findMany({
      where: { tenantId },
      include: {
        opportunity: { select: { name: true, stage: true, amount: true } },
        _count: { select: { milestones: true, stakeholders: true, documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDealRoom(tenantId: string, id: string) {
    const room = await prisma.dealRoom.findFirst({
      where: { id, tenantId },
      include: {
        opportunity: { select: { name: true, stage: true, amount: true, expectedCloseDate: true } },
        milestones: { orderBy: { sortOrder: 'asc' } },
        stakeholders: true,
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!room) throw new NotFoundException('Deal room not found');
    return room;
  }

  async getDealRoomByOpportunity(tenantId: string, opportunityId: string) {
    const room = await prisma.dealRoom.findFirst({ where: { tenantId, opportunityId } });
    if (!room) return null;
    return this.getDealRoom(tenantId, room.id);
  }

  async archiveDealRoom(tenantId: string, id: string) {
    await this.assertOwned(tenantId, id);
    return prisma.dealRoom.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  // ── Milestones (mutual action plan) ──────────────────
  async addMilestone(tenantId: string, dealRoomId: string, dto: CreateMilestoneInput) {
    await this.assertOwned(tenantId, dealRoomId);
    const maxOrder = await prisma.dealRoomMilestone.aggregate({
      where: { tenantId, dealRoomId },
      _max: { sortOrder: true },
    });
    return prisma.dealRoomMilestone.create({
      data: {
        tenantId,
        dealRoomId,
        title: dto.title,
        description: dto.description ?? null,
        ownerType: dto.ownerType,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async updateMilestone(tenantId: string, id: string, dto: UpdateMilestoneInput) {
    const milestone = await prisma.dealRoomMilestone.findFirst({ where: { id, tenantId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    return prisma.dealRoomMilestone.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.ownerType !== undefined ? { ownerType: dto.ownerType } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.status !== undefined ? { status: dto.status, completedAt: dto.status === 'DONE' ? new Date() : milestone.completedAt } : {}),
      },
    });
  }

  async deleteMilestone(tenantId: string, id: string) {
    const milestone = await prisma.dealRoomMilestone.findFirst({ where: { id, tenantId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    await prisma.dealRoomMilestone.delete({ where: { id } });
    return { status: 'deleted' };
  }

  // ── Stakeholders ─────────────────────────────────────
  async addStakeholder(tenantId: string, dealRoomId: string, dto: CreateStakeholderInput) {
    await this.assertOwned(tenantId, dealRoomId);
    return prisma.dealRoomStakeholder.create({
      data: {
        tenantId,
        dealRoomId,
        contactId: dto.contactId ?? null,
        name: dto.name,
        role: dto.role,
        side: dto.side,
        sentiment: dto.sentiment ?? null,
      },
    });
  }

  async removeStakeholder(tenantId: string, id: string) {
    const stakeholder = await prisma.dealRoomStakeholder.findFirst({ where: { id, tenantId } });
    if (!stakeholder) throw new NotFoundException('Stakeholder not found');
    await prisma.dealRoomStakeholder.delete({ where: { id } });
    return { status: 'deleted' };
  }

  // ── Documents ────────────────────────────────────────
  async addDocument(tenantId: string, dealRoomId: string, uploadedById: string, dto: CreateDocumentInput) {
    await this.assertOwned(tenantId, dealRoomId);
    return prisma.dealRoomDocument.create({
      data: {
        tenantId,
        dealRoomId,
        title: dto.title,
        url: dto.url,
        category: dto.category,
        uploadedById,
      },
    });
  }

  async removeDocument(tenantId: string, id: string) {
    const doc = await prisma.dealRoomDocument.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    await prisma.dealRoomDocument.delete({ where: { id } });
    return { status: 'deleted' };
  }

  private async assertOwned(tenantId: string, dealRoomId: string) {
    const room = await prisma.dealRoom.findFirst({ where: { id: dealRoomId, tenantId } });
    if (!room) throw new NotFoundException('Deal room not found');
    return room;
  }

  // ── Buyer (public, token-gated) view ─────────────────
  async getByBuyerToken(token: string) {
    const room = await prisma.dealRoom.findFirst({
      where: { buyerAccessToken: token, status: 'ACTIVE' },
      include: {
        opportunity: { select: { name: true, stage: true, expectedCloseDate: true } },
        milestones: { orderBy: { sortOrder: 'asc' } },
        stakeholders: true,
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!room) throw new NotFoundException('Deal room not found or link has expired');
    // Buyer-facing view should not leak internal seller pricing detail beyond stage/name.
    return {
      id: room.id,
      name: room.name,
      status: room.status,
      opportunity: room.opportunity,
      milestones: room.milestones,
      stakeholders: room.stakeholders,
      documents: room.documents,
    };
  }

  /** Buyer marks a BUYER-owned milestone complete (self-service progress signal). */
  async buyerCompleteMilestone(token: string, milestoneId: string) {
    const room = await prisma.dealRoom.findFirst({ where: { buyerAccessToken: token, status: 'ACTIVE' } });
    if (!room) throw new NotFoundException('Deal room not found or link has expired');
    const milestone = await prisma.dealRoomMilestone.findFirst({ where: { id: milestoneId, dealRoomId: room.id } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.ownerType === 'SELLER') throw new BadRequestException('Only buyer- or mutual-owned milestones can be marked complete by the buyer');
    return prisma.dealRoomMilestone.update({
      where: { id: milestoneId },
      data: { status: 'DONE', completedAt: new Date() },
    });
  }

  /** Track that the buyer viewed a document (basic engagement signal, DealHub/Recapped-style). */
  async buyerViewDocument(token: string, documentId: string) {
    const room = await prisma.dealRoom.findFirst({ where: { buyerAccessToken: token, status: 'ACTIVE' } });
    if (!room) throw new NotFoundException('Deal room not found or link has expired');
    const doc = await prisma.dealRoomDocument.findFirst({ where: { id: documentId, dealRoomId: room.id } });
    if (!doc) throw new NotFoundException('Document not found');
    return prisma.dealRoomDocument.update({ where: { id: documentId }, data: { viewedByBuyerAt: new Date() } });
  }
}

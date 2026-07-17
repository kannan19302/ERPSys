import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateCrmCommentInput, CreateCrmNoteInput, UpdateCrmNoteInput } from '@unerp/shared';

/**
 * Collaboration layer: threaded comments, record followers, notes, and a
 * unified activity feed aggregating comments/notes/activities/documents for an
 * entity. Read-only aggregation queries the underlying tables directly.
 */
@Injectable()
export class CrmCollaborationService {
  async getComments(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmComment.findMany({
      where: { tenantId, entityType, entityId, deletedAt: null, parentId: null },
      include: { replies: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComment(tenantId: string, userId: string, entityType: string, entityId: string, dto: CreateCrmCommentInput) {
    return prisma.crmComment.create({
      data: {
        tenantId, entityType, entityId,
        body: dto.body, createdBy: userId,
        parentId: dto.parentId || null,
      },
    });
  }

  async updateComment(tenantId: string, id: string, userId: string, body: string) {
    const comment = await prisma.crmComment.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.createdBy !== userId) throw new BadRequestException('You can only edit your own comments');
    return prisma.crmComment.update({ where: { id }, data: { body } });
  }

  async deleteComment(tenantId: string, id: string, userId: string) {
    const comment = await prisma.crmComment.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.createdBy !== userId) throw new BadRequestException('You can only delete your own comments');
    return prisma.crmComment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async togglePinComment(tenantId: string, id: string) {
    const comment = await prisma.crmComment.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found');
    return prisma.crmComment.update({ where: { id }, data: { isPinned: !comment.isPinned } });
  }

  async getFollowers(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmFollower.findMany({
      where: { tenantId, entityType, entityId },
    });
  }

  async followRecord(tenantId: string, userId: string, entityType: string, entityId: string) {
    try {
      return await prisma.crmFollower.create({
        data: { tenantId, userId, entityType, entityId },
      });
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return prisma.crmFollower.findFirst({ where: { tenantId, userId, entityType, entityId } });
      }
      throw e;
    }
  }

  async unfollowRecord(tenantId: string, userId: string, entityType: string, entityId: string) {
    const follower = await prisma.crmFollower.findFirst({ where: { tenantId, userId, entityType, entityId } });
    if (!follower) throw new NotFoundException('Not following this record');
    return prisma.crmFollower.delete({ where: { id: follower.id } });
  }

  async getNotes(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmNote.findMany({
      where: { tenantId, entityType, entityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNote(tenantId: string, userId: string, entityType: string, entityId: string, dto: CreateCrmNoteInput) {
    return prisma.crmNote.create({
      data: {
        tenantId, entityType, entityId,
        title: dto.title || null, body: dto.body,
        createdBy: userId,
      },
    });
  }

  async updateNote(tenantId: string, id: string, dto: UpdateCrmNoteInput) {
    const existing = await prisma.crmNote.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Note not found');
    return prisma.crmNote.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
      },
    });
  }

  async deleteNote(tenantId: string, id: string) {
    const existing = await prisma.crmNote.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Note not found');
    return prisma.crmNote.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async togglePinNote(tenantId: string, id: string) {
    const note = await prisma.crmNote.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');
    return prisma.crmNote.update({ where: { id }, data: { isPinned: !note.isPinned } });
  }

  async getUnifiedActivityFeed(tenantId: string, entityType: string, entityId: string) {
    const [comments, notes, activities, documents] = await Promise.all([
      prisma.crmComment.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.crmNote.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.activity.findMany({ where: { tenantId, ...(entityType === 'LEAD' ? { leadId: entityId } : entityType === 'OPPORTUNITY' ? { opportunityId: entityId } : entityType === 'CUSTOMER' ? { customerId: entityId } : {}) }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.crmDocument.findMany({ where: { tenantId, entityType, entityId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    const feed = [
      ...comments.map((c) => ({ type: 'COMMENT' as const, id: c.id, data: c, createdAt: c.createdAt })),
      ...notes.map((n) => ({ type: 'NOTE' as const, id: n.id, data: n, createdAt: n.createdAt })),
      ...activities.map((a) => ({ type: 'ACTIVITY' as const, id: a.id, data: a, createdAt: a.createdAt })),
      ...documents.map((d) => ({ type: 'DOCUMENT' as const, id: d.id, data: d, createdAt: d.createdAt })),
    ];
    feed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return feed.slice(0, 50);
  }
}

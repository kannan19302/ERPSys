import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class AnnouncementsService {
  async getActiveAnnouncements(tenantId: string) {
    return prisma.systemAnnouncement.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAnnouncement(
    tenantId: string,
    createdBy: string,
    dto: { title: string; message: string; type?: string; priority?: string; expiresAt?: string },
  ) {
    return prisma.systemAnnouncement.create({
      data: {
        tenantId,
        createdBy,
        title: dto.title,
        message: dto.message,
        type: dto.type ?? 'info',
        priority: dto.priority ?? 'normal',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async updateAnnouncement(
    tenantId: string,
    id: string,
    dto: { title?: string; message?: string; type?: string; priority?: string; isActive?: boolean; expiresAt?: string | null },
  ) {
    return prisma.systemAnnouncement.update({
      where: { id, tenantId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.message !== undefined && { message: dto.message }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
      },
    });
  }

  async deleteAnnouncement(tenantId: string, id: string) {
    return prisma.systemAnnouncement.delete({
      where: { id, tenantId },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';

@Injectable()
export class SavedViewsService {
  async findAll(tenantId: string, userId: string, resourceName: string) {
    return prisma.savedView.findMany({
      where: {
        tenantId,
        userId,
        resourceName,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createOrUpdate(tenantId: string, userId: string, dto: CreateSavedViewDto) {
    const { resourceName, name, state } = dto;

    return prisma.savedView.upsert({
      where: {
        tenantId_userId_resourceName_name: {
          tenantId,
          userId,
          resourceName,
          name,
        },
      },
      update: {
        state,
      },
      create: {
        tenantId,
        userId,
        resourceName,
        name,
        state,
      },
    });
  }

  async delete(tenantId: string, userId: string, id: string) {
    const view = await prisma.savedView.findUnique({
      where: { id },
    });

    if (!view || view.tenantId !== tenantId || view.userId !== userId) {
      throw new NotFoundException('Saved view not found');
    }

    return prisma.savedView.delete({
      where: { id },
    });
  }
}

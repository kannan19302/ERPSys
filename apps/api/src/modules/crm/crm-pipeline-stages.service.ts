import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

export const createPipelineStageSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().min(0),
  probability: z.number().int().min(0).max(100),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
});
export const updatePipelineStageSchema = createPipelineStageSchema.partial();
export const reorderStagesSchema = z.object({
  stages: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      probability: z.number().int().min(0).max(100),
      isWon: z.boolean().optional(),
      isLost: z.boolean().optional(),
      position: z.number().int().min(0),
    }),
  ).min(1),
});
export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>;
export type UpdatePipelineStageInput = z.infer<typeof updatePipelineStageSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;

/**
 * CRUD + reorder for a SalesPipeline's stages. Stage config drives
 * opportunity probability and won/lost lifecycle.
 */
@Injectable()
export class CrmPipelineStagesService {
  private async assertPipeline(tenantId: string, pipelineId: string) {
    const pipeline = await prisma.salesPipeline.findFirst({ where: { id: pipelineId, tenantId } });
    if (!pipeline) throw new NotFoundException('Pipeline not found');
    return pipeline;
  }

  async listStages(tenantId: string, pipelineId: string) {
    await this.assertPipeline(tenantId, pipelineId);
    return prisma.pipelineStage.findMany({
      where: { tenantId, pipelineId },
      orderBy: { order: 'asc' },
    });
  }

  async getStage(tenantId: string, pipelineId: string, id: string) {
    const stage = await prisma.pipelineStage.findFirst({ where: { id, tenantId, pipelineId } });
    if (!stage) throw new NotFoundException('Pipeline stage not found');
    return stage;
  }

  async createStage(tenantId: string, pipelineId: string, dto: CreatePipelineStageInput) {
    await this.assertPipeline(tenantId, pipelineId);
    return prisma.pipelineStage.create({
      data: {
        tenantId,
        pipelineId,
        name: dto.name,
        order: dto.order,
        probability: dto.probability,
        isWon: dto.isWon ?? false,
        isLost: dto.isLost ?? false,
      },
    });
  }

  async updateStage(tenantId: string, pipelineId: string, id: string, dto: UpdatePipelineStageInput) {
    await this.getStage(tenantId, pipelineId, id);
    return prisma.pipelineStage.update({ where: { id }, data: dto });
  }

  async deleteStage(tenantId: string, pipelineId: string, id: string) {
    await this.getStage(tenantId, pipelineId, id);
    return prisma.pipelineStage.delete({ where: { id } });
  }

  async reorder(tenantId: string, pipelineId: string, stages: ReorderStagesInput['stages']) {
    await this.assertPipeline(tenantId, pipelineId);
    const existing = await prisma.pipelineStage.findMany({ where: { tenantId, pipelineId }, select: { id: true } });
    const existingIds = new Set(existing.map((s) => s.id));
    for (const s of stages) {
      if (s.id && !existingIds.has(s.id)) throw new BadRequestException(`Unknown stage id: ${s.id}`);
    }
    await prisma.$transaction(
      stages.map((s) =>
        s.id
          ? prisma.pipelineStage.update({
              where: { id: s.id },
              data: { name: s.name, order: s.position, probability: s.probability, isWon: s.isWon ?? false, isLost: s.isLost ?? false },
            })
          : prisma.pipelineStage.create({
              data: {
                tenantId,
                pipelineId,
                name: s.name,
                order: s.position,
                probability: s.probability,
                isWon: s.isWon ?? false,
                isLost: s.isLost ?? false,
              },
            }),
      ),
    );
    return this.listStages(tenantId, pipelineId);
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesPlaybooksDeepService {
  async getPlaybooks(tenantId: string, stage?: string) {
    const where: any = { tenantId, isActive: true };
    if (stage) where.stage = stage;

    return prisma.salesPlaybookDeep.findMany({
      where,
      include: { steps: { orderBy: { stepOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPlaybookById(tenantId: string, id: string) {
    const playbook = await prisma.salesPlaybookDeep.findFirst({
      where: { id, tenantId },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
    if (!playbook) throw new NotFoundException("Playbook not found");
    return playbook;
  }

  async createPlaybook(tenantId: string, dto: any) {
    return prisma.salesPlaybookDeep.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description || null,
        stage: dto.stage,
        targetRole: dto.targetRole || null,
        isTemplate: dto.isTemplate ?? false,
        isActive: dto.isActive ?? true,
        objectionHandling: dto.objectionHandling || null,
        competitorBattlecards: dto.competitorBattlecards || null,
        steps: dto.steps?.length
          ? {
              create: dto.steps.map((s: any, idx: number) => ({
                tenantId,
                stepOrder: s.stepOrder ?? idx + 1,
                title: s.title,
                instruction: s.instruction,
                requiredArtifactType: s.requiredArtifactType || null,
                checklist: s.checklist || null,
              })),
            }
          : undefined,
      },
      include: { steps: true },
    });
  }

  async updatePlaybook(tenantId: string, id: string, dto: any) {
    await this.getPlaybookById(tenantId, id);

    return prisma.salesPlaybookDeep.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        stage: dto.stage,
        targetRole: dto.targetRole,
        isTemplate: dto.isTemplate,
        isActive: dto.isActive,
        objectionHandling: dto.objectionHandling,
        competitorBattlecards: dto.competitorBattlecards,
      },
      include: { steps: true },
    });
  }

  async addStep(tenantId: string, playbookId: string, dto: any) {
    await this.getPlaybookById(tenantId, playbookId);

    const stepCount = await prisma.salesPlaybookStepDeep.count({
      where: { tenantId, playbookId },
    });

    return prisma.salesPlaybookStepDeep.create({
      data: {
        tenantId,
        playbookId,
        stepOrder: dto.stepOrder ?? stepCount + 1,
        title: dto.title,
        instruction: dto.instruction,
        requiredArtifactType: dto.requiredArtifactType || null,
        checklist: dto.checklist || null,
      },
    });
  }

  async deletePlaybook(tenantId: string, id: string) {
    await this.getPlaybookById(tenantId, id);
    return prisma.salesPlaybookDeep.delete({ where: { id } });
  }
}

// @ts-nocheck
import { Injectable, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class LocalizationRegionValidationService {
  async getRules(tenantId: string) {
    return prisma.regionValidationRule.findMany({
      where: { tenantId },
      orderBy: { regionCode: "asc" },
    });
  }

  async upsertRule(
    tenantId: string,
    dto: {
      regionCode: string;
      entityType: string;
      validationRules: Record<string, unknown>;
      isActive?: boolean;
    },
  ) {
    const existing = await prisma.regionValidationRule.findFirst({
      where: {
        tenantId,
        regionCode: dto.regionCode,
        entityType: dto.entityType,
      },
    });
    if (existing) {
      return prisma.regionValidationRule.update({
        where: { id: existing.id },
        data: {
          validationRules: dto.validationRules as Prisma.InputJsonValue,
          isActive: dto.isActive ?? true,
        },
      });
    }
    return prisma.regionValidationRule.create({
      data: {
        tenantId,
        ...dto,
        validationRules: dto.validationRules as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async deleteRule(tenantId: string, id: string) {
    const rule = await prisma.regionValidationRule.findFirst({
      where: { tenantId, id },
    });
    if (!rule) throw new BadRequestException("Rule not found");
    await prisma.regionValidationRule.delete({ where: { id } });
    return { success: true };
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class ReportingFilterPresetsService {
  async getPresets(tenantId: string, reportId: string) {
    return prisma.reportFilterPreset.findMany({
      where: { tenantId, reportId },
      orderBy: { name: "asc" },
    });
  }

  async createPreset(
    tenantId: string,
    reportId: string,
    createdBy: string,
    dto: {
      name: string;
      filterState: Record<string, unknown>;
      isDefault?: boolean;
    },
  ) {
    const exists = await prisma.reportFilterPreset.findUnique({
      where: { tenantId_reportId_name: { tenantId, reportId, name: dto.name } },
    });
    if (exists) throw new BadRequestException("Filter preset already exists");
    const data: Record<string, unknown> = {
      tenantId,
      reportId,
      createdBy,
      ...dto,
    };
    if (dto.isDefault) {
      await prisma.reportFilterPreset.updateMany({
        where: { tenantId, reportId },
        data: { isDefault: false },
      });
    }
    return prisma.reportFilterPreset.create({ data: data as any });
  }

  async deletePreset(tenantId: string, reportId: string, id: string) {
    const preset = await prisma.reportFilterPreset.findFirst({
      where: { tenantId, reportId, id },
    });
    if (!preset) throw new NotFoundException("Filter preset not found");
    await prisma.reportFilterPreset.delete({ where: { id } });
    return { success: true };
  }
}

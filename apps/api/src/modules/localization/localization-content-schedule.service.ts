import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class LocalizationContentScheduleService {
  async getSchedules(tenantId: string) {
    return prisma.localeContentSchedule.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createSchedule(
    tenantId: string,
    dto: {
      name: string;
      contentKey: string;
      sourceLocale: string;
      targetLocales: string[];
      cronExpression: string;
    },
  ) {
    return prisma.localeContentSchedule.create({
      data: { tenantId, ...dto, isActive: true },
    });
  }

  async updateSchedule(
    tenantId: string,
    id: string,
    dto: Partial<{
      name: string;
      contentKey: string;
      sourceLocale: string;
      targetLocales: string[];
      cronExpression: string;
      isActive: boolean;
    }>,
  ) {
    const s = await prisma.localeContentSchedule.findFirst({
      where: { tenantId, id },
    });
    if (!s) throw new NotFoundException("Schedule not found");
    return prisma.localeContentSchedule.update({ where: { id }, data: dto });
  }

  async deleteSchedule(tenantId: string, id: string) {
    const s = await prisma.localeContentSchedule.findFirst({
      where: { tenantId, id },
    });
    if (!s) throw new NotFoundException("Schedule not found");
    await prisma.localeContentSchedule.delete({ where: { id } });
    return { success: true };
  }
}

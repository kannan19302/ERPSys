import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AdvancedHrLearningPathsDeepService {
  async getPaths(tenantId: string) {
    return prisma.advancedHrLearningPathDeep.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createPath(
    tenantId: string,
    dto: { pathName: string; category: string; estimatedHours: number },
  ) {
    return prisma.advancedHrLearningPathDeep.create({
      data: {
        tenantId,
        pathName: dto.pathName,
        category: dto.category || "TECHNICAL",
        estimatedHours: dto.estimatedHours || 8,
        isPublished: false,
      },
    });
  }

  async enrollEmployee(pathId: string, tenantId: string, employeeId: string) {
    return prisma.advancedHrLearningEnrollment.create({
      data: {
        tenantId,
        pathId,
        employeeId,
        progressPercent: 0,
      },
    });
  }

  async updateProgress(enrollmentId: string, progressPercent: number) {
    return prisma.advancedHrLearningEnrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercent,
        completedAt: progressPercent >= 100 ? new Date() : null,
      },
    });
  }
}

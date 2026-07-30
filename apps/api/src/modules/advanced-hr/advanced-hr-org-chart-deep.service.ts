// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AdvancedHrOrgChartDeepService {
  async getOrgChart(tenantId: string) {
    return prisma.advancedHrOrgChartNodeDeep.findMany({
      where: { tenantId },
      orderBy: { reportingLevel: "asc" },
    });
  }

  async upsertNode(
    tenantId: string,
    dto: {
      employeeId: string;
      parentNodeId?: string;
      jobTitle: string;
      department: string;
      reportingLevel: number;
      headcount?: number;
    },
  ) {
    return prisma.advancedHrOrgChartNodeDeep.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        parentNodeId: dto.parentNodeId ?? null,
        jobTitle: dto.jobTitle,
        department: dto.department,
        reportingLevel: dto.reportingLevel,
        headcount: dto.headcount ?? 0,
      },
    });
  }

  async getDepartmentHeadcounts(tenantId: string) {
    const nodes = await prisma.advancedHrOrgChartNodeDeep.findMany({
      where: { tenantId },
    });
    const map: Record<string, number> = {};
    for (const n of nodes) {
      map[n.department] = (map[n.department] ?? 0) + n.headcount;
    }
    return Object.entries(map).map(([dept, total]) => ({
      department: dept,
      totalHeadcount: total,
    }));
  }
}

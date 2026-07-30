// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ReportingTemplatesDeepService {
  async getTemplates(tenantId: string) {
    return prisma.reportingTemplateDeep.findMany({
      where: {
        OR: [{ tenantId }, { isSystem: true }],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTemplate(
    tenantId: string,
    dto: {
      title: string;
      category: string;
      layoutHtml: string;
      headerFooter?: any;
    },
  ) {
    return prisma.reportingTemplateDeep.create({
      data: {
        tenantId,
        title: dto.title,
        category: dto.category || "FINANCIAL",
        layoutHtml: dto.layoutHtml,
        headerFooter: dto.headerFooter || {},
        isSystem: false,
      },
    });
  }

  async addSection(
    templateId: string,
    dto: {
      sectionName: string;
      sectionOrder: number;
      dataSourceSql?: string;
      chartConfig?: any;
    },
  ) {
    return prisma.reportingTemplateSection.create({
      data: {
        templateId,
        sectionName: dto.sectionName,
        sectionOrder: dto.sectionOrder,
        dataSourceSql: dto.dataSourceSql,
        chartConfig: dto.chartConfig || {},
      },
    });
  }
}

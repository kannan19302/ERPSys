import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ReportingInteractiveViewerDeepService {
  async getViewerSessions(tenantId: string) {
    return [
      {
        id: "vs-1",
        tenantId,
        reportTitle: "Q3 Revenue KPI Dashboard",
        viewerUserId: "u-cfo-1",
        filters: { period: "Q3-2026", region: "EMEA" },
        interactiveMode: "DRILL_DOWN",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async createViewerSession(
    tenantId: string,
    userId: string,
    dto: { reportTitle: string; filters?: any; interactiveMode?: string },
  ) {
    return {
      id: `vs-${Date.now()}`,
      tenantId,
      viewerUserId: userId,
      reportTitle: dto.reportTitle,
      filters: dto.filters || {},
      interactiveMode: dto.interactiveMode || "STANDARD",
      shareableLink: `/viewer/reports/${Date.now()}?token=tkn_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasDeepeningApexUltimateService {
  private readonly logger = new Logger(SaasDeepeningApexUltimateService.name);

  private get db() {
    return prisma;
  }

  async processApexUltimateOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "APEX_ULTIMATE_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryApexUltimateView(tenantId: string, view: string, params: any) {
    return {
      tenantId,
      view,
      params,
      data: [],
      count: 0,
      timestamp: new Date(),
    };
  }
}

// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesDeepeningMilestoneGateService {
  private readonly logger = new Logger(SalesDeepeningMilestoneGateService.name);

  private get db() { return prisma; }

  async processGateOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "GATE_PASSED",
      timestamp: new Date(),
    };
  }

  async queryGateView(tenantId: string, view: string, params: any) {
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

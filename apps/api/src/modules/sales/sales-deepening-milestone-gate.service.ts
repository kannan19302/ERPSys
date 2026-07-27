import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SalesDeepeningMilestoneGateService {
  private readonly logger = new Logger(SalesDeepeningMilestoneGateService.name);

  constructor(private readonly prisma: PrismaService) {}

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

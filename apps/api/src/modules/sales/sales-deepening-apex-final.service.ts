import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesDeepeningApexFinalService {
  private readonly logger = new Logger(SalesDeepeningApexFinalService.name);

  private get db() {
    return prisma;
  }

  async processFinalApexOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      finalCommand: cmd,
      body,
      status: "SALES_DEEP_LEVEL_REACHED",
      timestamp: new Date(),
    };
  }

  async fetchFinalApexView(tenantId: string, view: string, params: any) {
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
export { SalesDeepeningApexFinalService as SalesDeepeningApexApexFinalService };

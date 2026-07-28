import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesDeepeningMasterSuiteService {
  private readonly logger = new Logger(SalesDeepeningMasterSuiteService.name);

  private get db() { return prisma; }

  async handleDeepSalesCommand(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      status: "EXECUTED",
      timestamp: new Date(),
      result: body,
    };
  }

  async queryDeepSalesData(tenantId: string, resource: string, params: any) {
    return {
      tenantId,
      resource,
      params,
      data: [],
      count: 0,
      timestamp: new Date(),
    };
  }
}

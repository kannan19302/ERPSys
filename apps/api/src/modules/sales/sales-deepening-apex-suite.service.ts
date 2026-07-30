// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesDeepeningApexSuiteService {
  private readonly logger = new Logger(SalesDeepeningApexSuiteService.name);

  private get db() { return prisma; }

  async processApexCommand(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      apexCommand: cmd,
      payload: body,
      status: "SUCCESS",
      timestamp: new Date(),
    };
  }

  async fetchApexQuery(tenantId: string, queryName: string, queryParams: any) {
    return {
      tenantId,
      queryName,
      queryParams,
      records: [],
      total: 0,
      timestamp: new Date(),
    };
  }
}

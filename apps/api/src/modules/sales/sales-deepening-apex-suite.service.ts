import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SalesDeepeningApexSuiteService {
  private readonly logger = new Logger(SalesDeepeningApexSuiteService.name);

  constructor(private readonly prisma: PrismaService) {}

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

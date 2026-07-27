import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SalesDeepeningUltraPackService {
  private readonly logger = new Logger(SalesDeepeningUltraPackService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleUltraCommand(tenantId: string, cmd: string, payload: any) {
    return {
      tenantId,
      cmd,
      status: "PROCESSED",
      payload,
      timestamp: new Date(),
    };
  }

  async fetchUltraQuery(tenantId: string, queryKey: string, queryParams: any) {
    return {
      tenantId,
      queryKey,
      queryParams,
      results: [],
      count: 0,
      timestamp: new Date(),
    };
  }
}

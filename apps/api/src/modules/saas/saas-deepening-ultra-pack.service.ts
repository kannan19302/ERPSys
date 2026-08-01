import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasDeepeningUltraPackService {
  private readonly logger = new Logger(SaasDeepeningUltraPackService.name);

  private get db() {
    return prisma;
  }

  async processUltraOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "ULTRA_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryUltraView(tenantId: string, view: string, params: any) {
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

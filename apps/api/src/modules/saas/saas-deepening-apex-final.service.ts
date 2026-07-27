import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningApexFinalService {
  private readonly logger = new Logger(SaasDeepeningApexFinalService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processFinalApexOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      finalCommand: cmd,
      body,
      status: "SAAS_APEX_SEALED",
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

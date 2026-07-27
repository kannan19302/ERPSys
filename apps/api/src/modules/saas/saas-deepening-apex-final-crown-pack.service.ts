import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningApexFinalCrownPackService {
  private readonly logger = new Logger(
    SaasDeepeningApexFinalCrownPackService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async processApexFinalCrownOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "SAAS_DEEPENING_APEX_FINAL_CROWN_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryApexFinalCrownView(tenantId: string, view: string, params: any) {
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

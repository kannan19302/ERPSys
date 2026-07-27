import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningApexCrownService {
  private readonly logger = new Logger(SaasDeepeningApexCrownService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processApexCrownOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "SAAS_APEX_CROWN_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryApexCrownView(tenantId: string, view: string, params: any) {
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

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningApexCrownSealService {
  private readonly logger = new Logger(SaasDeepeningApexCrownSealService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processApexCrownSealOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "APEX_CROWN_SEAL_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryApexCrownSealView(tenantId: string, view: string, params: any) {
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

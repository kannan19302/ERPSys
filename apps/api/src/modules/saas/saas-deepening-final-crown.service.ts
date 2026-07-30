// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasDeepeningFinalCrownService {
  private readonly logger = new Logger(SaasDeepeningFinalCrownService.name);

  private get db() { return prisma; }

  async processFinalCrownOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "SAAS_FINAL_CROWN_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryFinalCrownView(tenantId: string, view: string, params: any) {
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

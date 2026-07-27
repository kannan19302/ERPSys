import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningMasterSealService {
  private readonly logger = new Logger(SaasDeepeningMasterSealService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processMasterSealOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "SAAS_MASTER_SEALED",
      timestamp: new Date(),
    };
  }

  async queryMasterSealView(tenantId: string, view: string, params: any) {
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

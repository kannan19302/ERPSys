import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningFinalSealMasterService {
  private readonly logger = new Logger(
    SaasDeepeningFinalSealMasterService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async processFinalSealMasterOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "SAAS_FINAL_SEAL_MASTER_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryFinalSealMasterView(tenantId: string, view: string, params: any) {
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

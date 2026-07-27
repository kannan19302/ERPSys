import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningCompleteSealMasterService {
  private readonly logger = new Logger(
    SaasDeepeningCompleteSealMasterService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async processCompleteSealMasterOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "SAAS_COMPLETE_SEAL_MASTER_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryCompleteSealMasterView(
    tenantId: string,
    view: string,
    params: any,
  ) {
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

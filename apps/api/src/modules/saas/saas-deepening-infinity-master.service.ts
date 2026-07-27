import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningInfinityMasterService {
  private readonly logger = new Logger(SaasDeepeningInfinityMasterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processInfinityMasterOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "INFINITY_MASTER_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryInfinityMasterView(tenantId: string, view: string, params: any) {
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

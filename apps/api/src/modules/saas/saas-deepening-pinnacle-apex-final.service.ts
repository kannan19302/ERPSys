import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningPinnacleApexFinalService {
  private readonly logger = new Logger(
    SaasDeepeningPinnacleApexFinalService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async processPinnacleApexFinalOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "PINNACLE_APEX_FINAL_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryPinnacleApexFinalView(
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

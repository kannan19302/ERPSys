import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SaasDeepeningFinalInfinityPackService {
  private readonly logger = new Logger(
    SaasDeepeningFinalInfinityPackService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async processFinalInfinityOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "FINAL_INFINITY_SUCCESS",
      timestamp: new Date(),
    };
  }

  async queryFinalInfinityView(tenantId: string, view: string, params: any) {
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

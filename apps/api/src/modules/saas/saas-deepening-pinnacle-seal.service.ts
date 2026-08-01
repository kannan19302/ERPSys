import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasDeepeningPinnacleSealService {
  private readonly logger = new Logger(SaasDeepeningPinnacleSealService.name);

  private get db() {
    return prisma;
  }

  async processPinnacleSealOp(tenantId: string, cmd: string, body: any) {
    return {
      tenantId,
      command: cmd,
      body,
      status: "PINNACLE_SEALED",
      timestamp: new Date(),
    };
  }

  async queryPinnacleSealView(tenantId: string, view: string, params: any) {
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

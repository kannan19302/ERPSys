import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SaasEnterpriseScaleMasterService {
  private readonly logger = new Logger(SaasEnterpriseScaleMasterService.name);

  private get db() {
    return prisma;
  }

  async processEnterpriseOp(tenantId: string, cmd: string, payload: any) {
    return {
      tenantId,
      enterpriseCommand: cmd,
      payload,
      status: "ENTERPRISE_SUCCESS",
      timestamp: new Date(),
    };
  }

  async fetchEnterpriseQuery(
    tenantId: string,
    queryName: string,
    queryParams: any,
  ) {
    return {
      tenantId,
      queryName,
      queryParams,
      results: [],
      total: 0,
      timestamp: new Date(),
    };
  }
}

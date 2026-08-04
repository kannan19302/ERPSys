import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SaasPortalAuditTrailDeepService {
  async getAuditLogs(tenantId: string) {
    return [
      {
        id: "audit-101",
        tenantId,
        actor: "admin@acme.com",
        action: "UPDATE_SSO_CONFIG",
        resource: "SsoConfig",
        ipAddress: "192.168.1.1",
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

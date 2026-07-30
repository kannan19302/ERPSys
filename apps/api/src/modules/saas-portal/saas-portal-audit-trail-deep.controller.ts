// @ts-nocheck
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasPortalAuditTrailDeepService } from "./saas-portal-audit-trail-deep.service";

@ApiTags("SaasPortalAuditTrailDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas-portal/audit-trail-deep")
export class SaasPortalAuditTrailDeepController {
  constructor(private readonly auditService: SaasPortalAuditTrailDeepService) {}

  @ApiOperation({ summary: "Get portal administrative audit logs" })
  @Permissions("saas_portal.audit.read")
  @Get("logs")
  async getAuditLogs(@Req() req: any) {
    return this.auditService.getAuditLogs(req.user.tenantId);
  }
}

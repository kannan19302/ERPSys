import {
  Controller,
  Get,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AuditLogService } from "./audit-log.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("saas-audit-logs")
@ApiBearerAuth()
@Controller("saas/audit-logs")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOperation({ summary: "List audit logs" })
  @Permissions("saas.audit.read")
  @Get()
  async listAuditLogs(
    @Req() req: AuthReq,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("action") action?: string,
    @Query("actor") actor?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.auditLogService.listAuditLogs(
      req.user.tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      { action, actor, from, to },
    );
  }

  @ApiOperation({ summary: "Get audit log by id" })
  @Permissions("saas.audit.read")
  @Get(":id")
  async getAuditLog(@Req() req: AuthReq, @Param("id") id: string) {
    return this.auditLogService.getAuditLog(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Export audit logs" })
  @Permissions("saas.audit.read")
  @Get("export/:format")
  async exportAuditLogs(
    @Req() req: AuthReq,
    @Param("format") format: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.auditLogService.exportAuditLogs(req.user.tenantId, format, { from, to });
  }

  @ApiOperation({ summary: "Get audit stats" })
  @Permissions("saas.audit.read")
  @Get("stats")
  async getAuditStats(@Req() req: AuthReq) {
    return this.auditLogService.getAuditStats(req.user.tenantId);
  }
}

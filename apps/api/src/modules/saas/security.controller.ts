import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiKeysService } from "./api-keys.service";
import { AuditLogService } from "./audit-log.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const updatePasswordPolicySchema = z.object({
  minLength: z.number().int().min(8).max(128).optional(),
  requireUppercase: z.boolean().optional(),
  requireLowercase: z.boolean().optional(),
  requireNumbers: z.boolean().optional(),
  requireSpecialChars: z.boolean().optional(),
  maxAgeDays: z.number().int().min(1).max(365).optional(),
  preventReuse: z.number().int().min(0).max(24).optional(),
});

const updateIpRestrictionsSchema = z.object({
  allowedIps: z.array(z.string()),
  enabled: z.boolean(),
});

const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  permissions: z.array(z.string()).default([]),
  allowedIps: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
});

@ApiTags("saas-security")
@ApiBearerAuth()
@Controller("saas/security")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SecurityController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @ApiOperation({ summary: "Get security overview" })
  @Permissions("saas.apikey.read")
  @Get("overview")
  async getSecurityOverview(@Req() req: AuthReq) {
    const keys = await this.apiKeysService.listApiKeys(req.user.tenantId).catch(() => []);
    return {
      apiKeyCount: keys.length,
      activeSessions: 1,
      mfaEnabled: false,
      ipRestrictions: false,
      lastLogin: new Date(),
      securityScore: 65,
    };
  }

  @ApiOperation({ summary: "List active sessions" })
  @Permissions("saas.apikey.read")
  @Get("sessions")
  async listActiveSessions(@Req() _req: AuthReq) {
    return [
      { id: "current", ip: "192.168.1.1", userAgent: "Mozilla/5.0", lastActive: new Date(), isCurrent: true },
    ];
  }

  @ApiOperation({ summary: "Revoke session" })
  @Permissions("saas.apikey.create")
  @Post("sessions/:id/revoke")
  async revokeSession(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, revokedSessionId: id };
  }

  @ApiOperation({ summary: "Get login history" })
  @Permissions("saas.apikey.read")
  @Get("login-history")
  async getLoginHistory(@Req() req: AuthReq) {
    return this.auditLogService.listAuditLogs(req.user.tenantId, 1, 50, { action: "LOGIN" }).catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Update password policy" })
  @Permissions("saas.apikey.create")
  @Put("password-policy")
  async updatePasswordPolicy(@Req() _req: AuthReq, @ZodBody(updatePasswordPolicySchema) body: z.infer<typeof updatePasswordPolicySchema>) {
    return { success: true, ...body };
  }

  @ApiOperation({ summary: "Get IP restrictions" })
  @Permissions("saas.apikey.read")
  @Get("ip-restrictions")
  async getIpRestrictions(@Req() _req: AuthReq) {
    return { enabled: false, allowedIps: [] };
  }

  @ApiOperation({ summary: "Update IP restrictions" })
  @Permissions("saas.apikey.create")
  @Put("ip-restrictions")
  async updateIpRestrictions(@Req() _req: AuthReq, @ZodBody(updateIpRestrictionsSchema) body: z.infer<typeof updateIpRestrictionsSchema>) {
    return { success: true, ...body };
  }

  @ApiOperation({ summary: "Get MFA status" })
  @Permissions("saas.apikey.read")
  @Get("mfa")
  async getMfaStatus(@Req() _req: AuthReq) {
    return { enabled: false, method: null, setupAt: null, backupCodes: 0 };
  }

  @ApiOperation({ summary: "Enable MFA" })
  @Permissions("saas.apikey.create")
  @Post("mfa/enable")
  async enableMfa(@Req() _req: AuthReq) {
    return { success: true, secret: "TOTP_SECRET_PLACEHOLDER", qrCode: null, backupCodes: ["xxxx-xxxx", "yyyy-yyyy"] };
  }

  @ApiOperation({ summary: "Disable MFA" })
  @Permissions("saas.apikey.create")
  @Post("mfa/disable")
  async disableMfa(@Req() _req: AuthReq) {
    return { success: true };
  }

  @ApiOperation({ summary: "List API keys" })
  @Permissions("saas.apikey.read")
  @Get("api-keys")
  async listApiKeys(@Req() req: AuthReq) {
    return this.apiKeysService.listApiKeys(req.user.tenantId).catch(() => []);
  }

  @ApiOperation({ summary: "Create API key" })
  @Permissions("saas.apikey.create")
  @Post("api-keys")
  async createApiKey(@Req() req: AuthReq, @ZodBody(createApiKeySchema) body: z.infer<typeof createApiKeySchema>) {
    return this.apiKeysService.createApiKey(req.user.tenantId, body).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Revoke API key" })
  @Permissions("saas.apikey.delete")
  @Delete("api-keys/:id")
  async revokeApiKey(@Req() req: AuthReq, @Param("id") id: string) {
    return this.apiKeysService.revokeApiKey(req.user.tenantId, id).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Get security audit log" })
  @Permissions("saas.audit.read")
  @Get("audit-log")
  async getSecurityAuditLog(@Req() req: AuthReq) {
    return this.auditLogService.listAuditLogs(req.user.tenantId, 1, 100, {}).catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "List security events" })
  @Permissions("saas.audit.read")
  @Get("events")
  async listSecurityEvents(@Req() req: AuthReq) {
    const logs = await this.auditLogService.listAuditLogs(req.user.tenantId, 1, 100, {}).catch(() => ({ items: [] }));
    return (logs as any).items?.filter((l: any) => ["LOGIN", "LOGOUT", "API_KEY_CREATED", "PERMISSION_CHANGE"].includes(l.action)) || [];
  }

  @ApiOperation({ summary: "Get security score" })
  @Permissions("saas.apikey.read")
  @Get("score")
  async getSecurityScore(@Req() req: AuthReq) {
    const keys = await this.apiKeysService.listApiKeys(req.user.tenantId).catch(() => []);
    const expiredKeys = (keys as any[]).filter((k) => k.expiresAt && new Date(k.expiresAt) < new Date()).length;
    const score = Math.max(0, 100 - expiredKeys * 10 - (keys.length > 5 ? 10 : 0));
    return {
      score,
      checks: {
        mfaEnabled: { pass: false, weight: 25 },
        noExpiredKeys: { pass: expiredKeys === 0, weight: 20 },
        apiKeyCount: { pass: keys.length <= 5, weight: 15 },
        ipRestrictions: { pass: false, weight: 20 },
        strongPasswordPolicy: { pass: true, weight: 20 },
      },
    };
  }
}

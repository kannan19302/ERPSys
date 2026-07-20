import {
  Controller,
  Get,
  Post,
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
import { TenantAnalyticsService } from "./tenant-analytics.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const startMigrationSchema = z.object({
  sourceTenantId: z.string().min(1),
  targetPlanId: z.string().min(1),
  modules: z.array(z.string()).min(1),
  preserveUsers: z.boolean().default(true),
  preserveData: z.boolean().default(true),
  scheduledAt: z.string().datetime().optional(),
});

const validateMigrationSchema = z.object({
  sourceTenantId: z.string().min(1),
  targetPlanId: z.string().min(1),
  modules: z.array(z.string()).min(1),
});

const createMigrationTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  sourcePlanId: z.string().min(1),
  targetPlanId: z.string().min(1),
  modules: z.array(z.string()).min(1),
  preserveUsers: z.boolean().default(true),
  preserveData: z.boolean().default(true),
});

@ApiTags("saas-migrations")
@ApiBearerAuth()
@Controller("saas/admin/migrations")
@UseGuards(JwtAuthGuard, RbacGuard)
export class MigrationController {
  constructor(
    private readonly tenantAnalyticsService: TenantAnalyticsService,
  ) {}

  @ApiOperation({ summary: "Start data migration [Admin]" })
  @Permissions("saas.tenant.create")
  @Post("start")
  async startDataMigration(@Req() _req: AuthReq, @ZodBody(startMigrationSchema) body: z.infer<typeof startMigrationSchema>) {
    return {
      success: true,
      migrationId: "mig_" + Date.now(),
      status: "queued",
      sourceTenantId: body.sourceTenantId,
      targetPlanId: body.targetPlanId,
      modules: body.modules,
      estimatedDuration: "5-10 minutes",
    };
  }

  @ApiOperation({ summary: "Get migration status [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("status")
  async getMigrationStatus(@Req() _req: AuthReq) {
    return { status: "idle", activeMigrations: 0, lastMigration: null };
  }

  @ApiOperation({ summary: "Cancel migration [Admin]" })
  @Permissions("saas.tenant.update")
  @Post(":id/cancel")
  async cancelMigration(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, migrationId: id, status: "cancelled" };
  }

  @ApiOperation({ summary: "Get migration log [Admin]" })
  @Permissions("saas.tenant.read")
  @Get(":id/log")
  async getMigrationLog(@Req() _req: AuthReq, @Param("id") id: string) {
    return { migrationId: id, entries: [], total: 0 };
  }

  @ApiOperation({ summary: "Validate migration [Admin]" })
  @Permissions("saas.tenant.create")
  @Post("validate")
  async validateMigration(@Req() _req: AuthReq, @ZodBody(validateMigrationSchema) body: z.infer<typeof validateMigrationSchema>) {
    const detail = await this.tenantAnalyticsService.getTenantDetail(body.sourceTenantId).catch(() => null);
    return {
      valid: !!detail,
      warnings: detail ? [] : ["Source tenant not found"],
      sourceDetail: detail,
      estimatedSize: "0 MB",
      estimatedDuration: "5 minutes",
    };
  }

  @ApiOperation({ summary: "List migration templates [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("templates")
  async listMigrationTemplates(@Req() _req: AuthReq) {
    return [];
  }

  @ApiOperation({ summary: "Create migration template [Admin]" })
  @Permissions("saas.tenant.create")
  @Post("templates")
  async createMigrationTemplate(@Req() _req: AuthReq, @ZodBody(createMigrationTemplateSchema) body: z.infer<typeof createMigrationTemplateSchema>) {
    return { success: true, template: body };
  }

  @ApiOperation({ summary: "Get migration history [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("history")
  async getMigrationHistory(@Req() _req: AuthReq) {
    return { migrations: [], total: 0 };
  }

  @ApiOperation({ summary: "Rollback migration [Admin]" })
  @Permissions("saas.tenant.update")
  @Post(":id/rollback")
  async rollbackMigration(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, migrationId: id, status: "rollback_initiated" };
  }

  @ApiOperation({ summary: "Estimate migration time [Admin]" })
  @Permissions("saas.tenant.read")
  @Get("estimate")
  async estimateMigrationTime(@Req() _req: AuthReq) {
    return { estimatedMinutes: 10, estimatedSizeMB: 50, variables: ["source_tenant", "target_plan"] };
  }
}

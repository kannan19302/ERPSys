import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
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
import { UsageAlertsService } from "./usage-alerts.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createAlertRuleSchema = z.object({
  name: z.string().min(1).max(255),
  metric: z.string().min(1),
  condition: z.enum(["gt", "gte", "lt", "lte", "eq"]),
  threshold: z.number(),
  unit: z.string().optional(),
  channel: z.enum(["email", "in_app", "webhook", "sms"]).default("in_app"),
  recipients: z.array(z.string()).optional(),
  enabled: z.boolean().default(true),
  notifyEvery: z.number().int().min(0).default(0),
  webhookUrl: z.string().url().optional(),
});

const updateAlertRuleSchema = createAlertRuleSchema.partial();

const bulkUpdateRulesSchema = z.object({
  ruleIds: z.array(z.string().min(1)),
  data: z.object({
    enabled: z.boolean().optional(),
    channel: z.enum(["email", "in_app", "webhook", "sms"]).optional(),
    threshold: z.number().optional(),
    notifyEvery: z.number().int().min(0).optional(),
  }),
});

@ApiTags("saas-alerts")
@ApiBearerAuth()
@Controller("saas/alerts")
@UseGuards(JwtAuthGuard, RbacGuard)
export class UsageAlertsController {
  constructor(private readonly usageAlertsService: UsageAlertsService) {}

  @ApiOperation({ summary: "List alert rules" })
  @Permissions("saas.alert.read")
  @Get("rules")
  async listAlertRules(@Req() req: AuthReq) {
    return this.usageAlertsService.listAlertRules(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create alert rule" })
  @Permissions("saas.alert.create")
  @Post("rules")
  async createAlertRule(@Req() req: AuthReq, @ZodBody(createAlertRuleSchema) body: z.infer<typeof createAlertRuleSchema>) {
    return this.usageAlertsService.createAlertRule(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update alert rule" })
  @Permissions("saas.alert.update")
  @Patch("rules/:id")
  async updateAlertRule(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateAlertRuleSchema) body: z.infer<typeof updateAlertRuleSchema>) {
    return this.usageAlertsService.updateAlertRule(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete alert rule" })
  @Permissions("saas.alert.delete")
  @Delete("rules/:id")
  async deleteAlertRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.usageAlertsService.deleteAlertRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Bulk update alert rules" })
  @Permissions("saas.alert.update")
  @Put("rules/bulk")
  async bulkUpdateRules(@Req() req: AuthReq, @ZodBody(bulkUpdateRulesSchema) body: z.infer<typeof bulkUpdateRulesSchema>) {
    return this.usageAlertsService.bulkUpdateRules(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Evaluate alerts" })
  @Permissions("saas.alert.create")
  @Post("evaluate")
  async evaluateAlerts(@Req() req: AuthReq) {
    return this.usageAlertsService.evaluateAlerts(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get alert history" })
  @Permissions("saas.alert.read")
  @Get("history")
  async getAlertHistory(@Req() req: AuthReq) {
    return this.usageAlertsService.getAlertHistory(req.user.tenantId);
  }

  @ApiOperation({ summary: "Dismiss alert" })
  @Permissions("saas.alert.update")
  @Patch("history/:logId/dismiss")
  async dismissAlert(@Req() req: AuthReq, @Param("logId") logId: string) {
    return this.usageAlertsService.dismissAlert(req.user.tenantId, logId);
  }

  @ApiOperation({ summary: "Get alert stats" })
  @Permissions("saas.alert.read")
  @Get("stats")
  async getAlertStats(@Req() req: AuthReq) {
    return this.usageAlertsService.getAlertStats(req.user.tenantId);
  }
}

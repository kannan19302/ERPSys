// @ts-nocheck
import { Controller, Get, Post, UseGuards, Req, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { InventoryCycleCountingDeepService } from "./inventory-cycle-counting-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("inventory / cycle-counting-deep")
@ApiBearerAuth()
@Controller("inventory/cycle-counting-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryCycleCountingDeepController {
  constructor(private readonly svc: InventoryCycleCountingDeepService) {}

  @Post("schedules")
  @Permissions("inventory.cycle.schedule.create")
  @ApiOperation({
    summary: "Create ABC perpetual cycle counting schedule & blind count rules",
  })
  async createCycleCountSchedule(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return {
      data: await this.svc.createCycleCountSchedule(req.user.tenantId, body),
    };
  }

  @Get("schedules")
  @Permissions("inventory.cycle.schedule.read")
  @ApiOperation({ summary: "Get ABC perpetual cycle counting schedules" })
  async getCycleCountSchedules(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCycleCountSchedules(req.user.tenantId) };
  }

  @Get("accuracy-metrics")
  @Permissions("inventory.cycle.accuracy.read")
  @ApiOperation({
    summary: "Get perpetual inventory count accuracy & net variance metrics",
  })
  async getInventoryAccuracyMetrics(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getInventoryAccuracyMetrics(req.user.tenantId),
    };
  }
}

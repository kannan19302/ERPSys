import { Controller, Get, Post, Param, UseGuards, Req } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ManufacturingApsService } from "./manufacturing-aps.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/aps")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingApsController {
  constructor(private readonly service: ManufacturingApsService) {}

  @ApiOperation({ summary: "Get APS scheduling data" })
  @Permissions("manufacturing.aps.read")
  @Get("data")
  async getSchedulingData(@Req() req: AuthReq) {
    return this.service.getSchedulingData(req.user.tenantId);
  }

  @ApiOperation({ summary: "Run constraint solver" })
  @Permissions("manufacturing.aps.create")
  @Post("solve")
  async runConstraintSolver(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.runConstraintSolver(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get schedule Gantt data" })
  @Permissions("manufacturing.aps.read")
  @Get("schedule/:id/gantt")
  async getScheduleGanttData(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getScheduleGanttData(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Run what-if simulation" })
  @Permissions("manufacturing.aps.create")
  @Post("simulate")
  async simulateFiniteLoad(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.simulateFiniteLoad(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get APS dashboard" })
  @Permissions("manufacturing.aps.read")
  @Get("dashboard")
  async getApsDashboard(@Req() req: AuthReq) {
    return this.service.getApsDashboard(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create constraint" })
  @Permissions("manufacturing.aps.create")
  @Post("constraints")
  async createConstraint(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createConstraint(req.user.tenantId, body);
  }
}

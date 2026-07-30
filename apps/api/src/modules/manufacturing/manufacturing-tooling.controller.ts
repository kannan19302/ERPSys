// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ManufacturingToolingService } from "./manufacturing-tooling.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/tooling")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingToolingController {
  constructor(private readonly service: ManufacturingToolingService) {}

  @ApiOperation({ summary: "Register a tool/gage" })
  @Permissions("manufacturing.tooling.create")
  @Post("register")
  async registerTool(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.registerTool(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get all tools" })
  @Permissions("manufacturing.tooling.read")
  @Get()
  async getTools(@Req() req: AuthReq, @Query("status") status?: string) {
    return this.service.getTools(req.user.tenantId, status);
  }

  @ApiOperation({ summary: "Schedule calibration" })
  @Permissions("manufacturing.tooling.create")
  @Post(":id/calibrate")
  async scheduleCalibration(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(z.any()) body: any,
  ) {
    return this.service.scheduleCalibration(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Log tool usage" })
  @Permissions("manufacturing.tooling.create")
  @Post("usage")
  async logToolUsage(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.logToolUsage(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get tool status" })
  @Permissions("manufacturing.tooling.read")
  @Get(":id/status")
  async getToolStatus(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getToolStatus(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get calibration schedule" })
  @Permissions("manufacturing.tooling.read")
  @Get("calibration-schedule")
  async getCalibrationSchedule(
    @Req() req: AuthReq,
    @Query("daysAhead") daysAhead?: string,
  ) {
    return this.service.getCalibrationSchedule(
      req.user.tenantId,
      daysAhead ? parseInt(daysAhead) : 30,
    );
  }

  @ApiOperation({ summary: "Complete gage R&R study" })
  @Permissions("manufacturing.tooling.create")
  @Post("gage-rr/:studyId/calculate")
  async calculateGageRR(
    @Req() req: AuthReq,
    @Param("studyId") studyId: string,
  ) {
    return this.service.calculateGageRR(req.user.tenantId, studyId);
  }

  @ApiOperation({ summary: "Get tooling dashboard" })
  @Permissions("manufacturing.tooling.read")
  @Get("dashboard")
  async getToolingDashboard(@Req() req: AuthReq) {
    return this.service.getToolingDashboard(req.user.tenantId);
  }
}

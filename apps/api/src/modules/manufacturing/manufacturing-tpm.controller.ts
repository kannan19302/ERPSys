// @ts-nocheck
import { Controller, Get, Post, Query, UseGuards, Req } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ManufacturingTpmService } from "./manufacturing-tpm.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/tpm")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingTpmController {
  constructor(private readonly service: ManufacturingTpmService) {}

  @ApiOperation({ summary: "Create TPM pillar" })
  @Permissions("manufacturing.tpm.create")
  @Post("pillars")
  async createTPMPillar(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createTPMPillar(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get TPM pillars" })
  @Permissions("manufacturing.tpm.read")
  @Get("pillars")
  async getTPMPillars(@Req() req: AuthReq) {
    return this.service.getTPMPillars(req.user.tenantId);
  }

  @ApiOperation({ summary: "Log pillar activity" })
  @Permissions("manufacturing.tpm.create")
  @Post("activities")
  async logPillarActivity(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.logPillarActivity(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Perform 5S audit" })
  @Permissions("manufacturing.tpm.create")
  @Post("audits/5s")
  async perform5SAudit(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.perform5SAudit(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get 5S audits" })
  @Permissions("manufacturing.tpm.read")
  @Get("audits/5s")
  async get5SAudits(
    @Req() req: AuthReq,
    @Query("workstationId") workstationId?: string,
  ) {
    return this.service.get5SAudits(req.user.tenantId, workstationId);
  }

  @ApiOperation({ summary: "Get OEE deep data" })
  @Permissions("manufacturing.tpm.read")
  @Get("oee")
  async getOeeDeepData(
    @Req() req: AuthReq,
    @Query("workstationId") workstationId?: string,
    @Query("period") period?: string,
  ) {
    return this.service.getOeeDeepData(
      req.user.tenantId,
      workstationId,
      period || "DAILY",
    );
  }

  @ApiOperation({ summary: "Record TPM KPI" })
  @Permissions("manufacturing.tpm.create")
  @Post("kpis")
  async recordTpmKpi(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.recordTpmKpi(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get TPM dashboard" })
  @Permissions("manufacturing.tpm.read")
  @Get("dashboard")
  async getTPMDashboard(@Req() req: AuthReq) {
    return this.service.getTPMDashboard(req.user.tenantId);
  }
}

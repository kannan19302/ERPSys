import { Controller, Get, Post, Query, UseGuards, Req } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ManufacturingEnergyService } from "./manufacturing-energy.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/energy")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingEnergyController {
  constructor(private readonly service: ManufacturingEnergyService) {}

  @ApiOperation({ summary: "Register energy meter" })
  @Permissions("manufacturing.energy.create")
  @Post("meters")
  async registerMeter(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.registerMeter(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get energy meters" })
  @Permissions("manufacturing.energy.read")
  @Get("meters")
  async getMeters(@Req() req: AuthReq) {
    return this.service.getMeters(req.user.tenantId);
  }

  @ApiOperation({ summary: "Log energy reading" })
  @Permissions("manufacturing.energy.create")
  @Post("readings")
  async logEnergyReading(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.logEnergyReading(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get energy consumption" })
  @Permissions("manufacturing.energy.read")
  @Get("consumption")
  async getEnergyConsumption(
    @Req() req: AuthReq,
    @Query("meterId") meterId?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
  ) {
    return this.service.getEnergyConsumption(
      req.user.tenantId,
      meterId,
      fromDate,
      toDate,
    );
  }

  @ApiOperation({ summary: "Calculate energy KPI" })
  @Permissions("manufacturing.energy.read")
  @Get("kpi")
  async calculateEnergyKPI(
    @Req() req: AuthReq,
    @Query("period") period?: string,
  ) {
    return this.service.calculateEnergyKPI(
      req.user.tenantId,
      period || "MONTHLY",
    );
  }

  @ApiOperation({ summary: "Allocate energy cost" })
  @Permissions("manufacturing.energy.create")
  @Post("cost-allocations")
  async allocateEnergyCost(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.allocateEnergyCost(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Create KPI target" })
  @Permissions("manufacturing.energy.create")
  @Post("kpi-targets")
  async createKpiTarget(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createKpiTarget(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get energy dashboard" })
  @Permissions("manufacturing.energy.read")
  @Get("dashboard")
  async getEnergyDashboard(@Req() req: AuthReq) {
    return this.service.getEnergyDashboard(req.user.tenantId);
  }
}

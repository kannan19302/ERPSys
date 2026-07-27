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
import { ManufacturingAdvancedQualityService } from "./manufacturing-advanced-quality.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/advanced-quality")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingAdvancedQualityController {
  constructor(private readonly service: ManufacturingAdvancedQualityService) {}

  @ApiOperation({ summary: "Get SPC chart data" })
  @Permissions("manufacturing.advanced-quality.read")
  @Get("spc")
  async getSPCData(
    @Req() req: AuthReq,
    @Query("productId") productId?: string,
  ) {
    return this.service.getSPCData(req.user.tenantId, productId);
  }

  @ApiOperation({ summary: "Calculate Cp/Cpk" })
  @Permissions("manufacturing.advanced-quality.read")
  @Post("spc/cp-cpk")
  async calculateCpCpk(
    @Req() req: AuthReq,
    @ZodBody(
      z.object({ chartId: z.string(), usl: z.number(), lsl: z.number() }),
    )
    body: { chartId: string; usl: number; lsl: number },
  ) {
    return this.service.calculateCpCpk(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Create FMEA worksheet" })
  @Permissions("manufacturing.advanced-quality.create")
  @Post("fmea")
  async createFMEA(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createFMEA(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get FMEA risk priority" })
  @Permissions("manufacturing.advanced-quality.read")
  @Get("fmea/:id/risk-priority")
  async getFMEARiskPriority(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getFMEARiskPriority(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create APQP project" })
  @Permissions("manufacturing.advanced-quality.create")
  @Post("apqp")
  async createAPQP(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createAPQP(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get APQP status" })
  @Permissions("manufacturing.advanced-quality.read")
  @Get("apqp/:id/status")
  async getAPQPStatus(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getAPQPStatus(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create PPAP submission" })
  @Permissions("manufacturing.advanced-quality.create")
  @Post("ppap")
  async createPPAPSubmission(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createPPAPSubmission(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get PPAP submission status" })
  @Permissions("manufacturing.advanced-quality.read")
  @Get("ppap/:id")
  async getPPAPStatus(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getPPAPStatus(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get quality dashboard" })
  @Permissions("manufacturing.advanced-quality.read")
  @Get("dashboard")
  async getQualityDashboard(@Req() req: AuthReq) {
    return this.service.getQualityDashboard(req.user.tenantId);
  }
}

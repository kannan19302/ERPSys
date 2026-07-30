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
import { ManufacturingDdmrpService } from "./manufacturing-ddmrp.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/ddmrp")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingDdmrpController {
  constructor(private readonly service: ManufacturingDdmrpService) {}

  @ApiOperation({ summary: "Get DDMRP parameters" })
  @Permissions("manufacturing.ddmrp.read")
  @Get("parameters")
  async getDDMRPParameters(
    @Req() req: AuthReq,
    @Query("productId") productId?: string,
  ) {
    return this.service.getDDMRPParameters(req.user.tenantId, productId);
  }

  @ApiOperation({ summary: "Create DDMRP part" })
  @Permissions("manufacturing.ddmrp.create")
  @Post("parts")
  async createDdmrpPart(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createDdmrpPart(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Calculate buffer levels" })
  @Permissions("manufacturing.ddmrp.create")
  @Post("parts/:id/calculate-buffer")
  async calculateBufferLevels(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.calculateBufferLevels(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Run DDMRP" })
  @Permissions("manufacturing.ddmrp.create")
  @Post("run")
  async runDDMRP(@Req() req: AuthReq) {
    return this.service.runDDMRP(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get DDMRP dashboard" })
  @Permissions("manufacturing.ddmrp.read")
  @Get("dashboard")
  async getDDMRPDashboard(@Req() req: AuthReq) {
    return this.service.getDDMRPDashboard(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get net flow equation" })
  @Permissions("manufacturing.ddmrp.read")
  @Get("net-flow/:partId")
  async getNetFlowEquation(
    @Req() req: AuthReq,
    @Param("partId") partId: string,
  ) {
    return this.service.getNetFlowEquation(req.user.tenantId, partId);
  }

  @ApiOperation({ summary: "Acknowledge recommendation" })
  @Permissions("manufacturing.ddmrp.create")
  @Post("recommendations/:id/acknowledge")
  async acknowledgeRecommendation(
    @Req() req: AuthReq,
    @Param("id") id: string,
  ) {
    return this.service.acknowledgeRecommendation(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }
}

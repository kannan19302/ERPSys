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
import { ManufacturingContractMfgService } from "./manufacturing-contract-mfg.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/contract-mfg")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingContractMfgController {
  constructor(private readonly service: ManufacturingContractMfgService) {}

  @ApiOperation({ summary: "Register contract manufacturer" })
  @Permissions("manufacturing.contract-mfg.create")
  @Post("manufacturers")
  async registerContractMfg(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.registerContractMfg(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get contract manufacturers" })
  @Permissions("manufacturing.contract-mfg.read")
  @Get("manufacturers")
  async getContractManufacturers(
    @Req() req: AuthReq,
    @Query("status") status?: string,
  ) {
    return this.service.getContractManufacturers(req.user.tenantId, status);
  }

  @ApiOperation({ summary: "Approve contract manufacturer" })
  @Permissions("manufacturing.contract-mfg.create")
  @Post("manufacturers/:id/approve")
  async approveContractMfg(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.approveContractMfg(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create outsourcing PO" })
  @Permissions("manufacturing.contract-mfg.create")
  @Post("purchase-orders")
  async createOutsourcingPO(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createOutsourcingPO(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get outsourcing POs" })
  @Permissions("manufacturing.contract-mfg.read")
  @Get("purchase-orders")
  async getOutsourcingPOs(
    @Req() req: AuthReq,
    @Query("status") status?: string,
  ) {
    return this.service.getOutsourcingPOs(req.user.tenantId, status);
  }

  @ApiOperation({ summary: "Receive subcontracted goods" })
  @Permissions("manufacturing.contract-mfg.create")
  @Post("receive")
  async receiveSubcontractedGoods(
    @Req() req: AuthReq,
    @ZodBody(z.any()) body: any,
  ) {
    return this.service.receiveSubcontractedGoods(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get contract mfg dashboard" })
  @Permissions("manufacturing.contract-mfg.read")
  @Get("dashboard")
  async getContractMfgDashboard(@Req() req: AuthReq) {
    return this.service.getContractMfgDashboard(req.user.tenantId);
  }
}

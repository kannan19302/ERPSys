// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { InventoryLpnTrackingDeepService } from "./inventory-lpn-tracking-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("inventory / lpn-tracking-deep")
@ApiBearerAuth()
@Controller("inventory/lpn-tracking-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryLpnTrackingDeepController {
  constructor(private readonly svc: InventoryLpnTrackingDeepService) {}

  @Post("lpns")
  @Permissions("inventory.lpn.create")
  @ApiOperation({
    summary: "Register warehouse License Plate Number (LPN) container",
  })
  async registerLpn(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return { data: await this.svc.registerLpn(req.user.tenantId, body) };
  }

  @Get("lpns")
  @Permissions("inventory.lpn.read")
  @ApiOperation({ summary: "Get warehouse LPN container tracking list" })
  async getLpns(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getLpns(req.user.tenantId) };
  }

  @Get("hierarchy/:parentLpnCode")
  @Permissions("inventory.lpn.hierarchy.read")
  @ApiOperation({
    summary: "Get nested LPN pallet and tote container hierarchy",
  })
  async getLpnHierarchyTree(
    @Req() req: AuthenticatedRequest,
    @Param("parentLpnCode") parentLpnCode: string,
  ) {
    return {
      data: await this.svc.getLpnHierarchyTree(
        req.user.tenantId,
        parentLpnCode,
      ),
    };
  }

  @Post("cross-dock-route")
  @Permissions("inventory.lpn.crossdock.route")
  @ApiOperation({
    summary: "Route incoming LPN directly to outbound cross-dock staging bay",
  })
  async processCrossDockLpnRouting(
    @Req() req: AuthenticatedRequest,
    @Body() body: { lpnCode: string; outboundShipmentId: string },
  ) {
    return {
      data: await this.svc.processCrossDockLpnRouting(
        req.user.tenantId,
        body.lpnCode,
        body.outboundShipmentId,
      ),
    };
  }
}

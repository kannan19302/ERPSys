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
import { InventoryWarehouseSlottingDeepService } from "./inventory-warehouse-slotting-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("inventory / warehouse-slotting-deep")
@ApiBearerAuth()
@Controller("inventory/warehouse-slotting-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryWarehouseSlottingDeepController {
  constructor(private readonly svc: InventoryWarehouseSlottingDeepService) {}

  @Post("slotting-rules")
  @Permissions("inventory.slotting.rule.create")
  @ApiOperation({ summary: "Create pick-face velocity slotting rule" })
  async createSlottingRule(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return { data: await this.svc.createSlottingRule(req.user.tenantId, body) };
  }

  @Get("slotting-rules")
  @Permissions("inventory.slotting.rule.read")
  @ApiOperation({ summary: "Get pick-face velocity slotting rules" })
  async getSlottingRules(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSlottingRules(req.user.tenantId) };
  }

  @Post("optimize-slotting/:warehouseId")
  @Permissions("inventory.slotting.optimize")
  @ApiOperation({
    summary: "Run warehouse pick-face velocity slotting optimization",
  })
  async optimizePickFaceSlotting(
    @Req() req: AuthenticatedRequest,
    @Param("warehouseId") warehouseId: string,
  ) {
    return {
      data: await this.svc.optimizePickFaceSlotting(
        req.user.tenantId,
        warehouseId,
      ),
    };
  }

  @Get("aisle-congestion/:warehouseId")
  @Permissions("inventory.slotting.congestion.read")
  @ApiOperation({ summary: "Get warehouse aisle picker congestion heatmap" })
  async getAisleCongestionHeatmap(
    @Req() req: AuthenticatedRequest,
    @Param("warehouseId") warehouseId: string,
  ) {
    return {
      data: await this.svc.getAisleCongestionHeatmap(
        req.user.tenantId,
        warehouseId,
      ),
    };
  }
}

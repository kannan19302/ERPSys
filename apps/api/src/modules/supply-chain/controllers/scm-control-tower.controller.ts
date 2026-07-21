import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ScmControlTowerService } from "../services/scm-control-tower.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("supply-chain / control-tower")
@ApiBearerAuth()
@Controller("supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ScmControlTowerController {
  constructor(private readonly towerSvc: ScmControlTowerService) {}

  @ApiOperation({
    summary: "SCM Control Tower: unified KPI dashboard aggregation",
  })
  @Get("dashboard")
  @Permissions("supply-chain.dashboard.read")
  getDashboard(@Req() req: AuthRequest) {
    return this.towerSvc.getDashboard(req.user.tenantId);
  }

  @ApiOperation({
    summary:
      "Supply chain KPIs — OTIF, fill rate, lead time, inventory turns with trend data",
  })
  @Get("kpis")
  @Permissions("supply-chain.dashboard.read")
  getKpis(@Req() req: AuthRequest) {
    return this.towerSvc.getKpis(req.user.tenantId);
  }

  @ApiOperation({
    summary:
      "Cross-functional supply chain alerts from inventory, finance, and SCM modules",
  })
  @Get("alerts")
  @Permissions("supply-chain.dashboard.read")
  getAlerts(@Req() req: AuthRequest) {
    return this.towerSvc.getCrossModuleAlerts(req.user.tenantId);
  }
}

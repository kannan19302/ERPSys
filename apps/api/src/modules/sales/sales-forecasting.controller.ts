import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SalesForecastingService } from "./sales-forecasting.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("sales-forecasting")
@ApiBearerAuth()
@Controller("sales/forecasting")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesForecastingController {
  constructor(private readonly forecastingService: SalesForecastingService) {}

  @Get("current")
  @Permissions("sales.forecast.read")
  @ApiOperation({ summary: "Current period forecast" })
  async getForecast(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return this.forecastingService.getForecast(req.user.tenantId, period);
  }

  @Get("vs-actual")
  @Permissions("sales.forecast.read")
  @ApiOperation({ summary: "Forecast vs actual comparison" })
  async getForecastVsActual(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return this.forecastingService.getForecastVsActual(
      req.user.tenantId,
      period,
    );
  }

  @Get("pipeline")
  @Permissions("sales.forecast.read")
  @ApiOperation({ summary: "Pipeline forecast by stage" })
  async getPipelineForecast(@Req() req: AuthenticatedRequest) {
    return this.forecastingService.getPipelineForecast(req.user.tenantId);
  }

  @Get("history")
  @Permissions("sales.forecast.read")
  @ApiOperation({ summary: "Historical forecast accuracy" })
  async getForecastHistory(
    @Req() req: AuthenticatedRequest,
    @Query("periods") periods?: string,
  ) {
    return this.forecastingService.getForecastHistory(
      req.user.tenantId,
      periods ? parseInt(periods, 10) : 4,
    );
  }

  @Get("dashboard")
  @Permissions("sales.forecast.read")
  @ApiOperation({ summary: "Combined forecast dashboard" })
  async getForecastDashboard(@Req() req: AuthenticatedRequest) {
    return this.forecastingService.getForecastDashboard(req.user.tenantId);
  }
}

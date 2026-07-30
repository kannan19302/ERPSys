// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrWorkforceAnalyticsDeepService } from "./hr-workforce-analytics-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced / workforce-analytics-deep")
@ApiBearerAuth()
@Controller("hr-advanced/workforce-analytics-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrWorkforceAnalyticsDeepController {
  constructor(private readonly svc: HrWorkforceAnalyticsDeepService) {}

  @Post("flight-risk-rules")
  @Permissions("hr.analytics.flight.risk.create")
  @ApiOperation({ summary: "Create predictive employee flight-risk rule" })
  async createFlightRiskRule(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      minTenureMonths?: number;
      lastPromotionMonthsGte?: number;
      compRatioThreshold?: number;
    },
  ) {
    return {
      data: await this.svc.createFlightRiskRule(req.user.tenantId, body),
    };
  }

  @Get("flight-risk-rules")
  @Permissions("hr.analytics.flight.risk.read")
  @ApiOperation({ summary: "Get predictive flight-risk rules" })
  async getFlightRiskRules(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getFlightRiskRules(req.user.tenantId) };
  }

  @Get("attrition-heatmap")
  @Permissions("hr.analytics.attrition.read")
  @ApiOperation({
    summary: "Get predictive attrition heatmap and flight-risk metrics",
  })
  async getAttritionPredictiveHeatmap(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getAttritionPredictiveHeatmap(req.user.tenantId),
    };
  }

  @Get("dei-equity-parity")
  @Permissions("hr.analytics.dei.read")
  @ApiOperation({ summary: "Get DEI equal pay & promotion parity analytics" })
  async getDeiEquityParityReport(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDeiEquityParityReport(req.user.tenantId) };
  }

  @Get("span-of-control")
  @Permissions("hr.analytics.span.read")
  @ApiOperation({
    summary: "Get manager span of control ratios and direct report metrics",
  })
  async getSpanOfControlMetrics(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSpanOfControlMetrics(req.user.tenantId) };
  }

  @Get("headcount-budget-variance")
  @Permissions("hr.analytics.headcount.read")
  @ApiOperation({ summary: "Get headcount budget vs actual variance rollups" })
  async getHeadcountBudgetVariance(
    @Req() req: AuthenticatedRequest,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return {
      data: await this.svc.getHeadcountBudgetVariance(
        req.user.tenantId,
        fiscalYear ? parseInt(fiscalYear, 10) : 2026,
      ),
    };
  }
}

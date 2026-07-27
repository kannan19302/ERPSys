import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplyChainAdvancedAnalyticsService } from "../services/supply-chain-advanced-analytics.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const forecastSchema = z.object({
  productId: z.string().optional(),
  productCategory: z.string().optional(),
  horizonMonths: z.number().int().min(1).max(24).optional(),
  includeHistorical: z.boolean().optional(),
});
const anomalySchema = z.object({
  scope: z.string().optional(),
  severityThreshold: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().optional(),
});
const leadTimeSchema = z.object({
  supplierId: z.string().optional(),
  laneOrigin: z.string().optional(),
  laneDestination: z.string().optional(),
  transportMode: z.string().optional(),
});

@ApiTags("supply-chain / advanced-analytics")
@ApiBearerAuth()
@Controller("supply-chain/advanced-analytics")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AdvancedAnalyticsController {
  constructor(private readonly svc: SupplyChainAdvancedAnalyticsService) {}

  @Get("dashboard")
  @Permissions("supply-chain.analytics.read")
  @ApiOperation({ summary: "Advanced analytics dashboard" })
  getDashboard(@Req() req: AuthRequest) {
    return this.svc.getAdvancedAnalyticsDashboard(req.user.tenantId);
  }

  @Post("forecast")
  @Permissions("supply-chain.analytics.read")
  @ApiOperation({ summary: "Get AI demand forecast" })
  @HttpCode(HttpStatus.CREATED)
  getForecast(
    @Req() req: AuthRequest,
    @ZodBody(forecastSchema) body: z.infer<typeof forecastSchema>,
  ) {
    return this.svc.getAIDemandForecast(req.user.tenantId, body);
  }

  @Post("anomalies/detect")
  @Permissions("supply-chain.analytics.read")
  @ApiOperation({ summary: "Detect supply chain anomalies" })
  @HttpCode(HttpStatus.CREATED)
  detectAnomalies(
    @Req() req: AuthRequest,
    @ZodBody(anomalySchema) body: z.infer<typeof anomalySchema>,
  ) {
    return this.svc.detectAnomalies(req.user.tenantId, body);
  }

  @Get("anomalies/:id")
  @Permissions("supply-chain.analytics.read")
  @ApiOperation({ summary: "Get anomaly details" })
  getAnomaly(@Req() req: AuthRequest, @Param("id") id: string) {
    return { anomalyId: id, status: "INVESTIGATING" };
  }

  @Post("lead-times/predict")
  @Permissions("supply-chain.analytics.read")
  @ApiOperation({ summary: "Predict lead times" })
  @HttpCode(HttpStatus.CREATED)
  predictLeadTimes(
    @Req() req: AuthRequest,
    @ZodBody(leadTimeSchema) body: z.infer<typeof leadTimeSchema>,
  ) {
    return this.svc.predictLeadTime(req.user.tenantId, body);
  }

  @Get("supplier-risk/:supplierId")
  @Permissions("supply-chain.analytics.read")
  @ApiOperation({ summary: "Get supplier risk score" })
  getSupplierRisk(
    @Req() req: AuthRequest,
    @Param("supplierId") supplierId: string,
  ) {
    return this.svc.getSupplierRiskScore(req.user.tenantId, supplierId);
  }

  @Get("insights")
  @Permissions("supply-chain.analytics.read")
  @ApiOperation({ summary: "Generate AI insights" })
  generateInsights(@Req() req: AuthRequest) {
    return this.svc.getAdvancedAnalyticsDashboard(req.user.tenantId);
  }
}

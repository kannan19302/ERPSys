import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../../common/interceptors/change-history.interceptor";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplyPlanningService } from "../services/supply-planning.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("supply-chain / supply-planning")
@ApiBearerAuth()
@Controller("supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class SupplyPlanningController {
  constructor(private readonly planSvc: SupplyPlanningService) {}

  @Get("demand-sense-runs")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "List demand sensing runs" })
  listDemandSenseRuns(@Req() req: AuthRequest) {
    return this.planSvc.getDemandSenseRuns(req.user.tenantId);
  }

  @Post("demand-sense-runs")
  @Permissions("supply-chain.forecast.create")
  @TrackChanges("DemandSenseRun")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Trigger a demand sensing run" })
  createDemandSenseRun(
    @Req() req: AuthRequest,
    @ZodBody(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        runType: z.string().optional(),
        horizonMonths: z.number().int().optional(),
        algorithm: z.string().optional(),
        productIds: z.array(z.string()).optional(),
      }),
    )
    body: any,
  ) {
    return this.planSvc.createDemandSenseRun(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Get("demand-sense-runs/:runId/results")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Get demand sensing results for a run" })
  getDemandSenseResults(
    @Req() req: AuthRequest,
    @Param("runId") runId: string,
  ) {
    return this.planSvc.getDemandSenseResults(req.user.tenantId, runId);
  }

  @Get("supply-plans")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "List supply plans" })
  listSupplyPlans(@Req() req: AuthRequest) {
    return this.planSvc.getSupplyPlans(req.user.tenantId);
  }

  @Get("supply-plans/:id")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Get supply plan by id with scenarios" })
  getSupplyPlan(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.planSvc.getSupplyPlanById(req.user.tenantId, id);
  }

  @Post("supply-plans")
  @Permissions("supply-chain.forecast.create")
  @TrackChanges("SupplyPlan")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a supply plan with lines" })
  createSupplyPlan(
    @Req() req: AuthRequest,
    @ZodBody(
      z.object({
        planName: z.string(),
        description: z.string().optional(),
        planType: z.string().optional(),
        planningHorizon: z.number().int().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        demandSource: z.string().optional(),
        constraints: z.any().optional(),
        assumptions: z.any().optional(),
        lines: z
          .array(
            z.object({
              productId: z.string().optional(),
              productSku: z.string().optional(),
              productName: z.string().optional(),
              period: z.string(),
              forecastedQty: z.number().optional(),
              onHandQty: z.number().optional(),
              safetyStockQty: z.number().optional(),
              reorderPoint: z.number().optional(),
            }),
          )
          .optional(),
      }),
    )
    body: any,
  ) {
    return this.planSvc.createSupplyPlan(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Post("supply-plans/:id/scenarios")
  @Permissions("supply-chain.forecast.create")
  @TrackChanges("SupplyPlanScenario", "id")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a what-if scenario for a supply plan" })
  createScenario(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        scenarioType: z.string().optional(),
        assumptions: z.any().optional(),
        isBaseline: z.boolean().optional(),
      }),
    )
    body: any,
  ) {
    return this.planSvc.createSupplyPlanScenario(
      req.user.tenantId,
      id,
      body,
      req.user.userId,
    );
  }

  @Post("supply-plans/:id/approve")
  @Permissions("supply-chain.forecast.create")
  @TrackChanges("SupplyPlan", "id")
  @ApiOperation({ summary: "Approve and activate a supply plan" })
  approveSupplyPlan(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.planSvc.approveSupplyPlan(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Get("sop-plans")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "List S&OP plans" })
  listSopPlans(@Req() req: AuthRequest) {
    return this.planSvc.getSopPlans(req.user.tenantId);
  }

  @Get("sop-plans/:id")
  @Permissions("supply-chain.forecast.read")
  @ApiOperation({ summary: "Get S&OP plan by id with reviews and metrics" })
  getSopPlan(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.planSvc.getSopPlanById(req.user.tenantId, id);
  }

  @Post("sop-plans")
  @Permissions("supply-chain.forecast.create")
  @TrackChanges("SopPlan")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create an S&OP plan" })
  createSopPlan(
    @Req() req: AuthRequest,
    @ZodBody(
      z.object({
        planName: z.string(),
        description: z.string().optional(),
        fiscalYear: z.string(),
        period: z.string(),
        planType: z.string().optional(),
        revenueTarget: z.number().optional(),
        costBudget: z.number().optional(),
        inventoryTarget: z.number().optional(),
        serviceLevel: z.number().optional(),
        assumptions: z.any().optional(),
      }),
    )
    body: any,
  ) {
    return this.planSvc.createSopPlan(req.user.tenantId, body, req.user.userId);
  }

  @Post("sop-plans/:planId/reviews")
  @Permissions("supply-chain.forecast.create")
  @TrackChanges("SopPlanReview", "planId")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add a review to an S&OP plan" })
  createSopReview(
    @Req() req: AuthRequest,
    @Param("planId") planId: string,
    @ZodBody(
      z.object({
        reviewDate: z.string().optional(),
        reviewer: z.string().optional(),
        notes: z.string().optional(),
        decisions: z.any().optional(),
      }),
    )
    body: any,
  ) {
    return this.planSvc.createSopPlanReview(req.user.tenantId, planId, body);
  }
}

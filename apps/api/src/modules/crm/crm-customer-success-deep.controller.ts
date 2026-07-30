import {
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
  Req,
  Param,
  Query,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmCustomerSuccessDeepService } from "./services/crm-customer-success-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / customer-success-deep")
@ApiBearerAuth()
@Controller("crm/customer-success-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCustomerSuccessDeepController {
  constructor(private readonly svc: CrmCustomerSuccessDeepService) {}

  @Get("health-scores")
  @Permissions("crm.customer-success.view")
  @ApiOperation({ summary: "List health scores, optionally filtered by customer" })
  async listHealthScores(
    @Req() req: AuthenticatedRequest,
    @Query("customerId") customerId?: string,
  ) {
    return {
      data: await this.svc.listHealthScores(req.user.tenantId, customerId),
    };
  }

  @Get("health-scores/:id")
  @Permissions("crm.customer-success.view")
  @ApiOperation({ summary: "Get a single health score record" })
  async getHealthScore(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return { data: await this.svc.getHealthScore(req.user.tenantId, id) };
  }

  @Post("health-scores/compute/:customerId")
  @Permissions("crm.customer-success.manage")
  @ApiOperation({ summary: "Compute and store a health score for a customer" })
  async computeHealthScore(
    @Req() req: AuthenticatedRequest,
    @Param("customerId") customerId: string,
  ) {
    return {
      data: await this.svc.computeHealthScore(req.user.tenantId, customerId),
    };
  }

  @Get("success-plans")
  @Permissions("crm.customer-success.view")
  @ApiOperation({ summary: "List success plans, optionally filtered by customer or status" })
  async listSuccessPlans(
    @Req() req: AuthenticatedRequest,
    @Query("customerId") customerId?: string,
    @Query("status") status?: string,
  ) {
    return {
      data: await this.svc.listSuccessPlans(req.user.tenantId, customerId, status),
    };
  }

  @Post("success-plans")
  @Permissions("crm.customer-success.manage")
  @ApiOperation({ summary: "Create a new customer success plan" })
  async createSuccessPlan(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return {
      data: await this.svc.createSuccessPlan(req.user.tenantId, body, req.user.userId),
    };
  }

  @Patch("success-plans/:id")
  @Permissions("crm.customer-success.manage")
  @ApiOperation({ summary: "Update an existing success plan" })
  async updateSuccessPlan(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return {
      data: await this.svc.updateSuccessPlan(req.user.tenantId, id, body, req.user.userId),
    };
  }

  @Get("success-plans/:planId/milestones")
  @Permissions("crm.customer-success.view")
  @ApiOperation({ summary: "List milestones for a success plan" })
  async listMilestones(
    @Req() req: AuthenticatedRequest,
    @Param("planId") planId: string,
  ) {
    return { data: await this.svc.listMilestones(req.user.tenantId, planId) };
  }

  @Post("milestones/:id/complete")
  @Permissions("crm.customer-success.manage")
  @ApiOperation({ summary: "Mark a milestone as completed" })
  async completeMilestone(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return {
      data: await this.svc.completeMilestone(req.user.tenantId, id, req.user.userId),
    };
  }

  @Get("nps")
  @Permissions("crm.customer-success.view")
  @ApiOperation({ summary: "List NPS responses, optionally filtered by survey or date range" })
  async listNpsResponses(
    @Req() req: AuthenticatedRequest,
    @Query("surveyId") surveyId?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ) {
    return {
      data: await this.svc.listNpsResponses(req.user.tenantId, surveyId, dateFrom, dateTo),
    };
  }

  @Get("nps/analytics")
  @Permissions("crm.customer-success.view")
  @ApiOperation({ summary: "Get NPS analytics with trend data" })
  async getNpsAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return {
      data: await this.svc.getNpsAnalytics(req.user.tenantId, period),
    };
  }

  @Get("renewal-pipeline")
  @Permissions("crm.customer-success.view")
  @ApiOperation({ summary: "List renewal pipeline with optional risk level filter" })
  async listRenewalPipeline(
    @Req() req: AuthenticatedRequest,
    @Query("riskLevel") riskLevel?: string,
  ) {
    return {
      data: await this.svc.listRenewalPipeline(req.user.tenantId, riskLevel),
    };
  }

  @Get("churn-analysis")
  @Permissions("crm.customer-success.view")
  @ApiOperation({ summary: "Get churn analysis with segment breakdown" })
  async getChurnAnalysis(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return {
      data: await this.svc.getChurnAnalysis(req.user.tenantId, period),
    };
  }

  @Get("expansion-revenue")
  @Permissions("crm.customer-success.view")
  @ApiOperation({ summary: "Get expansion revenue with type breakdown" })
  async getExpansionRevenue(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return {
      data: await this.svc.getExpansionRevenue(req.user.tenantId, period),
    };
  }
}

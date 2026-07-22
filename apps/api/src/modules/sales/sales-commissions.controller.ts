import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { SalesCommissionsService } from "./sales-commissions.service";
import {
  createCommissionPayoutApprovalSchema,
  CreateCommissionPayoutApprovalDto,
} from "./dto/sales-extra.dto";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("sales-commissions")
@ApiBearerAuth()
@Controller("sales/commissions")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesCommissionsController {
  constructor(
    private readonly salesCommissionsService: SalesCommissionsService,
  ) {}

  @Get("plans")
  @Permissions("sales.commission-plan.read")
  @ApiOperation({ summary: "List commission plans" })
  async getCommissionPlans(@Req() req: AuthenticatedRequest) {
    return this.salesCommissionsService.getCommissionPlans(req.user.tenantId);
  }

  @Get("plans/:id")
  @Permissions("sales.commission-plan.read")
  @ApiOperation({ summary: "Get a commission plan by id" })
  async getPlanById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.salesCommissionsService.getPlanById(req.user.tenantId, id);
  }

  @Post("plans")
  @Permissions("sales.commission-plan.create")
  @ApiOperation({ summary: "Create a commission plan" })
  async createPlan(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    const orgId = req.user.orgId || "org-system-default";
    return this.salesCommissionsService.createPlan(
      req.user.tenantId,
      orgId,
      dto,
    );
  }

  @Patch("plans/:id")
  @Permissions("sales.commission-plan.update")
  @ApiOperation({ summary: "Update a commission plan" })
  async updatePlan(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.salesCommissionsService.updatePlan(req.user.tenantId, id, dto);
  }

  @Delete("plans/:id")
  @Permissions("sales.commission-plan.delete")
  @ApiOperation({ summary: "Delete a commission plan" })
  async deletePlan(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.salesCommissionsService.deletePlan(req.user.tenantId, id);
  }

  @Get("payouts")
  @Permissions("sales.commission-payout.read")
  @ApiOperation({ summary: "List commission payouts" })
  async getPayouts(
    @Req() req: AuthenticatedRequest,
    @Query("planId") planId?: string,
    @Query("userId") userId?: string,
    @Query("period") period?: string,
  ) {
    return this.salesCommissionsService.getPayouts(
      req.user.tenantId,
      planId,
      userId,
      period,
    );
  }

  @Get("payouts/:id")
  @Permissions("sales.commission-payout.read")
  @ApiOperation({ summary: "Get a commission payout by id" })
  async getPayoutById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.salesCommissionsService.getPayoutById(req.user.tenantId, id);
  }

  @Post("payouts/:id/approve")
  @Permissions("sales.commission-payout.approve")
  @ApiOperation({ summary: "Approve a commission payout" })
  async approvePayout(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createCommissionPayoutApprovalSchema)
    dto: CreateCommissionPayoutApprovalDto,
  ) {
    return this.salesCommissionsService.approvePayout(
      req.user.tenantId,
      id,
      req.user.userId || "system",
      dto.notes,
    );
  }

  @Post("payouts/calculate")
  @Permissions("sales.commission-payout.create")
  @ApiOperation({ summary: "Calculate payouts for a plan and period" })
  async calculatePayouts(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { planId: string; period: string; userId?: string },
  ) {
    return this.salesCommissionsService.calculatePayouts(
      req.user.tenantId,
      dto.planId,
      dto.period,
      dto.userId,
    );
  }

  @Get("dashboard")
  @Permissions("sales.commission-plan.read")
  @ApiOperation({ summary: "Commission dashboard stats" })
  async getCommissionDashboard(@Req() req: AuthenticatedRequest) {
    return this.salesCommissionsService.getCommissionDashboard(
      req.user.tenantId,
    );
  }
}

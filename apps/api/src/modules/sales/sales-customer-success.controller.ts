import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SalesCustomerSuccessService } from "./sales-customer-success.service";

@ApiTags("SalesCustomerSuccess")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/customer-success")
export class SalesCustomerSuccessController {
  constructor(
    private readonly customerSuccessService: SalesCustomerSuccessService,
  ) {}

  @ApiOperation({ summary: "Get customer success plans" })
  @Permissions("sales.customer_success.read")
  @Get()
  async getPlans(@Req() req: any, @Query("status") status?: string) {
    return this.customerSuccessService.getPlans(req.user.tenantId, status);
  }

  @ApiOperation({ summary: "Get CS metrics summary" })
  @Permissions("sales.customer_success.read")
  @Get("metrics")
  async getMetrics(@Req() req: any) {
    return this.customerSuccessService.getMetrics(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get customer success plan by ID" })
  @Permissions("sales.customer_success.read")
  @Get(":id")
  async getPlanById(@Req() req: any, @Param("id") id: string) {
    return this.customerSuccessService.getPlanById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create customer success plan" })
  @Permissions("sales.customer_success.create")
  @Post()
  async createPlan(@Req() req: any, @Body() dto: any) {
    return this.customerSuccessService.createPlan(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Update customer success plan" })
  @Permissions("sales.customer_success.update")
  @Put(":id")
  async updatePlan(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return this.customerSuccessService.updatePlan(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Add milestone to CS plan" })
  @Permissions("sales.customer_success.update")
  @Post(":id/milestones")
  async addMilestone(
    @Req() req: any,
    @Param("id") planId: string,
    @Body() dto: any,
  ) {
    return this.customerSuccessService.addMilestone(
      req.user.tenantId,
      planId,
      dto,
    );
  }

  @ApiOperation({ summary: "Update milestone status" })
  @Permissions("sales.customer_success.update")
  @Put("milestones/:milestoneId")
  async updateMilestone(
    @Req() req: any,
    @Param("milestoneId") milestoneId: string,
    @Body() dto: any,
  ) {
    return this.customerSuccessService.updateMilestone(
      req.user.tenantId,
      milestoneId,
      dto,
    );
  }
}

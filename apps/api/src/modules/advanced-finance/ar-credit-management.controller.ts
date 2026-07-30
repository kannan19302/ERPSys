import { Controller, Get, Post, Patch, UseGuards, Req, Param, Query, Body } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ArCreditManagementService } from "./services/ar-credit-management.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const creditLimitSchema = z.object({
  creditLimit: z.number().min(0),
  reason: z.string().min(1),
});

const creditHoldSchema = z.object({
  reason: z.string().min(1),
});

@ApiTags("AR Credit Management")
@ApiBearerAuth()
@Controller("advanced-finance/ar-credit")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ArCreditManagementController {
  constructor(private readonly creditService: ArCreditManagementService) {}

  @Get()
  @Permissions("advanced-finance.ar-credit.view")
  @ApiOperation({ summary: "List customer credit profiles" })
  async listCustomerCreditProfiles(
    @Req() req: AuthenticatedRequest,
    @Query("search") search?: string,
  ) {
    return this.creditService.listCustomerCreditProfiles(req.user.tenantId, search);
  }

  @Get("on-hold")
  @Permissions("advanced-finance.ar-credit.view")
  @ApiOperation({ summary: "List customers on credit hold" })
  async listCustomersOnHold(@Req() req: AuthenticatedRequest) {
    return this.creditService.listCustomersOnHold(req.user.tenantId);
  }

  @Get("aging-summary")
  @Permissions("advanced-finance.ar-credit.view")
  @ApiOperation({ summary: "Get AR aging summary" })
  async listAgingSummary(
    @Req() req: AuthenticatedRequest,
    @Query("asOfDate") asOfDate?: string,
  ) {
    return this.creditService.listAgingSummary(req.user.tenantId, asOfDate);
  }

  @Get("statements")
  @Permissions("advanced-finance.ar-credit.view")
  @ApiOperation({ summary: "List customer statements" })
  async listCustomerStatements(
    @Req() req: AuthenticatedRequest,
    @Query("customerId") customerId?: string,
  ) {
    return this.creditService.listCustomerStatements(req.user.tenantId, customerId);
  }

  @Get("dso-trend")
  @Permissions("advanced-finance.ar-credit.view")
  @ApiOperation({ summary: "Get DSO trend" })
  async getDsoTrend(
    @Req() req: AuthenticatedRequest,
    @Query("months") months?: string,
  ) {
    return this.creditService.getDsoTrend(req.user.tenantId, months ? parseInt(months, 10) : undefined);
  }

  @Get("collector-dashboard")
  @Permissions("advanced-finance.ar-credit.view")
  @ApiOperation({ summary: "Get collector dashboard" })
  async getCollectorDashboard(@Req() req: AuthenticatedRequest) {
    return this.creditService.getCollectorDashboard(req.user.tenantId);
  }

  @Post("bad-debt-provision")
  @Permissions("advanced-finance.ar-credit.manage")
  @ApiOperation({ summary: "Compute bad debt provision" })
  async computeBadDebtProvision(
    @Req() req: AuthenticatedRequest,
    @Query("asOfDate") asOfDate?: string,
  ) {
    return this.creditService.computeBadDebtProvision(req.user.tenantId, asOfDate);
  }

  @Get(":id")
  @Permissions("advanced-finance.ar-credit.view")
  @ApiOperation({ summary: "Get customer credit profile" })
  async getCustomerCreditProfile(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.creditService.getCustomerCreditProfile(req.user.tenantId, id);
  }

  @Patch(":id/credit-limit")
  @Permissions("advanced-finance.ar-credit.manage")
  @ApiOperation({ summary: "Update customer credit limit" })
  async updateCreditLimit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(creditLimitSchema) dto: any,
  ) {
    return this.creditService.updateCreditLimit(req.user.tenantId, id, dto, req.user.userId);
  }

  @Post(":id/credit-hold")
  @Permissions("advanced-finance.ar-credit.manage")
  @ApiOperation({ summary: "Place customer on credit hold" })
  async placeCreditHold(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(creditHoldSchema) dto: any,
  ) {
    return this.creditService.placeCreditHold(req.user.tenantId, id, dto.reason, req.user.userId);
  }

  @Post(":id/release-hold")
  @Permissions("advanced-finance.ar-credit.manage")
  @ApiOperation({ summary: "Release customer from credit hold" })
  async releaseCreditHold(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.creditService.releaseCreditHold(req.user.tenantId, id, req.user.userId);
  }
}

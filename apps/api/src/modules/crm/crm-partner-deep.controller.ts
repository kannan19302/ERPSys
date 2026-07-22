import { Controller, Get, Post, Put, Delete, Param, Query, Req, Body, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import {
  CrmPartnerDeepService,
  dealRegistrationSchema,
  mdfFundSchema,
} from "./crm-partner-deep.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags("crm-partner")
@ApiBearerAuth()
@Controller("crm/partner-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPartnerDealRegistrationController {
  constructor(private readonly svc: CrmPartnerDeepService) {}

  @ApiOperation({ summary: "List deal registrations" })
  @Get("deal-registrations")
  @Permissions("crm.partner.read")
  async listDealRegistrations(
    @Req() req: AuthenticatedRequest,
    @Query("partnerId") partnerId?: string,
    @Query("status") status?: string,
  ) {
    return this.svc.getDealRegistrations(req.user.tenantId, partnerId, status);
  }

  @ApiOperation({ summary: "Get deal registration" })
  @Get("deal-registrations/:id")
  @Permissions("crm.partner.read")
  async getDealRegistration(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getDealRegistration(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create deal registration" })
  @Post("deal-registrations")
  @Permissions("crm.partner.manage")
  @TrackChanges("SalesPartnerDealRegistration")
  @UseInterceptors(ChangeHistoryInterceptor)
  async createDealRegistration(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const dto = dealRegistrationSchema.parse(body);
    return this.svc.createDealRegistration(req.user.tenantId, req.user.orgId, dto);
  }

  @ApiOperation({ summary: "Approve deal registration" })
  @Post("deal-registrations/:id/approve")
  @Permissions("crm.partner.approve")
  async approveDealRegistration(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.approveDealRegistration(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: "Reject deal registration" })
  @Post("deal-registrations/:id/reject")
  @Permissions("crm.partner.approve")
  async rejectDealRegistration(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: any) {
    return this.svc.rejectDealRegistration(req.user.tenantId, id, body.rejectionReason || "No reason provided");
  }

  @ApiOperation({ summary: "Deal registration stats" })
  @Get("deal-registrations/stats")
  @Permissions("crm.partner.read")
  async dealRegistrationStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getDealRegistrationStats(req.user.tenantId);
  }
}

@ApiTags("crm-partner")
@ApiBearerAuth()
@Controller("crm/partner-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPartnerMdfController {
  constructor(private readonly svc: CrmPartnerDeepService) {}

  @ApiOperation({ summary: "List MDF funds" })
  @Get("mdf-funds")
  @Permissions("crm.partner.read")
  async listMdfFunds(
    @Req() req: AuthenticatedRequest,
    @Query("partnerId") partnerId?: string,
    @Query("status") status?: string,
  ) {
    return this.svc.getMdfFunds(req.user.tenantId, partnerId, status);
  }

  @ApiOperation({ summary: "Get MDF fund" })
  @Get("mdf-funds/:id")
  @Permissions("crm.partner.read")
  async getMdfFund(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getMdfFund(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create MDF fund" })
  @Post("mdf-funds")
  @Permissions("crm.partner.manage")
  @TrackChanges("SalesPartnerMdfFund")
  @UseInterceptors(ChangeHistoryInterceptor)
  async createMdfFund(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const dto = mdfFundSchema.parse(body);
    return this.svc.createMdfFund(req.user.tenantId, req.user.orgId, dto);
  }

  @ApiOperation({ summary: "Update MDF fund" })
  @Put("mdf-funds/:id")
  @Permissions("crm.partner.manage")
  async updateMdfFund(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: any) {
    const dto = mdfFundSchema.partial().parse(body);
    return this.svc.updateMdfFund(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete MDF fund" })
  @Delete("mdf-funds/:id")
  @Permissions("crm.partner.manage")
  async deleteMdfFund(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.deleteMdfFund(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "MDF fund stats" })
  @Get("mdf-funds/stats")
  @Permissions("crm.partner.read")
  async mdfFundStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getMdfFundStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Partner performance analytics" })
  @Get("performance/:partnerId")
  @Permissions("crm.partner.read")
  async partnerPerformance(@Req() req: AuthenticatedRequest, @Param("partnerId") partnerId: string) {
    return this.svc.getPartnerPerformance(req.user.tenantId, partnerId);
  }
}

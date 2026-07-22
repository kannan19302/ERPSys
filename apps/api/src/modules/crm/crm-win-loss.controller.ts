import { Controller, Get, Post, Put, Delete, Param, Query, Req, Body, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import {
  CrmWinLossService,
  winLossReasonSchema,
  competitorSchema,
  recordWinLossSchema,
} from "./crm-win-loss.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags("crm-win-loss")
@ApiBearerAuth()
@Controller("crm/win-loss")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmWinLossController {
  constructor(private readonly svc: CrmWinLossService) {}

  @ApiOperation({ summary: "List win/loss reasons" })
  @Get("reasons")
  @Permissions("crm.winloss.read")
  async listReasons(@Req() req: AuthenticatedRequest, @Query("category") category?: string) {
    return this.svc.getReasons(req.user.tenantId, category);
  }

  @ApiOperation({ summary: "Create win/loss reason" })
  @Post("reasons")
  @Permissions("crm.winloss.manage")
  async createReason(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const dto = winLossReasonSchema.parse(body);
    return this.svc.createReason(req.user.tenantId, req.user.orgId, dto);
  }

  @ApiOperation({ summary: "Update win/loss reason" })
  @Put("reasons/:id")
  @Permissions("crm.winloss.manage")
  async updateReason(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: any) {
    const dto = winLossReasonSchema.partial().parse(body);
    return this.svc.updateReason(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete win/loss reason" })
  @Delete("reasons/:id")
  @Permissions("crm.winloss.manage")
  async deleteReason(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.deleteReason(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List competitors" })
  @Get("competitors")
  @Permissions("crm.winloss.read")
  async listCompetitors(@Req() req: AuthenticatedRequest) {
    return this.svc.getCompetitors(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get competitor" })
  @Get("competitors/:id")
  @Permissions("crm.winloss.read")
  async getCompetitor(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getCompetitor(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create competitor" })
  @Post("competitors")
  @Permissions("crm.winloss.manage")
  async createCompetitor(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const dto = competitorSchema.parse(body);
    return this.svc.createCompetitor(req.user.tenantId, req.user.orgId, dto);
  }

  @ApiOperation({ summary: "Update competitor" })
  @Put("competitors/:id")
  @Permissions("crm.winloss.manage")
  async updateCompetitor(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: any) {
    const dto = competitorSchema.partial().parse(body);
    return this.svc.updateCompetitor(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete competitor" })
  @Delete("competitors/:id")
  @Permissions("crm.winloss.manage")
  async deleteCompetitor(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.deleteCompetitor(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Record win/loss for an opportunity" })
  @Post("record")
  @Permissions("crm.winloss.manage")
  @TrackChanges("Opportunity")
  @UseInterceptors(ChangeHistoryInterceptor)
  async recordWinLoss(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const dto = recordWinLossSchema.parse(body);
    return this.svc.recordWinLoss(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get win/loss analytics" })
  @Get("analytics")
  @Permissions("crm.winloss.read")
  async getAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.svc.getWinLossAnalytics(req.user.tenantId, {
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    });
  }

  @ApiOperation({ summary: "Get win/loss reasons breakdown" })
  @Get("reasons-breakdown")
  @Permissions("crm.winloss.read")
  async getReasonsBreakdown(@Req() req: AuthenticatedRequest) {
    return this.svc.getWinLossReasonsBreakdown(req.user.tenantId);
  }
}

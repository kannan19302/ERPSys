import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Req, Query } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { SalesSpiffService } from "./sales-spiff.service";
import { createSpiffCampaignSchema, updateSpiffCampaignSchema, createTeamSplitSchema, updateTeamSplitSchema, processClawbackSchema, CreateSpiffCampaignDto, UpdateSpiffCampaignDto, CreateTeamSplitDto, UpdateTeamSplitDto, ProcessClawbackDto } from "./dto/sales-extra.dto";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request { user: { tenantId: string; userId: string; orgId?: string } }

@ApiTags("sales")
@ApiBearerAuth()
@Controller("sales/spiff")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesSpiffController {
  constructor(private readonly service: SalesSpiffService) {}

  @Get("campaigns")
  @Permissions("sales.spiff.read")
  @ApiOperation({ summary: "List SPIFF campaigns" })
  async getCampaigns(@Req() req: AuthReq, @Query("planId") planId?: string) {
    return this.service.getSpiffCampaigns(req.user.tenantId, planId);
  }

  @Get("campaigns/:id")
  @Permissions("sales.spiff.read")
  @ApiOperation({ summary: "Get SPIFF campaign by id" })
  async getCampaignById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getSpiffCampaignById(req.user.tenantId, id);
  }

  @Post("campaigns")
  @Permissions("sales.spiff.create")
  @ApiOperation({ summary: "Create SPIFF campaign" })
  async createCampaign(@Req() req: AuthReq, @ZodBody(createSpiffCampaignSchema) dto: CreateSpiffCampaignDto) {
    return this.service.createSpiffCampaign(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Patch("campaigns/:id")
  @Permissions("sales.spiff.update")
  @ApiOperation({ summary: "Update SPIFF campaign" })
  async updateCampaign(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateSpiffCampaignSchema) dto: UpdateSpiffCampaignDto) {
    return this.service.updateSpiffCampaign(req.user.tenantId, id, dto);
  }

  @Delete("campaigns/:id")
  @Permissions("sales.spiff.delete")
  @ApiOperation({ summary: "Delete SPIFF campaign" })
  async deleteCampaign(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.deleteSpiffCampaign(req.user.tenantId, id);
  }

  @Get("team-splits")
  @Permissions("sales.spiff.read")
  @ApiOperation({ summary: "List team splits" })
  async getTeamSplits(@Req() req: AuthReq) {
    return this.service.getTeamSplits(req.user.tenantId);
  }

  @Post("team-splits")
  @Permissions("sales.spiff.create")
  @ApiOperation({ summary: "Create team split" })
  async createTeamSplit(@Req() req: AuthReq, @ZodBody(createTeamSplitSchema) dto: CreateTeamSplitDto) {
    return this.service.createTeamSplit(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Patch("team-splits/:id")
  @Permissions("sales.spiff.update")
  @ApiOperation({ summary: "Update team split" })
  async updateTeamSplit(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateTeamSplitSchema) dto: UpdateTeamSplitDto) {
    return this.service.updateTeamSplit(req.user.tenantId, id, dto);
  }

  @Delete("team-splits/:id")
  @Permissions("sales.spiff.delete")
  @ApiOperation({ summary: "Delete team split" })
  async deleteTeamSplit(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.deleteTeamSplit(req.user.tenantId, id);
  }

  @Post("clawback")
  @Permissions("sales.spiff.update")
  @ApiOperation({ summary: "Process commission clawback" })
  async clawback(@Req() req: AuthReq, @ZodBody(processClawbackSchema) dto: ProcessClawbackDto) {
    return this.service.processClawback(req.user.tenantId, dto);
  }

  @Get("dashboard")
  @Permissions("sales.spiff.read")
  @ApiOperation({ summary: "SPIFF dashboard stats" })
  async dashboard(@Req() req: AuthReq) {
    return this.service.getSpiffDashboard(req.user.tenantId);
  }

  @Get("deal-registrations")
  @Permissions("sales.partner.read")
  @ApiOperation({ summary: "List deal registrations" })
  async getDealRegistrations(@Req() req: AuthReq, @Query("status") status?: string) {
    return this.service.getDealRegistrations(req.user.tenantId, status);
  }

  @Get("calculate-eligibility/:orderId")
  @Permissions("sales.spiff.read")
  @ApiOperation({ summary: "Check SPIFF eligibility for an order" })
  async calculateEligibility(@Req() req: AuthReq, @Param("orderId") orderId: string) {
    return this.service.calculateSpiffEligibility(req.user.tenantId, orderId);
  }
}

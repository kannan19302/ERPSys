import { Controller, Get, Post, Patch, Delete, UseGuards, Req, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { resolveOrgId } from "../../common/utils/pagination.util";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NettingDeepService } from "./services/netting-deep.service";

interface AuthenticatedRequest extends Request { user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string } }

const createGroupSchema = z.object({
  name: z.string().min(1), description: z.string().optional(), nettingMethod: z.string().min(1),
  baseCurrency: z.string().optional(),
});
const addMemberSchema = z.object({ orgId: z.string().min(1), participantType: z.string().min(1), currency: z.string().optional() });
const createRunSchema = z.object({
  runNumber: z.string().optional(), nettingDate: z.string().min(1), period: z.string().optional(),
  totalReceivables: z.number(), totalPayables: z.number(), notes: z.string().optional(),
});
const createSettlementSchema = z.object({
  fromOrgId: z.string().min(1), toOrgId: z.string().min(1), settlementAmount: z.number().positive(),
  currency: z.string().optional(), settlementMethod: z.string().min(1),
  expectedSettlementDate: z.string().optional(), bankAccountId: z.string().optional(),
});

@ApiTags("advanced-finance-netting")
@ApiBearerAuth()
@Controller("advanced-finance/netting")
@UseGuards(JwtAuthGuard, RbacGuard)
export class NettingDeepController {
  constructor(private readonly nettingService: NettingDeepService) {}

  @Get("groups")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "List netting groups" })
  async getGroups(@Req() req: AuthenticatedRequest) {
    return this.nettingService.getNettingGroups(req.user.tenantId);
  }

  @Get("groups/:id")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "Get netting group by ID" })
  async getGroupById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.getNettingGroupById(req.user.tenantId, id);
  }

  @Post("groups")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Create netting group" })
  async createGroup(@Req() req: AuthenticatedRequest, @ZodBody(createGroupSchema) dto: any) {
    return this.nettingService.createNettingGroup(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("groups/:id")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Update netting group" })
  async updateGroup(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createGroupSchema.partial()) dto: any) {
    return this.nettingService.updateNettingGroup(req.user.tenantId, id, dto);
  }

  @Delete("groups/:id")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Delete netting group" })
  async deleteGroup(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.deleteNettingGroup(req.user.tenantId, id);
  }

  @Post("groups/:id/activate")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Activate netting group" })
  async activateGroup(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.activateNettingGroup(req.user.tenantId, id);
  }

  @Post("groups/:id/deactivate")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Deactivate netting group" })
  async deactivateGroup(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.deactivateNettingGroup(req.user.tenantId, id);
  }

  @Get("groups/:id/members")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "List netting group members" })
  async getMembers(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.getNettingGroupMembers(req.user.tenantId, id);
  }

  @Post("groups/:id/members")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Add member to netting group" })
  async addMember(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(addMemberSchema) dto: any) {
    return this.nettingService.addNettingGroupMember(req.user.tenantId, id, dto);
  }

  @Delete("groups/:id/members/:memberId")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Remove netting group member" })
  async removeMember(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Param("memberId") memberId: string) {
    return this.nettingService.removeNettingGroupMember(req.user.tenantId, id, memberId);
  }

  @Post("groups/:id/members/:memberId/deactivate")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Deactivate netting group member" })
  async deactivateMember(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Param("memberId") memberId: string) {
    return this.nettingService.deactivateNettingGroupMember(req.user.tenantId, id, memberId);
  }

  @Get("runs")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "List netting runs" })
  async getRuns(@Req() req: AuthenticatedRequest, @Query("groupId") groupId?: string) {
    return this.nettingService.getNettingRuns(req.user.tenantId, groupId);
  }

  @Get("runs/:id")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "Get netting run by ID" })
  async getRunById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.getNettingRunById(req.user.tenantId, id);
  }

  @Post("runs")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Create netting run" })
  async createRun(@Req() req: AuthenticatedRequest, @Param("groupId") groupId: string, @ZodBody(createRunSchema) dto: any) {
    return this.nettingService.createNettingRun(req.user.tenantId, groupId, dto);
  }

  @Patch("runs/:id")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Update netting run" })
  async updateRun(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createRunSchema.partial()) dto: any) {
    return this.nettingService.updateNettingRun(req.user.tenantId, id, dto);
  }

  @Delete("runs/:id")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Delete netting run" })
  async deleteRun(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.deleteNettingRun(req.user.tenantId, id);
  }

  @Post("runs/:id/submit")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Submit netting run for approval" })
  async submitRun(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.submitNettingRunForApproval(req.user.tenantId, id);
  }

  @Post("runs/:id/approve")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Approve netting run" })
  async approveRun(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.approveNettingRun(req.user.tenantId, id, req.user.userId);
  }

  @Post("runs/:id/cancel")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Cancel netting run" })
  async cancelRun(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.cancelNettingRun(req.user.tenantId, id);
  }

  @Post("runs/:id/compute")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Compute netting run" })
  async computeRun(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.computeNettingRun(req.user.tenantId, id);
  }

  @Get("runs/stats/:groupId")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "Get netting run stats" })
  async getRunStats(@Req() req: AuthenticatedRequest, @Param("groupId") groupId: string) {
    return this.nettingService.getNettingRunStats(req.user.tenantId, groupId);
  }

  @Post("runs/:id/settle")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Settle netting run" })
  async settleRun(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.settleNettingRun(req.user.tenantId, id);
  }

  @Get("settlements")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "List settlement instructions" })
  async getSettlements(@Req() req: AuthenticatedRequest, @Query("nettingRunId") nettingRunId?: string, @Query("status") status?: string) {
    return this.nettingService.getSettlementInstructions(req.user.tenantId, nettingRunId, status);
  }

  @Get("settlements/:id")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "Get settlement instruction by ID" })
  async getSettlementById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.getSettlementInstructionById(req.user.tenantId, id);
  }

  @Post("settlements")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Create settlement instruction" })
  async createSettlement(@Req() req: AuthenticatedRequest, @Param("runId") runId: string, @ZodBody(createSettlementSchema) dto: any) {
    return this.nettingService.createSettlementInstruction(req.user.tenantId, runId, dto);
  }

  @Patch("settlements/:id")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Update settlement instruction" })
  async updateSettlement(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createSettlementSchema.partial()) dto: any) {
    return this.nettingService.updateSettlementInstruction(req.user.tenantId, id, dto);
  }

  @Post("settlements/:id/execute")
  @Permissions("finance.eliminations.run")
  @ApiOperation({ summary: "Execute settlement instruction" })
  async executeSettlement(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.executeSettlementInstruction(req.user.tenantId, id);
  }

  @Post("settlements/:id/confirm")
  @Permissions("finance.eliminations.run")
  @ApiOperation({ summary: "Confirm settlement instruction" })
  async confirmSettlement(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ confirmationRef: z.string().optional() })) dto: any) {
    return this.nettingService.confirmSettlementInstruction(req.user.tenantId, id, dto.confirmationRef);
  }

  @Post("settlements/:id/fail")
  @Permissions("finance.eliminations.run")
  @ApiOperation({ summary: "Fail settlement instruction" })
  async failSettlement(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ errorMessage: z.string().optional() })) dto: any) {
    return this.nettingService.failSettlementInstruction(req.user.tenantId, id, dto.errorMessage);
  }

  @Delete("settlements/:id")
  @Permissions("finance.eliminations.manage")
  @ApiOperation({ summary: "Delete settlement instruction" })
  async deleteSettlement(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.nettingService.deleteSettlementInstruction(req.user.tenantId, id);
  }

  @Get("settlements/summary/:runId")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "Get settlement summary" })
  async getSettlementSummary(@Req() req: AuthenticatedRequest, @Param("runId") runId: string) {
    return this.nettingService.getSettlementSummary(req.user.tenantId, runId);
  }

  @Get("dashboard/:orgId")
  @Permissions("finance.eliminations.read")
  @ApiOperation({ summary: "Get netting dashboard" })
  async getDashboard(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string) {
    return this.nettingService.getNettingDashboard(req.user.tenantId, orgId);
  }
}

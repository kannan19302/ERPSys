import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ConsolidationV2Service } from "./services/consolidation-v2.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentGroupId: z.string().optional(),
  baseCurrency: z.string().min(1),
  consolidationMethod: z.string().min(1),
  fiscalYearEnd: z.string().optional(),
  status: z.string().optional(),
});
const addGroupMemberSchema = z.object({
  groupId: z.string().min(1),
  entityId: z.string().min(1),
  ownershipPercent: z.number().min(0).max(100),
  consolidationMethod: z.string().min(1),
  functionalCurrency: z.string().min(1),
  isDirectSubsidiary: z.boolean().optional(),
});
const createRunSchema = z.object({
  groupId: z.string().min(1),
  periodId: z.string().min(1),
  runNumber: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});
const createEliminationRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  ruleType: z.string().min(1),
  groupId: z.string().min(1),
  sourceAccount: z.string().min(1),
  targetAccount: z.string().min(1),
  eliminationCriteria: z.any().optional(),
  formula: z.string().optional(),
  status: z.string().optional(),
});

@ApiTags("advanced-finance-consolidation-v2")
@ApiBearerAuth()
@Controller("advanced-finance/consolidation-v2")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ConsolidationV2Controller {
  constructor(private readonly consService: ConsolidationV2Service) {}

  @Post("groups")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Create consolidation group" })
  async createGroup(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createGroupSchema) dto: any,
  ) {
    return this.consService.createGroup(req.user.tenantId, dto);
  }

  @Get("groups")
  @Permissions("finance.consolidation.read")
  @ApiOperation({ summary: "List consolidation groups" })
  async getGroups(
    @Req() req: AuthenticatedRequest,
    @Query("groupType") groupType?: string,
  ) {
    return this.consService.getGroups(req.user.tenantId, groupType);
  }

  @Get("groups/:id")
  @Permissions("finance.consolidation.read")
  @ApiOperation({ summary: "Get consolidation group" })
  async getGroup(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.consService.getGroup(req.user.tenantId, id);
  }

  @Patch("groups/:id")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Update consolidation group" })
  async updateGroup(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createGroupSchema.partial()) dto: any,
  ) {
    return this.consService.updateGroup(req.user.tenantId, id, dto);
  }

  @Delete("groups/:id")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Delete consolidation group" })
  async deleteGroup(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.consService.deleteGroup(req.user.tenantId, id);
  }

  @Post("members")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Add group member" })
  async addGroupMember(
    @Req() req: AuthenticatedRequest,
    @ZodBody(addGroupMemberSchema) dto: any,
  ) {
    return this.consService.addGroupMember(req.user.tenantId, dto);
  }

  @Delete("members/:id")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Remove group member" })
  async removeGroupMember(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.consService.removeGroupMember(req.user.tenantId, id);
  }

  @Get("groups/:id/tree")
  @Permissions("finance.consolidation.read")
  @ApiOperation({ summary: "Get group tree" })
  async getGroupTree(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.consService.getGroupTree(req.user.tenantId, id);
  }

  @Post("runs")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Create consolidation run" })
  async createRun(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createRunSchema) dto: any,
  ) {
    return this.consService.createRun(req.user.tenantId, req.user.userId, dto);
  }

  @Post("runs/:id/execute")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Execute consolidation run" })
  async executeRun(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.consService.executeRun(req.user.tenantId, id);
  }

  @Post("runs/:id/review")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Review consolidation run" })
  async reviewRun(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.consService.reviewRun(req.user.tenantId, id, req.user.userId);
  }

  @Post("runs/:id/post")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Post consolidation run" })
  async postRun(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.consService.postRun(req.user.tenantId, id);
  }

  @Post("elimination-rules")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Create elimination rule" })
  async createEliminationRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createEliminationRuleSchema) dto: any,
  ) {
    return this.consService.createEliminationRule(req.user.tenantId, dto);
  }

  @Get("elimination-rules")
  @Permissions("finance.consolidation.read")
  @ApiOperation({ summary: "List elimination rules" })
  async listEliminationRules(
    @Req() req: AuthenticatedRequest,
    @Query("groupId") groupId?: string,
  ) {
    return this.consService.listEliminationRules(req.user.tenantId, groupId);
  }

  @Get("elimination-rules/:id")
  @Permissions("finance.consolidation.read")
  @ApiOperation({ summary: "Get elimination rule" })
  async getEliminationRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.consService.getEliminationRule(req.user.tenantId, id);
  }

  @Patch("elimination-rules/:id")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Update elimination rule" })
  async updateEliminationRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createEliminationRuleSchema.partial()) dto: any,
  ) {
    return this.consService.updateEliminationRule(req.user.tenantId, id, dto);
  }

  @Delete("elimination-rules/:id")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Delete elimination rule" })
  async deleteEliminationRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.consService.deleteEliminationRule(req.user.tenantId, id);
  }

  @Post("elimination-rules/:id/auto-post")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Update elimination rule auto-post" })
  async updateEliminationRuleAutoPost(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ autoPost: z.boolean() })) dto: any,
  ) {
    return this.consService.updateEliminationRuleAutoPost(
      req.user.tenantId,
      id,
      dto.autoPost,
    );
  }

  @Get("elimination-entries")
  @Permissions("finance.consolidation.read")
  @ApiOperation({ summary: "List elimination entries" })
  async listEliminationEntries(
    @Req() req: AuthenticatedRequest,
    @Query("runId") runId?: string,
    @Query("status") status?: string,
  ) {
    return this.consService.listEliminationEntries(req.user.tenantId, {
      runId,
      status,
    });
  }

  @Post("elimination-entries/:id/approve")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Approve elimination entry" })
  async approveEliminationEntry(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.consService.approveEliminationEntry(req.user.tenantId, id);
  }

  @Post("elimination-entries/:id/post")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Post elimination entry" })
  async postEliminationEntry(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.consService.postEliminationEntry(req.user.tenantId, id);
  }

  @Post("translation-adjustments/compute")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Compute translation adjustments" })
  async computeTranslationAdjustments(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        runId: z.string().min(1),
        reportingCurrency: z.string().min(1),
      }),
    )
    dto: any,
  ) {
    return this.consService.computeTranslationAdjustments(
      req.user.tenantId,
      dto.runId,
      dto.reportingCurrency,
    );
  }

  @Get("translation-adjustments")
  @Permissions("finance.consolidation.read")
  @ApiOperation({ summary: "List translation adjustments" })
  async listTranslationAdjustments(
    @Req() req: AuthenticatedRequest,
    @Query("runId") runId: string,
  ) {
    return this.consService.listTranslationAdjustments(
      req.user.tenantId,
      runId,
    );
  }

  @Post("minority-interest/compute")
  @Permissions("finance.consolidation.manage")
  @ApiOperation({ summary: "Compute minority interest" })
  async computeMinorityInterest(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ runId: z.string().min(1) })) dto: any,
  ) {
    return this.consService.computeMinorityInterest(
      req.user.tenantId,
      dto.runId,
    );
  }

  @Get("minority-interest")
  @Permissions("finance.consolidation.read")
  @ApiOperation({ summary: "List minority interest entries" })
  async listMinorityInterest(
    @Req() req: AuthenticatedRequest,
    @Query("runId") runId: string,
  ) {
    return this.consService.listMinorityInterest(req.user.tenantId, runId);
  }

  @Get("dashboard")
  @Permissions("finance.consolidation.read")
  @ApiOperation({ summary: "Get consolidation dashboard" })
  async getConsolidationDashboard(@Req() req: AuthenticatedRequest) {
    return this.consService.getConsolidationDashboard(req.user.tenantId);
  }
}

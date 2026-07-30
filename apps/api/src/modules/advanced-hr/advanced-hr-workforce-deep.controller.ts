import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AdvancedHrWorkforceDeepService } from "./services/advanced-hr-workforce-deep.service";

@ApiTags("AdvancedHrWorkforceDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-hr/workforce-deep")
export class AdvancedHrWorkforceDeepController {
  constructor(private readonly workforceDeepService: AdvancedHrWorkforceDeepService) {}

  @ApiOperation({ summary: "List headcount plans" })
  @Permissions("advanced-hr.workforce-planning.view")
  @Get("headcount-plans")
  async listHeadcountPlans(
    @Req() req: any,
    @Query("fiscalYear") fiscalYear?: string,
    @Query("status") status?: string,
  ) {
    return this.workforceDeepService.listHeadcountPlans(req.user.tenantId, fiscalYear, status);
  }

  @ApiOperation({ summary: "Get headcount plan by id" })
  @Permissions("advanced-hr.workforce-planning.view")
  @Get("headcount-plans/:id")
  async getHeadcountPlan(@Req() req: any, @Param("id") id: string) {
    return this.workforceDeepService.getHeadcountPlan(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create headcount plan" })
  @Permissions("advanced-hr.workforce-planning.manage")
  @Post("headcount-plans")
  async createHeadcountPlan(
    @Req() req: any,
    @Body() dto: { name: string; fiscalYear: number; description?: string },
  ) {
    return this.workforceDeepService.createHeadcountPlan(req.user.tenantId, dto, req.user.id);
  }

  @ApiOperation({ summary: "Update headcount plan" })
  @Permissions("advanced-hr.workforce-planning.manage")
  @Patch("headcount-plans/:id")
  async updateHeadcountPlan(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: { name?: string; description?: string; status?: string },
  ) {
    return this.workforceDeepService.updateHeadcountPlan(req.user.tenantId, id, dto, req.user.id);
  }

  @ApiOperation({ summary: "List headcount plan lines" })
  @Permissions("advanced-hr.workforce-planning.view")
  @Get("headcount-plans/:planId/lines")
  async listHeadcountPlanLines(@Req() req: any, @Param("planId") planId: string) {
    return this.workforceDeepService.listHeadcountPlanLines(req.user.tenantId, planId);
  }

  @ApiOperation({ summary: "List succession plans" })
  @Permissions("advanced-hr.workforce-planning.view")
  @Get("succession-plans")
  async listSuccessionPlans(
    @Req() req: any,
    @Query("status") status?: string,
  ) {
    return this.workforceDeepService.listSuccessionPlans(req.user.tenantId, status);
  }

  @ApiOperation({ summary: "Get succession plan by id" })
  @Permissions("advanced-hr.workforce-planning.view")
  @Get("succession-plans/:id")
  async getSuccessionPlan(@Req() req: any, @Param("id") id: string) {
    return this.workforceDeepService.getSuccessionPlan(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create succession plan" })
  @Permissions("advanced-hr.workforce-planning.manage")
  @Post("succession-plans")
  async createSuccessionPlan(
    @Req() req: any,
    @Body() dto: { positionId: string; riskLevel?: string; notes?: string },
  ) {
    return this.workforceDeepService.createSuccessionPlan(req.user.tenantId, dto, req.user.id);
  }

  @ApiOperation({ summary: "List succession candidates" })
  @Permissions("advanced-hr.workforce-planning.view")
  @Get("succession-plans/:planId/candidates")
  async listSuccessionCandidates(@Req() req: any, @Param("planId") planId: string) {
    return this.workforceDeepService.listSuccessionCandidates(req.user.tenantId, planId);
  }

  @ApiOperation({ summary: "Add succession candidate" })
  @Permissions("advanced-hr.workforce-planning.manage")
  @Post("succession-candidates")
  async addSuccessionCandidate(
    @Req() req: any,
    @Body() dto: { planId: string; employeeId: string; readinessLevel: string; readinessTimeline?: string; strengths?: string; developmentAreas?: string; isPreferred?: boolean; rank?: number },
  ) {
    return this.workforceDeepService.addSuccessionCandidate(req.user.tenantId, dto, req.user.id);
  }

  @ApiOperation({ summary: "Get skill gap analysis" })
  @Permissions("advanced-hr.workforce-planning.view")
  @Get("skill-gap-analysis")
  async getSkillGapAnalysis(
    @Req() req: any,
    @Query("departmentId") departmentId?: string,
  ) {
    return this.workforceDeepService.getSkillGapAnalysis(req.user.tenantId, departmentId);
  }

  @ApiOperation({ summary: "List career paths" })
  @Permissions("advanced-hr.workforce-planning.view")
  @Get("career-paths")
  async listCareerPaths(
    @Req() req: any,
    @Query("departmentId") departmentId?: string,
  ) {
    return this.workforceDeepService.listCareerPaths(req.user.tenantId, departmentId);
  }

  @ApiOperation({ summary: "List mentoring programs" })
  @Permissions("advanced-hr.workforce-planning.view")
  @Get("mentoring-programs")
  async listMentoringPrograms(
    @Req() req: any,
    @Query("status") status?: string,
  ) {
    return this.workforceDeepService.listMentoringPrograms(req.user.tenantId, status);
  }
}

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
} from "@nestjs/common";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrCompensationService } from "./hr-compensation.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  createBonusPlanSchema,
  createBonusPayoutSchema,
  createEquityGrantSchema,
  createBenefitsEligibilityRuleSchema,
  createFlexibleBenefitCreditSchema,
  createCompensationReviewSchema,
  createCompensationBenchmarkSchema,
} from "@unerp/shared";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced-compensation")
@ApiBearerAuth()
@Controller("hr-advanced/compensation")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrCompensationController {
  constructor(private readonly hrCompensationService: HrCompensationService) {}

  // ══ BONUS PLANS ══

  @Get("bonus-plans")
  @Permissions("hr.bonus-plans.read")
  @ApiOperation({ summary: "List bonus plans with pagination and filters" })
  async getBonusPlans(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrCompensationService.getBonusPlans(req.user.tenantId, q);
  }

  @Get("bonus-plans/:id")
  @Permissions("hr.bonus-plans.read")
  @ApiOperation({ summary: "Get bonus plan by ID" })
  async getBonusPlanById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.getBonusPlanById(req.user.tenantId, id);
  }

  @Post("bonus-plans")
  @Permissions("hr.bonus-plans.create")
  @ApiOperation({ summary: "Create bonus plan" })
  async createBonusPlan(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBonusPlanSchema) dto: any,
  ) {
    return this.hrCompensationService.createBonusPlan(req.user.tenantId, dto);
  }

  @Patch("bonus-plans/:id")
  @Permissions("hr.bonus-plans.update")
  @ApiOperation({ summary: "Update bonus plan" })
  async updateBonusPlan(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createBonusPlanSchema.partial()) dto: any,
  ) {
    return this.hrCompensationService.updateBonusPlan(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("bonus-plans/:id")
  @Permissions("hr.bonus-plans.delete")
  @ApiOperation({ summary: "Delete bonus plan" })
  async deleteBonusPlan(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.deleteBonusPlan(req.user.tenantId, id);
  }

  // ══ BONUS PAYOUTS ══

  @Get("bonus-payouts")
  @Permissions("hr.bonus-payouts.read")
  @ApiOperation({ summary: "List bonus payouts with pagination and filters" })
  async getBonusPayouts(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrCompensationService.getBonusPayouts(req.user.tenantId, q);
  }

  @Get("bonus-payouts/:id")
  @Permissions("hr.bonus-payouts.read")
  @ApiOperation({ summary: "Get bonus payout by ID" })
  async getBonusPayoutById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.getBonusPayoutById(req.user.tenantId, id);
  }

  @Post("bonus-payouts")
  @Permissions("hr.bonus-payouts.create")
  @ApiOperation({ summary: "Create bonus payout" })
  async createBonusPayout(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBonusPayoutSchema) dto: any,
  ) {
    return this.hrCompensationService.createBonusPayout(req.user.tenantId, dto);
  }

  @Post("bonus-payouts/:id/approve")
  @Permissions("hr.bonus-payouts.approve")
  @ApiOperation({ summary: "Approve bonus payout" })
  async approveBonusPayout(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.approveBonusPayout(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Delete("bonus-payouts/:id")
  @Permissions("hr.bonus-payouts.delete")
  @ApiOperation({ summary: "Delete bonus payout" })
  async deleteBonusPayout(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.deleteBonusPayout(req.user.tenantId, id);
  }

  // ══ EQUITY GRANTS ══

  @Get("equity-grants")
  @Permissions("hr.equity.read")
  @ApiOperation({ summary: "List equity grants with pagination and filters" })
  async getEquityGrants(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrCompensationService.getEquityGrants(req.user.tenantId, q);
  }

  @Get("equity-grants/:id")
  @Permissions("hr.equity.read")
  @ApiOperation({ summary: "Get equity grant by ID" })
  async getEquityGrantById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.getEquityGrantById(req.user.tenantId, id);
  }

  @Post("equity-grants")
  @Permissions("hr.equity.create")
  @ApiOperation({ summary: "Create equity grant" })
  async createEquityGrant(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createEquityGrantSchema) dto: any,
  ) {
    return this.hrCompensationService.createEquityGrant(req.user.tenantId, dto);
  }

  @Patch("equity-grants/:id")
  @Permissions("hr.equity.update")
  @ApiOperation({ summary: "Update equity grant" })
  async updateEquityGrant(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createEquityGrantSchema.partial()) dto: any,
  ) {
    return this.hrCompensationService.updateEquityGrant(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("equity-grants/:id")
  @Permissions("hr.equity.delete")
  @ApiOperation({ summary: "Delete equity grant" })
  async deleteEquityGrant(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.deleteEquityGrant(req.user.tenantId, id);
  }

  // ══ EQUITY VESTING ══

  @Post("equity-grants/:grantId/generate-vesting")
  @Permissions("hr.equity.create")
  @ApiOperation({ summary: "Generate vesting schedule from equity grant" })
  async generateVestingSchedule(
    @Req() req: AuthenticatedRequest,
    @Param("grantId") grantId: string,
  ) {
    return this.hrCompensationService.generateVestingSchedule(
      req.user.tenantId,
      grantId,
    );
  }

  @Get("vesting-schedules")
  @Permissions("hr.equity.read")
  @ApiOperation({ summary: "List vesting schedules, optionally by grantId" })
  async getVestingSchedules(
    @Req() req: AuthenticatedRequest,
    @Query("grantId") grantId?: string,
  ) {
    return this.hrCompensationService.getVestingSchedules(
      req.user.tenantId,
      grantId,
    );
  }

  @Post("vesting-schedules/:id/mark-vested")
  @Permissions("hr.equity.update")
  @ApiOperation({ summary: "Mark vesting schedule entry as vested" })
  async markVested(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.hrCompensationService.markVested(req.user.tenantId, id);
  }

  // ══ BENEFITS ELIGIBILITY RULES ══

  @Get("eligibility-rules")
  @Permissions("hr.benefits.eligibility.read")
  @ApiOperation({
    summary: "List eligibility rules, optionally by benefitType",
  })
  async getEligibilityRules(
    @Req() req: AuthenticatedRequest,
    @Query("benefitType") benefitType?: string,
  ) {
    return this.hrCompensationService.getEligibilityRules(
      req.user.tenantId,
      benefitType,
    );
  }

  @Get("eligibility-rules/:id")
  @Permissions("hr.benefits.eligibility.read")
  @ApiOperation({ summary: "Get eligibility rule by ID" })
  async getEligibilityRuleById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.getEligibilityRuleById(
      req.user.tenantId,
      id,
    );
  }

  @Post("eligibility-rules")
  @Permissions("hr.benefits.eligibility.create")
  @ApiOperation({ summary: "Create eligibility rule" })
  async createEligibilityRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBenefitsEligibilityRuleSchema) dto: any,
  ) {
    return this.hrCompensationService.createEligibilityRule(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("eligibility-rules/:id")
  @Permissions("hr.benefits.eligibility.update")
  @ApiOperation({ summary: "Update eligibility rule" })
  async updateEligibilityRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createBenefitsEligibilityRuleSchema.partial()) dto: any,
  ) {
    return this.hrCompensationService.updateEligibilityRule(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("eligibility-rules/:id")
  @Permissions("hr.benefits.eligibility.delete")
  @ApiOperation({ summary: "Delete eligibility rule" })
  async deleteEligibilityRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.deleteEligibilityRule(
      req.user.tenantId,
      id,
    );
  }

  @Get("check-eligibility/:employeeId")
  @Permissions("hr.benefits.eligibility.read")
  @ApiOperation({ summary: "Check employee eligibility for a benefit type" })
  async checkEmployeeEligibility(
    @Req() req: AuthenticatedRequest,
    @Param("employeeId") employeeId: string,
    @Query("benefitType") benefitType: string,
  ) {
    return this.hrCompensationService.checkEmployeeEligibility(
      req.user.tenantId,
      employeeId,
      benefitType,
    );
  }

  // ══ FLEXIBLE BENEFIT CREDITS ══

  @Get("flexible-credits")
  @Permissions("hr.benefits.flexible.read")
  @ApiOperation({ summary: "List flexible benefit credits" })
  async getFlexibleCredits(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return this.hrCompensationService.getFlexibleCredits(
      req.user.tenantId,
      employeeId,
      fiscalYear ? parseInt(fiscalYear) : undefined,
    );
  }

  @Get("flexible-credits/:id")
  @Permissions("hr.benefits.flexible.read")
  @ApiOperation({ summary: "Get flexible benefit credit by ID" })
  async getFlexibleCreditById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.getFlexibleCreditById(
      req.user.tenantId,
      id,
    );
  }

  @Post("flexible-credits")
  @Permissions("hr.benefits.flexible.create")
  @ApiOperation({ summary: "Create flexible benefit credit" })
  async createFlexibleCredit(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createFlexibleBenefitCreditSchema) dto: any,
  ) {
    return this.hrCompensationService.createFlexibleCredit(
      req.user.tenantId,
      dto,
    );
  }

  @Post("flexible-credits/:id/allocate")
  @Permissions("hr.benefits.flexible.update")
  @ApiOperation({ summary: "Allocate flexible credit (use credit)" })
  async allocateFlexibleCredit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createFlexibleBenefitCreditSchema.partial()) dto: any,
  ) {
    return this.hrCompensationService.useFlexibleCredit(
      req.user.tenantId,
      id,
      dto.amount || 0,
      dto.allocation || {},
    );
  }

  // ══ COMPENSATION REVIEWS ══

  @Get("reviews")
  @Permissions("hr.compensation.reviews.read")
  @ApiOperation({
    summary: "List compensation reviews with pagination and filters",
  })
  async getCompensationReviews(
    @Req() req: AuthenticatedRequest,
    @Query() q: any,
  ) {
    return this.hrCompensationService.getCompensationReviews(
      req.user.tenantId,
      q,
    );
  }

  @Get("reviews/:id")
  @Permissions("hr.compensation.reviews.read")
  @ApiOperation({ summary: "Get compensation review by ID" })
  async getCompensationReviewById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.getCompensationReviewById(
      req.user.tenantId,
      id,
    );
  }

  @Post("reviews")
  @Permissions("hr.compensation.reviews.create")
  @ApiOperation({ summary: "Create compensation review" })
  async createCompensationReview(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCompensationReviewSchema) dto: any,
  ) {
    return this.hrCompensationService.createCompensationReview(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("reviews/:id")
  @Permissions("hr.compensation.reviews.update")
  @ApiOperation({ summary: "Update compensation review" })
  async updateCompensationReview(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createCompensationReviewSchema.partial()) dto: any,
  ) {
    return this.hrCompensationService.updateCompensationReview(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("reviews/:id/approve")
  @Permissions("hr.compensation.reviews.approve")
  @ApiOperation({ summary: "Approve compensation review" })
  async approveCompensationReview(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.approveCompensationReview(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Delete("reviews/:id")
  @Permissions("hr.compensation.reviews.delete")
  @ApiOperation({ summary: "Delete compensation review" })
  async deleteCompensationReview(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.deleteCompensationReview(
      req.user.tenantId,
      id,
    );
  }

  // ══ COMPENSATION BENCHMARKS ══

  @Get("benchmarks")
  @Permissions("hr.compensation.benchmarks.read")
  @ApiOperation({
    summary: "List compensation benchmarks, optionally by positionTitle",
  })
  async getCompensationBenchmarks(
    @Req() req: AuthenticatedRequest,
    @Query("positionTitle") positionTitle?: string,
  ) {
    return this.hrCompensationService.getCompensationBenchmarks(
      req.user.tenantId,
      positionTitle,
    );
  }

  @Get("benchmarks/:id")
  @Permissions("hr.compensation.benchmarks.read")
  @ApiOperation({ summary: "Get compensation benchmark by ID" })
  async getCompensationBenchmarkById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.getCompensationBenchmarkById(
      req.user.tenantId,
      id,
    );
  }

  @Post("benchmarks")
  @Permissions("hr.compensation.benchmarks.create")
  @ApiOperation({ summary: "Create compensation benchmark" })
  async createCompensationBenchmark(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCompensationBenchmarkSchema) dto: any,
  ) {
    return this.hrCompensationService.createCompensationBenchmark(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("benchmarks/:id")
  @Permissions("hr.compensation.benchmarks.update")
  @ApiOperation({ summary: "Update compensation benchmark" })
  async updateCompensationBenchmark(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createCompensationBenchmarkSchema.partial()) dto: any,
  ) {
    return this.hrCompensationService.updateCompensationBenchmark(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("benchmarks/:id")
  @Permissions("hr.compensation.benchmarks.delete")
  @ApiOperation({ summary: "Delete compensation benchmark" })
  async deleteCompensationBenchmark(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.deleteCompensationBenchmark(
      req.user.tenantId,
      id,
    );
  }

  @Get("benchmark-comparison/:employeeId")
  @Permissions("hr.compensation.benchmarks.read")
  @ApiOperation({
    summary: "Get compensation benchmark comparison for an employee",
  })
  async getBenchmarkComparison(
    @Req() req: AuthenticatedRequest,
    @Param("employeeId") employeeId: string,
  ) {
    return this.hrCompensationService.getBenchmarkComparison(
      req.user.tenantId,
      employeeId,
    );
  }

  // ══ TOTAL REWARDS STATEMENTS ══

  @Post("rewards-statements/generate/:employeeId")
  @Permissions("hr.compensation.rewards-statements.create")
  @ApiOperation({ summary: "Generate total rewards statement for an employee" })
  async generateRewardsStatement(
    @Req() req: AuthenticatedRequest,
    @Param("employeeId") employeeId: string,
  ) {
    return this.hrCompensationService.generateTotalRewardsStatement(
      req.user.tenantId,
      employeeId,
    );
  }

  @Get("rewards-statements")
  @Permissions("hr.compensation.rewards-statements.read")
  @ApiOperation({ summary: "List total rewards statements" })
  async getTotalRewardsStatements(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrCompensationService.getTotalRewardsStatements(
      req.user.tenantId,
      employeeId,
    );
  }

  @Get("rewards-statements/:id")
  @Permissions("hr.compensation.rewards-statements.read")
  @ApiOperation({ summary: "Get total rewards statement by ID" })
  async getTotalRewardsStatementById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.getTotalRewardsStatementById(
      req.user.tenantId,
      id,
    );
  }

  @Post("rewards-statements/:id/regenerate")
  @Permissions("hr.compensation.rewards-statements.create")
  @ApiOperation({ summary: "Regenerate total rewards statement" })
  async regenerateRewardsStatement(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrCompensationService.regenerateRewardsStatement(
      req.user.tenantId,
      id,
    );
  }

  // ══ ANALYTICS ══

  @Get("analytics")
  @Permissions("hr.bonus-plans.read")
  @ApiOperation({ summary: "Get compensation analytics overview" })
  async getCompensationAnalytics(@Req() req: AuthenticatedRequest) {
    return this.hrCompensationService.getCompensationAnalytics(
      req.user.tenantId,
    );
  }
}

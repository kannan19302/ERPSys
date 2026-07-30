// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HrCompensationService {
  // ══════════════════════════════════════════════════════════════
  // BONUS PLANS
  // ══════════════════════════════════════════════════════════════

  async getBonusPlans(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      planType?: string;
      isActive?: string;
    } = {},
  ) {
    const where: any = { tenantId };
    if (params.planType) where.planType = params.planType;
    if (params.isActive !== undefined)
      where.isActive = params.isActive === "true";
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const p = prisma as any;
    const [items, total] = await Promise.all([
      p.bonusPlan
        ? p.bonusPlan.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: "asc" },
            include: { _count: { select: { payouts: true } } },
          })
        : Promise.resolve([]),
      p.bonusPlan ? p.bonusPlan.count({ where }) : Promise.resolve(0),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBonusPlanById(tenantId: string, id: string) {
    const item = await (prisma as any).bonusPlan?.findFirst({
      where: { id, tenantId },
      include: { payouts: { orderBy: { payoutDate: "desc" }, take: 10 } },
    });
    if (!item) throw new NotFoundException("Bonus plan not found");
    return item;
  }

  async createBonusPlan(tenantId: string, dto: any) {
    return (prisma as any).bonusPlan?.create({
      data: {
        tenantId,
        name: dto.name,
        planType: dto.planType,
        eligibilityRule: dto.eligibilityRule || null,
        calculationBasis: dto.calculationBasis || "FIXED",
        targetAmount: dto.targetAmount || null,
        maxAmount: dto.maxAmount || null,
        payoutFrequency: dto.payoutFrequency || "ANNUAL",
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateBonusPlan(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).bonusPlan?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Bonus plan not found");
    return (prisma as any).bonusPlan?.update({
      where: { id },
      data: {
        name: dto.name,
        planType: dto.planType,
        eligibilityRule: dto.eligibilityRule,
        calculationBasis: dto.calculationBasis,
        targetAmount: dto.targetAmount,
        maxAmount: dto.maxAmount,
        payoutFrequency: dto.payoutFrequency,
        isActive: dto.isActive,
      },
    });
  }

  async deleteBonusPlan(tenantId: string, id: string) {
    const item = await (prisma as any).bonusPlan?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Bonus plan not found");
    await (prisma as any).bonusPlan?.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // BONUS PAYOUTS
  // ══════════════════════════════════════════════════════════════

  async getBonusPayouts(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      planId?: string;
      employeeId?: string;
    } = {},
  ) {
    const where: any = { tenantId };
    if (params.planId) where.planId = params.planId;
    if (params.employeeId) where.employeeId = params.employeeId;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const p = prisma as any;
    const [items, total] = await Promise.all([
      p.bonusPayout
        ? p.bonusPayout.findMany({
            where,
            skip,
            take: limit,
            orderBy: { payoutDate: "desc" },
            include: {
              plan: { select: { id: true, name: true, planType: true } },
            },
          })
        : Promise.resolve([]),
      p.bonusPayout ? p.bonusPayout.count({ where }) : Promise.resolve(0),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBonusPayoutById(tenantId: string, id: string) {
    const item = await (prisma as any).bonusPayout?.findFirst({
      where: { id, tenantId },
      include: { plan: true },
    });
    if (!item) throw new NotFoundException("Bonus payout not found");
    return item;
  }

  async createBonusPayout(tenantId: string, dto: any) {
    const plan = await (prisma as any).bonusPlan?.findFirst({
      where: { id: dto.planId, tenantId },
    });
    if (!plan) throw new NotFoundException("Bonus plan not found");
    return (prisma as any).bonusPayout?.create({
      data: {
        tenantId,
        planId: dto.planId,
        employeeId: dto.employeeId,
        amount: dto.amount,
        payoutDate: new Date(dto.payoutDate),
        percentage: dto.percentage || null,
        reason: dto.reason || null,
        notes: dto.notes || null,
      },
    });
  }

  async approveBonusPayout(tenantId: string, id: string, userId: string) {
    const item = await (prisma as any).bonusPayout?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Bonus payout not found");
    if (item.approvedAt)
      throw new BadRequestException("Bonus payout is already approved");
    return (prisma as any).bonusPayout?.update({
      where: { id },
      data: {
        approvedBy: userId,
        approvedAt: new Date(),
        isPaid: true,
        paidAt: new Date(),
      },
    });
  }

  async deleteBonusPayout(tenantId: string, id: string) {
    const item = await (prisma as any).bonusPayout?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Bonus payout not found");
    await (prisma as any).bonusPayout?.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // EQUITY GRANTS
  // ══════════════════════════════════════════════════════════════

  async getEquityGrants(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      employeeId?: string;
      status?: string;
    } = {},
  ) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.status) where.status = params.status;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const p = prisma as any;
    const [items, total] = await Promise.all([
      p.equityGrant
        ? p.equityGrant.findMany({
            where,
            skip,
            take: limit,
            orderBy: { grantDate: "desc" },
            include: { _count: { select: { vestingEvents: true } } },
          })
        : Promise.resolve([]),
      p.equityGrant ? p.equityGrant.count({ where }) : Promise.resolve(0),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getEquityGrantById(tenantId: string, id: string) {
    const item = await (prisma as any).equityGrant?.findFirst({
      where: { id, tenantId },
      include: { vestingEvents: { orderBy: { vestingDate: "asc" } } },
    });
    if (!item) throw new NotFoundException("Equity grant not found");
    return item;
  }

  async createEquityGrant(tenantId: string, dto: any) {
    return (prisma as any).equityGrant?.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        grantType: dto.grantType,
        totalShares: dto.totalShares,
        sharePrice: dto.sharePrice,
        grantDate: new Date(dto.grantDate),
        cliffMonths: dto.cliffMonths || 12,
        vestingMonths: dto.vestingMonths || 48,
        vestingSchedule: dto.vestingSchedule || "EQUAL_MONTHLY",
        status: "GRANTED",
      },
    });
  }

  async updateEquityGrant(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).equityGrant?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Equity grant not found");
    return (prisma as any).equityGrant?.update({
      where: { id },
      data: {
        grantType: dto.grantType,
        totalShares: dto.totalShares,
        sharePrice: dto.sharePrice,
        grantDate: dto.grantDate ? new Date(dto.grantDate) : undefined,
        cliffMonths: dto.cliffMonths,
        vestingMonths: dto.vestingMonths,
        vestingSchedule: dto.vestingSchedule,
        status: dto.status,
      },
    });
  }

  async deleteEquityGrant(tenantId: string, id: string) {
    const item = await (prisma as any).equityGrant?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Equity grant not found");
    await (prisma as any).equityGrant?.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // EQUITY VESTING SCHEDULE
  // ══════════════════════════════════════════════════════════════

  async generateVestingSchedule(tenantId: string, grantId: string) {
    const grant = await (prisma as any).equityGrant?.findFirst({
      where: { id: grantId, tenantId },
    });
    if (!grant) throw new NotFoundException("Equity grant not found");
    const existing = (prisma as any).equityVestingSchedule
      ? await (prisma as any).equityVestingSchedule.findMany({
          where: { tenantId, grantId },
        })
      : [];
    if (existing.length > 0)
      throw new BadRequestException(
        "Vesting schedule already generated for this grant",
      );

    const totalShares = Number(grant.totalShares);
    const cliffMonths = grant.cliffMonths;
    const vestingMonths = grant.vestingMonths;
    const isEqualMonthly = grant.vestingSchedule === "EQUAL_MONTHLY";
    const monthlyShares = isEqualMonthly
      ? totalShares / vestingMonths
      : totalShares / (vestingMonths / 3);
    const schedules: any[] = [];
    let cumulative = 0;

    for (let month = 1; month <= vestingMonths; month++) {
      const vestingDate = new Date(grant.grantDate);
      vestingDate.setMonth(vestingDate.getMonth() + month);
      if (month <= cliffMonths) {
        if (month === cliffMonths) {
          const cliffShares = monthlyShares * cliffMonths;
          cumulative += cliffShares;
          schedules.push({
            tenantId,
            grantId,
            vestingDate,
            sharesVesting: cliffShares,
            cumulativeVested: cumulative,
            isCliff: true,
            status: "PENDING",
          });
        }
        continue;
      }
      cumulative += monthlyShares;
      schedules.push({
        tenantId,
        grantId,
        vestingDate,
        sharesVesting: monthlyShares,
        cumulativeVested: cumulative,
        isCliff: false,
        status: "PENDING",
      });
    }

    if ((prisma as any).equityVestingSchedule) {
      await (prisma as any).equityVestingSchedule.createMany({
        data: schedules,
      });
    }
    return { generated: schedules.length, grantId };
  }

  async getVestingSchedules(tenantId: string, grantId?: string) {
    const where: any = { tenantId };
    if (grantId) where.grantId = grantId;
    return (
      (prisma as any).equityVestingSchedule?.findMany({
        where,
        orderBy: { vestingDate: "asc" },
        include: {
          grant: { select: { id: true, grantType: true, totalShares: true } },
        },
      }) || []
    );
  }

  async markVested(tenantId: string, id: string) {
    const item = await (prisma as any).equityVestingSchedule?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Vesting schedule entry not found");
    if (item.status === "VESTED")
      throw new BadRequestException("Already vested");
    return (prisma as any).equityVestingSchedule?.update({
      where: { id },
      data: { status: "VESTED", vestedAt: new Date() },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // BENEFITS ELIGIBILITY RULES
  // ══════════════════════════════════════════════════════════════

  async getEligibilityRules(tenantId: string, benefitType?: string) {
    const where: any = { tenantId };
    if (benefitType) where.benefitType = benefitType;
    return (
      (prisma as any).benefitsEligibilityRule?.findMany({
        where,
        orderBy: { name: "asc" },
      }) || []
    );
  }

  async getEligibilityRuleById(tenantId: string, id: string) {
    const item = await (prisma as any).benefitsEligibilityRule?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Eligibility rule not found");
    return item;
  }

  async createEligibilityRule(tenantId: string, dto: any) {
    return (prisma as any).benefitsEligibilityRule?.create({
      data: {
        tenantId,
        name: dto.name,
        benefitType: dto.benefitType,
        employmentType: dto.employmentType || null,
        minTenureMonths: dto.minTenureMonths || null,
        minHoursPerWeek: dto.minHoursPerWeek || null,
        jobGrade: dto.jobGrade || null,
        location: dto.location || null,
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateEligibilityRule(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).benefitsEligibilityRule?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Eligibility rule not found");
    return (prisma as any).benefitsEligibilityRule?.update({
      where: { id },
      data: {
        name: dto.name,
        benefitType: dto.benefitType,
        employmentType: dto.employmentType,
        minTenureMonths: dto.minTenureMonths,
        minHoursPerWeek: dto.minHoursPerWeek,
        jobGrade: dto.jobGrade,
        location: dto.location,
        isActive: dto.isActive,
      },
    });
  }

  async deleteEligibilityRule(tenantId: string, id: string) {
    const item = await (prisma as any).benefitsEligibilityRule?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Eligibility rule not found");
    await (prisma as any).benefitsEligibilityRule?.delete({ where: { id } });
    return { success: true };
  }

  async checkEmployeeEligibility(
    tenantId: string,
    employeeId: string,
    benefitType: string,
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    const rules =
      (await (prisma as any).benefitsEligibilityRule?.findMany({
        where: { tenantId, benefitType, isActive: true },
      })) || [];
    if (rules.length === 0)
      return {
        employeeId,
        benefitType,
        isEligible: false,
        reason: "No active eligibility rules for this benefit type",
        rules: [],
      };

    const tenureMonths = (employee as any).dateOfJoining
      ? Math.floor(
          (Date.now() - new Date((employee as any).dateOfJoining).getTime()) /
            (1000 * 60 * 60 * 24 * 30.44),
        )
      : 0;
    const results = rules.map((rule: any) => {
      const checks: string[] = [];
      let passes = true;
      if (
        rule.employmentType &&
        (employee as any).employmentType !== rule.employmentType
      ) {
        passes = false;
        checks.push(`employmentType mismatch: expected ${rule.employmentType}`);
      }
      if (rule.minTenureMonths && tenureMonths < rule.minTenureMonths) {
        passes = false;
        checks.push(
          `tenure ${tenureMonths}m < minimum ${rule.minTenureMonths}m`,
        );
      }
      if (
        rule.minHoursPerWeek &&
        Number((employee as any).hoursPerWeek || 0) <
          Number(rule.minHoursPerWeek)
      ) {
        passes = false;
        checks.push(`hours per week insufficient`);
      }
      if (rule.jobGrade && (employee as any).grade !== rule.jobGrade) {
        passes = false;
        checks.push(`grade mismatch: expected ${rule.jobGrade}`);
      }
      return { ruleId: rule.id, ruleName: rule.name, passes, checks };
    });
    return {
      employeeId,
      benefitType,
      isEligible: results.some((r: any) => r.passes),
      reason: results.some((r: any) => r.passes)
        ? "Employee meets at least one eligibility rule"
        : "Employee does not meet any eligibility rule",
      rules: results,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // FLEXIBLE BENEFIT CREDITS
  // ══════════════════════════════════════════════════════════════

  async getFlexibleCredits(
    tenantId: string,
    employeeId?: string,
    fiscalYear?: number,
  ) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (fiscalYear) where.fiscalYear = fiscalYear;
    return (
      (prisma as any).flexibleBenefitCredit?.findMany({
        where,
        orderBy: [{ fiscalYear: "desc" }, { employeeId: "asc" }],
      }) || []
    );
  }

  async getFlexibleCreditById(tenantId: string, id: string) {
    const item = await (prisma as any).flexibleBenefitCredit?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Flexible benefit credit not found");
    return item;
  }

  async createFlexibleCredit(tenantId: string, dto: any) {
    const existing = await (prisma as any).flexibleBenefitCredit?.findFirst({
      where: {
        tenantId,
        employeeId: dto.employeeId,
        fiscalYear: dto.fiscalYear,
      },
    });
    if (existing)
      throw new BadRequestException(
        "Flexible credit already exists for this employee and fiscal year",
      );
    return (prisma as any).flexibleBenefitCredit?.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        fiscalYear: dto.fiscalYear,
        totalCredit: dto.totalCredit,
        usedCredit: 0,
        remainingCredit: dto.totalCredit,
        status: "ACTIVE",
      },
    });
  }

  async allocateFlexibleCredit(
    tenantId: string,
    id: string,
    amount: number,
    allocation: any,
  ) {
    const item = await (prisma as any).flexibleBenefitCredit?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Flexible benefit credit not found");
    if (item.status !== "ACTIVE")
      throw new BadRequestException("Flexible credit is not ACTIVE");
    const newUsed = Number(item.usedCredit) + amount;
    const total = Number(item.totalCredit);
    if (newUsed > total)
      throw new BadRequestException("Insufficient remaining credit");
    const allocations = (item.allocations as any[]) || [];
    allocations.push(allocation);
    return (prisma as any).flexibleBenefitCredit?.update({
      where: { id },
      data: {
        usedCredit: newUsed,
        remainingCredit: total - newUsed,
        allocations,
      },
    });
  }

  async useFlexibleCredit(
    tenantId: string,
    id: string,
    amount: number,
    allocation: any,
  ) {
    return this.allocateFlexibleCredit(tenantId, id, amount, allocation);
  }

  // ══════════════════════════════════════════════════════════════
  // COMPENSATION REVIEWS
  // ══════════════════════════════════════════════════════════════

  async getCompensationReviews(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      reviewCycle?: string;
      employeeId?: string;
    } = {},
  ) {
    const where: any = { tenantId };
    if (params.reviewCycle) where.reviewCycle = params.reviewCycle;
    if (params.employeeId) where.employeeId = params.employeeId;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const p = prisma as any;
    const [items, total] = await Promise.all([
      p.compensationReview
        ? p.compensationReview.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      p.compensationReview
        ? p.compensationReview.count({ where })
        : Promise.resolve(0),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCompensationReviewById(tenantId: string, id: string) {
    const item = await (prisma as any).compensationReview?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Compensation review not found");
    return item;
  }

  async createCompensationReview(tenantId: string, dto: any) {
    const increasePct =
      dto.recommendedSalary && dto.currentSalary
        ? Math.round(
            ((dto.recommendedSalary - dto.currentSalary) / dto.currentSalary) *
              100 *
              100,
          ) / 100
        : null;
    return (prisma as any).compensationReview?.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        reviewCycle: dto.reviewCycle,
        currentSalary: dto.currentSalary,
        recommendedSalary: dto.recommendedSalary || null,
        increasePct,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
        reviewerId: dto.reviewerId || null,
        notes: dto.notes || null,
        status: "DRAFT",
      },
    });
  }

  async updateCompensationReview(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).compensationReview?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Compensation review not found");
    const increasePct =
      dto.recommendedSalary && dto.currentSalary
        ? Math.round(
            ((dto.recommendedSalary - dto.currentSalary) / dto.currentSalary) *
              100 *
              100,
          ) / 100
        : item.increasePct;
    return (prisma as any).compensationReview?.update({
      where: { id },
      data: {
        currentSalary: dto.currentSalary,
        recommendedSalary: dto.recommendedSalary,
        increasePct,
        effectiveDate: dto.effectiveDate
          ? new Date(dto.effectiveDate)
          : undefined,
        reviewerId: dto.reviewerId,
        notes: dto.notes,
        status: dto.status,
      },
    });
  }

  async approveCompensationReview(
    tenantId: string,
    id: string,
    userId: string,
  ) {
    const item = await (prisma as any).compensationReview?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Compensation review not found");
    if (item.status !== "DRAFT")
      throw new BadRequestException(
        "Compensation review must be in DRAFT status to approve",
      );
    return (prisma as any).compensationReview?.update({
      where: { id },
      data: { status: "APPROVED", reviewerId: userId },
    });
  }

  async deleteCompensationReview(tenantId: string, id: string) {
    const item = await (prisma as any).compensationReview?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Compensation review not found");
    await (prisma as any).compensationReview?.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // COMPENSATION BENCHMARKS
  // ══════════════════════════════════════════════════════════════

  async getCompensationBenchmarks(tenantId: string, positionTitle?: string) {
    const where: any = { tenantId };
    if (positionTitle)
      where.positionTitle = { contains: positionTitle, mode: "insensitive" };
    return (
      (prisma as any).compensationBenchmark?.findMany({
        where,
        orderBy: [{ positionTitle: "asc" }, { dataYear: "desc" }],
      }) || []
    );
  }

  async getCompensationBenchmarkById(tenantId: string, id: string) {
    const item = await (prisma as any).compensationBenchmark?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Compensation benchmark not found");
    return item;
  }

  async createCompensationBenchmark(tenantId: string, dto: any) {
    return (prisma as any).compensationBenchmark?.create({
      data: {
        tenantId,
        positionTitle: dto.positionTitle,
        marketSource: dto.marketSource,
        p10: dto.p10 || null,
        p25: dto.p25 || null,
        p50: dto.p50 || null,
        p75: dto.p75 || null,
        p90: dto.p90 || null,
        currency: dto.currency || "USD",
        geographicArea: dto.geographicArea || null,
        dataYear: dto.dataYear,
      },
    });
  }

  async updateCompensationBenchmark(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).compensationBenchmark?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Compensation benchmark not found");
    return (prisma as any).compensationBenchmark?.update({
      where: { id },
      data: {
        positionTitle: dto.positionTitle,
        marketSource: dto.marketSource,
        p10: dto.p10,
        p25: dto.p25,
        p50: dto.p50,
        p75: dto.p75,
        p90: dto.p90,
        currency: dto.currency,
        geographicArea: dto.geographicArea,
        dataYear: dto.dataYear,
      },
    });
  }

  async deleteCompensationBenchmark(tenantId: string, id: string) {
    const item = await (prisma as any).compensationBenchmark?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Compensation benchmark not found");
    await (prisma as any).compensationBenchmark?.delete({ where: { id } });
    return { success: true };
  }

  async getBenchmarkComparison(tenantId: string, employeeId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    const salary = await prisma.salaryStructure.findFirst({
      where: { tenantId, employeeId },
    });
    const currentSalary = Number(salary?.baseSalary || 0);
    const title =
      (employee as any).designation || (employee as any).jobTitle || "";
    if (!title)
      return {
        employeeId,
        message: "No position title assigned to employee",
        currentSalary,
      };

    const benchmarks = (prisma as any).compensationBenchmark
      ? await (prisma as any).compensationBenchmark.findMany({
          where: {
            tenantId,
            positionTitle: { contains: title, mode: "insensitive" },
          },
          orderBy: { dataYear: "desc" },
          take: 1,
        })
      : [];

    if (benchmarks.length === 0)
      return {
        employeeId,
        message: "No benchmarks found for this position",
        currentSalary,
      };

    const b = benchmarks[0];
    const p50 = Number(b.p50 || 0);
    const p75 = Number(b.p75 || 0);
    const compaRatio = p50 > 0 ? Math.round((currentSalary / p50) * 100) : null;
    const rangePenetration =
      p75 - Number(b.p25 || 0) > 0
        ? Math.round(
            ((currentSalary - Number(b.p25 || 0)) /
              (p75 - Number(b.p25 || 0))) *
              100,
          )
        : null;

    return {
      employeeId,
      positionTitle: title,
      currentSalary,
      benchmark: b,
      compaRatio,
      rangePenetration,
      recommendation:
        compaRatio !== null
          ? compaRatio < 80
            ? "Below market — consider adjustment"
            : compaRatio > 120
              ? "Above market range"
              : "Within competitive range"
          : "Insufficient data",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // TOTAL REWARDS STATEMENTS
  // ══════════════════════════════════════════════════════════════

  async generateTotalRewardsStatement(tenantId: string, employeeId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    const p = prisma as any;
    const salary = await prisma.salaryStructure.findFirst({
      where: { tenantId, employeeId },
    });
    const baseSalary = Number(salary?.baseSalary || 0);
    const bonusPayouts = p.bonusPayout
      ? await p.bonusPayout.findMany({
          where: { tenantId, employeeId, isPaid: true },
        })
      : [];
    const bonusTotal = bonusPayouts.reduce(
      (s: number, p: any) => s + Number(p.amount || 0),
      0,
    );
    const equityGrants = p.equityGrant
      ? await p.equityGrant.findMany({
          where: {
            tenantId,
            employeeId,
            status: { in: ["GRANTED", "VESTED"] },
          },
        })
      : [];
    const equityTotal = equityGrants.reduce(
      (s: number, g: any) =>
        s + Number(g.totalShares || 0) * Number(g.sharePrice || 0),
      0,
    );
    const enrollmentBenefits = await prisma.employeeBenefit.findMany({
      where: { tenantId, employeeId, status: "ACTIVE" },
      include: { scheme: true },
    });
    const benefitsTotal = enrollmentBenefits.reduce(
      (s: number, e: any) => s + Number(e.scheme?.employerCostShare || 0),
      0,
    );
    const totalCompensation =
      baseSalary + bonusTotal + benefitsTotal + equityTotal;
    const breakdown = {
      baseSalary,
      bonusTotal,
      benefitsTotal,
      equityTotal,
      totalCompensation,
    };

    return p.totalRewardsStatement
      ? p.totalRewardsStatement.create({
          data: {
            tenantId,
            employeeId,
            statementDate: new Date(),
            baseSalary,
            bonusTotal,
            benefitsTotal,
            equityTotal,
            totalCompensation,
            breakdown,
            isGenerated: true,
          },
        })
      : { success: true, employeeId, totalCompensation, breakdown };
  }

  async getTotalRewardsStatements(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return (
      (prisma as any).totalRewardsStatement?.findMany({
        where,
        orderBy: { statementDate: "desc" },
      }) || []
    );
  }

  async getTotalRewardsStatementById(tenantId: string, id: string) {
    const item = await (prisma as any).totalRewardsStatement?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Total rewards statement not found");
    return item;
  }

  async regenerateRewardsStatement(tenantId: string, id: string) {
    const item = await (prisma as any).totalRewardsStatement?.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Total rewards statement not found");
    const newStatement = await this.generateTotalRewardsStatement(
      tenantId,
      item.employeeId,
    );
    if ((prisma as any).totalRewardsStatement) {
      await (prisma as any).totalRewardsStatement.delete({ where: { id } });
    }
    return newStatement;
  }

  // ══════════════════════════════════════════════════════════════
  // ANALYTICS
  // ══════════════════════════════════════════════════════════════

  async getCompensationAnalytics(tenantId: string) {
    const p = prisma as any;
    const [
      totalBonusPlans,
      activeBonusPlans,
      bonusPayouts,
      equityGrants,
      eligibilityRules,
      flexibleCredits,
      reviews,
      benchmarks,
    ] = await Promise.all([
      p.bonusPlan
        ? p.bonusPlan.count({ where: { tenantId } })
        : Promise.resolve(0),
      p.bonusPlan
        ? p.bonusPlan.count({ where: { tenantId, isActive: true } })
        : Promise.resolve(0),
      p.bonusPayout
        ? p.bonusPayout.findMany({ where: { tenantId, isPaid: true } })
        : Promise.resolve([]),
      p.equityGrant
        ? p.equityGrant.findMany({ where: { tenantId } })
        : Promise.resolve([]),
      p.benefitsEligibilityRule
        ? p.benefitsEligibilityRule.count({
            where: { tenantId, isActive: true },
          })
        : Promise.resolve(0),
      p.flexibleBenefitCredit
        ? p.flexibleBenefitCredit.findMany({ where: { tenantId } })
        : Promise.resolve([]),
      p.compensationReview
        ? p.compensationReview.findMany({ where: { tenantId } })
        : Promise.resolve([]),
      p.compensationBenchmark
        ? p.compensationBenchmark.count({ where: { tenantId } })
        : Promise.resolve(0),
    ]);

    const totalBonusSpend = bonusPayouts.reduce(
      (s: number, p: any) => s + Number(p.amount || 0),
      0,
    );
    const avgEquityValue =
      equityGrants.length > 0
        ? equityGrants.reduce(
            (s: number, g: any) =>
              s + Number(g.totalShares || 0) * Number(g.sharePrice || 0),
            0,
          ) / equityGrants.length
        : 0;
    const totalFlexibleCredits = flexibleCredits.reduce(
      (s: number, f: any) => s + Number(f.totalCredit || 0),
      0,
    );
    const totalUsedCredits = flexibleCredits.reduce(
      (s: number, f: any) => s + Number(f.usedCredit || 0),
      0,
    );
    const benefitsUtilization =
      totalFlexibleCredits > 0
        ? Math.round((totalUsedCredits / totalFlexibleCredits) * 100)
        : 0;

    const reviewStatusSummary = {
      total: reviews.length,
      draft: reviews.filter((r: any) => r.status === "DRAFT").length,
      approved: reviews.filter((r: any) => r.status === "APPROVED").length,
      completed: reviews.filter((r: any) => r.status === "COMPLETED").length,
    };

    return {
      totalBonusPlans,
      activeBonusPlans,
      totalBonusSpend,
      totalBonusPayouts: bonusPayouts.length,
      avgBonusPayout:
        bonusPayouts.length > 0
          ? Math.round((totalBonusSpend / bonusPayouts.length) * 100) / 100
          : 0,
      totalEquityGrants: equityGrants.length,
      avgEquityValue: Math.round(avgEquityValue * 100) / 100,
      activeEligibilityRules: eligibilityRules,
      totalFlexibleCredits,
      totalUsedCredits,
      benefitsUtilization,
      reviewStatusSummary,
      totalBenchmarks: benchmarks,
    };
  }
}

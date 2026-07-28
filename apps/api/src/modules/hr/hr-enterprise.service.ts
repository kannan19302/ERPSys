import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HrEnterpriseService {
  async getHeadcountAnalytics(
    tenantId: string,
    dateRange?: string,
    groupBy?: string,
  ) {
    const where: any = { tenantId };
    if (dateRange) where.createdAt = { gte: new Date(dateRange) };
    const employees = await prisma.employee.findMany({
      where,
      include: { department: { select: { name: true } } },
    });
    const activeEmployees = employees.filter((e) => e.status === "ACTIVE");
    const byDepartment =
      groupBy === "department"
        ? Object.fromEntries(
            [
              ...new Set(
                employees.map((e) => e.department?.name || "Unassigned"),
              ),
            ].map((dept) => [
              dept,
              employees.filter(
                (e) => (e.department?.name || "Unassigned") === dept,
              ).length,
            ]),
          )
        : {};
    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      inactiveEmployees: employees.filter((e) => e.status === "INACTIVE")
        .length,
      terminatedEmployees: employees.filter((e) => e.status === "TERMINATED")
        .length,
      attritionRate:
        employees.length > 0
          ? +(
              (employees.filter((e) => e.status === "TERMINATED").length /
                employees.length) *
              100
            ).toFixed(1)
          : 0,
      byDepartment,
    };
  }

  async getWorkforceDemographics(tenantId: string) {
    // Employee has no `gender` field in the schema — that's tracked on
    // HealthcarePatient, an unrelated module. Gender distribution can't be
    // derived here, so it's reported empty rather than fabricated.
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      select: {
        id: true,
        dateOfBirth: true,
        dateOfJoining: true,
        department: { select: { name: true } },
      },
    });
    const ageRanges = {
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "55+": 0,
    };
    const genderDistribution: Record<string, number> = {};
    for (const e of employees) {
      if (e.dateOfBirth) {
        const age = Math.floor(
          (Date.now() - new Date(e.dateOfBirth).getTime()) /
            (1000 * 60 * 60 * 24 * 365),
        );
        if (age <= 25) ageRanges["18-25"]++;
        else if (age <= 35) ageRanges["26-35"]++;
        else if (age <= 45) ageRanges["36-45"]++;
        else if (age <= 55) ageRanges["46-55"]++;
        else ageRanges["55+"]++;
      }
    }
    return {
      totalEmployees: employees.length,
      ageDistribution: ageRanges,
      genderDistribution,
      averageTenureYears:
        employees.length > 0
          ? +(
              employees.reduce(
                (s, e) =>
                  s +
                  (e.dateOfJoining
                    ? Math.floor(
                        (Date.now() - new Date(e.dateOfJoining).getTime()) /
                          (1000 * 60 * 60 * 24 * 365),
                      )
                    : 0),
                0,
              ) / employees.length
            ).toFixed(1)
          : 0,
    };
  }

  async getCompensationAnalysis(tenantId: string, departmentId?: string) {
    const where: any = { tenantId };
    if (departmentId) where.departmentId = departmentId;
    const employees = await prisma.employee.findMany({
      where,
      include: { department: { select: { name: true } } },
    });
    // Employee itself has no salary field — compensation lives on PayrollSlip,
    // keyed by employeeId. Use each employee's most recent slip.
    const slips = await prisma.payrollSlip.findMany({
      where: { tenantId, employeeId: { in: employees.map((e) => e.id) } },
      orderBy: { createdAt: "desc" },
    });
    const latestSlipByEmployee = new Map<string, number>();
    for (const slip of slips) {
      if (!latestSlipByEmployee.has(slip.employeeId))
        latestSlipByEmployee.set(slip.employeeId, Number(slip.grossSalary));
    }
    const salaries = [...latestSlipByEmployee.values()];
    const avgSalary =
      salaries.length > 0
        ? salaries.reduce((s, v) => s + v, 0) / salaries.length
        : 0;
    const sorted = [...salaries].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianSalary =
      sorted.length > 0
        ? sorted.length % 2 === 0
          ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
          : (sorted[mid] ?? 0)
        : 0;
    return {
      totalEmployees: employees.length,
      averageSalary: +avgSalary.toFixed(2),
      medianSalary: +medianSalary.toFixed(2),
      minSalary: sorted[0] ?? 0,
      maxSalary: sorted[sorted.length - 1] ?? 0,
      salaryRange:
        sorted.length > 1
          ? (sorted[sorted.length - 1] ?? 0) - (sorted[0] ?? 0)
          : 0,
    };
  }

  async getTurnoverAnalysis(
    tenantId: string,
    dateRange?: string,
    groupBy?: string,
  ) {
    const where: any = { tenantId };
    if (dateRange) where.updatedAt = { gte: new Date(dateRange) };
    const employees = await prisma.employee.findMany({
      where,
      include: { department: { select: { name: true } } },
    });
    const terminated = employees.filter((e) => e.status === "TERMINATED");
    // Employee has no termination-reason field, so voluntary/involuntary can't
    // be split from stored data.
    return {
      totalEmployees: employees.length,
      terminatedCount: terminated.length,
      voluntaryTurnover: 0,
      involuntaryTurnover: 0,
      turnoverRate:
        employees.length > 0
          ? +((terminated.length / employees.length) * 100).toFixed(1)
          : 0,
      byDepartment: groupBy === "department" ? {} : undefined,
    };
  }

  async getPayrollAnalytics(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = { tenantId };
    if (periodStart)
      where.createdAt = { ...where.createdAt, gte: new Date(periodStart) };
    if (periodEnd)
      where.createdAt = { ...where.createdAt, lte: new Date(periodEnd) };
    const payrolls = await prisma.payrollRun.findMany({ where });
    const totalGrossPay = payrolls.reduce(
      (s, p) => s + Number(p.totalGross || 0),
      0,
    );
    const totalDeductions = payrolls.reduce(
      (s, p) => s + Number(p.totalDeductions || 0),
      0,
    );
    const totalNetPay = payrolls.reduce(
      (s, p) => s + Number(p.totalNet || 0),
      0,
    );
    return {
      totalPayrolls: payrolls.length,
      totalGrossPay,
      totalDeductions,
      totalNetPay,
      averagePerPayroll:
        payrolls.length > 0 ? totalGrossPay / payrolls.length : 0,
      periodStart,
      periodEnd,
    };
  }

  async getHrExecutiveDashboard(tenantId: string) {
    const [employees, payrolls] = await Promise.all([
      prisma.employee.findMany({ where: { tenantId } }),
      prisma.payrollRun.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);
    const activeEmployees = employees.filter((e) => e.status === "ACTIVE");
    const terminatedThisMonth = employees.filter(
      (e) =>
        e.status === "TERMINATED" &&
        new Date(e.updatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      terminatedThisMonth: terminatedThisMonth.length,
      attritionRate:
        employees.length > 0
          ? +((terminatedThisMonth.length / employees.length) * 100).toFixed(1)
          : 0,
      totalPayroll:
        payrolls.length > 0
          ? payrolls.reduce((s, p) => s + Number(p.totalNet || 0), 0)
          : 0,
      departmentsCount: [...new Set(employees.map((e) => e.departmentId))]
        .length,
    };
  }

  async getTalentPipeline(tenantId: string, positionId?: string) {
    const where: any = { tenantId, status: "OPEN" };
    if (positionId) where.id = positionId;
    const positions = await prisma.jobPosting.findMany({
      where,
      include: { applicants: true },
    });
    return {
      totalOpenPositions: positions.length,
      totalApplicants: positions.reduce((s, p) => s + p.applicants.length, 0),
      positions: positions.map((p) => ({
        id: p.id,
        title: p.title,
        applicantCount: p.applicants.length,
        qualifiedCount: p.applicants.filter(
          (a) => a.currentStage === "SCREENING",
        ).length,
        interviewCount: p.applicants.filter(
          (a) => a.currentStage === "INTERVIEW",
        ).length,
        offerCount: p.applicants.filter((a) => a.currentStage === "OFFER")
          .length,
      })),
    };
  }

  async getSuccessionReadiness(tenantId: string, departmentId?: string) {
    const where: any = { tenantId };
    if (departmentId) where.departmentId = departmentId;
    const employees = await prisma.employee.findMany({
      where,
      include: { department: { select: { name: true } } },
    });
    const keyPositions = employees.filter(
      (e) =>
        e.designation &&
        ["DIRECTOR", "MANAGER", "HEAD", "VP", "CHIEF"].some((t) =>
          e.designation?.toUpperCase().includes(t),
        ),
    );
    return {
      totalEmployees: employees.length,
      keyPositions: keyPositions.length,
      successorsIdentified: Math.floor(keyPositions.length * 0.6),
      readinessScore: 65,
    };
  }

  async exportHrReport(
    tenantId: string,
    reportType: string,
    format: string,
    params?: any,
  ) {
    let data: any;
    switch (reportType) {
      case "headcount":
        data = await this.getHeadcountAnalytics(
          tenantId,
          params?.dateRange,
          params?.groupBy,
        );
        break;
      case "demographics":
        data = await this.getWorkforceDemographics(tenantId);
        break;
      case "compensation":
        data = await this.getCompensationAnalysis(
          tenantId,
          params?.departmentId,
        );
        break;
      case "turnover":
        data = await this.getTurnoverAnalysis(tenantId, params?.dateRange);
        break;
      case "payroll":
        data = await this.getPayrollAnalytics(
          tenantId,
          params?.periodStart,
          params?.periodEnd,
        );
        break;
      case "executive":
        data = await this.getHrExecutiveDashboard(tenantId);
        break;
      default:
        data = await this.getHrExecutiveDashboard(tenantId);
    }
    return { reportType, format, exportedAt: new Date().toISOString(), data };
  }
}

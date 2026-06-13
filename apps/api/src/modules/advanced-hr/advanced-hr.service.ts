import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdvancedHrService {
  // ── TIER 1: Salary Components ──
  async getSalaryComponents(tenantId: string) { return prisma.salaryComponent.findMany({ where: { tenantId } }); }

  async createSalaryComponent(tenantId: string, dto: { name: string; type: string; isPercent: boolean; value: number }) {
    return prisma.salaryComponent.create({ data: { tenantId, name: dto.name, type: dto.type, isPercent: dto.isPercent || false, value: new Prisma.Decimal(dto.value) } });
  }

  // ── TIER 1: Salary Structures ──
  async getSalaryStructures(tenantId: string) { return prisma.salaryStructure.findMany({ where: { tenantId }, orderBy: { employeeId: 'asc' } }); }

  async createSalaryStructure(tenantId: string, dto: { employeeId: string; baseSalary: number; allowances?: unknown; deductions?: unknown }) {
    const existing = await prisma.salaryStructure.findFirst({ where: { tenantId, employeeId: dto.employeeId } });
    if (existing) return prisma.salaryStructure.update({ where: { id: existing.id }, data: { baseSalary: new Prisma.Decimal(dto.baseSalary), allowances: dto.allowances || {}, deductions: dto.deductions || {} } });
    return prisma.salaryStructure.create({ data: { tenantId, employeeId: dto.employeeId, baseSalary: new Prisma.Decimal(dto.baseSalary), allowances: dto.allowances || {}, deductions: dto.deductions || {} } });
  }

  // ── TIER 1: Payroll ──
  async getPayrollRuns(tenantId: string) { return prisma.payrollRun.findMany({ where: { tenantId }, include: { slips: true }, orderBy: { periodStart: 'desc' } }); }

  async runPayroll(tenantId: string, dto: { periodStart: string; periodEnd: string }) {
    const start = new Date(dto.periodStart); const end = new Date(dto.periodEnd);
    const structures = await prisma.salaryStructure.findMany({ where: { tenantId } });
    if (structures.length === 0) throw new BadRequestException('No salary structures configured.');
    return prisma.$transaction(async (tx) => {
      let totalGross = 0, totalDeductions = 0, totalNet = 0;
      const run = await tx.payrollRun.create({ data: { tenantId, periodStart: start, periodEnd: end, status: 'DRAFT', totalGross: 0, totalDeductions: 0, totalNet: 0 } });
      for (const struct of structures) {
        const gross = Number(struct.baseSalary);
        const deductionSum = gross * 0.1;
        const net = gross - deductionSum;
        totalGross += gross; totalDeductions += deductionSum; totalNet += net;
        await tx.payrollSlip.create({ data: { tenantId, payrollRunId: run.id, employeeId: struct.employeeId, grossSalary: new Prisma.Decimal(gross), deductions: new Prisma.Decimal(deductionSum), netSalary: new Prisma.Decimal(net) } });
      }
      return tx.payrollRun.update({ where: { id: run.id }, data: { totalGross: new Prisma.Decimal(totalGross), totalDeductions: new Prisma.Decimal(totalDeductions), totalNet: new Prisma.Decimal(totalNet), status: 'PAID' }, include: { slips: true } });
    });
  }

  // ── TIER 1: Attendance ──
  async getAttendanceRecords(tenantId: string, employeeId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.attendanceRecord.findMany({ where: where as never, orderBy: { date: 'desc' }, take: 90 });
  }

  async checkIn(tenantId: string, employeeId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendanceRecord.findFirst({ where: { tenantId, employeeId, date: today } });
    if (existing) throw new BadRequestException('Already checked in today');
    return prisma.attendanceRecord.create({ data: { tenantId, employeeId, date: today, checkIn: new Date(), status: 'PRESENT' } });
  }

  async checkOut(tenantId: string, employeeId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const record = await prisma.attendanceRecord.findFirst({ where: { tenantId, employeeId, date: today } });
    if (!record) throw new NotFoundException('No check-in record for today');
    return prisma.attendanceRecord.update({ where: { id: record.id }, data: { checkOut: new Date() } });
  }

  // ── TIER 1: Employee Documents ──
  async getEmployeeDocuments(tenantId: string, employeeId: string) { return prisma.employeeDocument.findMany({ where: { tenantId, employeeId } }); }

  async createEmployeeDocument(tenantId: string, employeeId: string, dto: { name: string; docType: string; fileUrl?: string; expiryDate?: string }) {
    return prisma.employeeDocument.create({ data: { tenantId, employeeId, name: dto.name, docType: dto.docType, fileUrl: dto.fileUrl || null, expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null } });
  }

  // ── TIER 1: Asset Assignments ──
  async getAssets(tenantId: string) { return prisma.assetAssignment.findMany({ where: { tenantId }, orderBy: { assignedDate: 'desc' } }); }

  async assignAsset(tenantId: string, dto: { employeeId: string; assetType: string; assetName: string; serialNumber?: string }) {
    return prisma.assetAssignment.create({ data: { tenantId, employeeId: dto.employeeId, assetType: dto.assetType, assetName: dto.assetName, serialNumber: dto.serialNumber || null, status: 'ASSIGNED' } });
  }

  async returnAsset(tenantId: string, id: string) {
    return prisma.assetAssignment.update({ where: { id }, data: { status: 'RETURNED', returnedDate: new Date() } });
  }

  // ── TIER 2: Org Chart (computed from departments & employees) ──
  async getOrgChart(tenantId: string, orgId: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const departments = await prisma.department.findMany({ where: { tenantId, orgId: resolvedOrgId }, include: { employees: { select: { id: true, firstName: true, lastName: true, designation: true, email: true } } } });
    return departments.map(dept => ({ id: dept.id, name: dept.name, code: dept.code, managerId: dept.managerId, parentId: dept.parentId, employees: dept.employees }));
  }

  // ── TIER 2: Leave Balances ──
  async getLeaveBalances(tenantId: string) {
    const policies = await prisma.leavePolicy.findMany({ where: { tenantId } });
    const requests = await prisma.leaveRequest.findMany({ where: { tenantId, status: 'APPROVED' } });
    const balances: Array<{ policyId: string; policyName: string; leaveType: string; allocated: number; used: number; remaining: number }> = [];
    for (const policy of policies) {
      const used = requests.filter(r => r.policyId === policy.id).reduce((s, r) => {
        const days = Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86400000) + 1;
        return s + days;
      }, 0);
      balances.push({ policyId: policy.id, policyName: policy.name, leaveType: policy.leaveType, allocated: policy.annualAllocation, used, remaining: policy.annualAllocation - used });
    }
    return balances;
  }

  // ── TIER 2: Leave Policies & Requests ──
  async getLeavePolicies(tenantId: string) { return prisma.leavePolicy.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }); }

  async createLeavePolicy(tenantId: string, dto: { name: string; leaveType: string; annualAllocation: number }) {
    return prisma.leavePolicy.create({ data: { tenantId, name: dto.name, leaveType: dto.leaveType, annualAllocation: dto.annualAllocation } });
  }

  async getLeaveRequests(tenantId: string) { return prisma.leaveRequest.findMany({ where: { tenantId }, include: { policy: true }, orderBy: { createdAt: 'desc' } }); }

  async createLeaveRequest(tenantId: string, dto: { employeeId: string; policyId: string; startDate: string; endDate: string; reason?: string }) {
    return prisma.leaveRequest.create({ data: { tenantId, employeeId: dto.employeeId, policyId: dto.policyId, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), reason: dto.reason || null, status: 'PENDING' } });
  }

  async approveLeaveRequest(tenantId: string, id: string, status: 'APPROVED' | 'REJECTED', approverId: string) {
    return prisma.leaveRequest.update({ where: { id }, data: { status, approvedBy: approverId, approvedAt: new Date() } });
  }

  // ── TIER 2: Onboarding ──
  async getOnboardingChecklists(tenantId: string) { return prisma.onboardingChecklist.findMany({ where: { tenantId }, include: { items: { orderBy: { sortOrder: 'asc' } } } }); }

  async createOnboardingChecklist(tenantId: string, dto: { employeeId: string; templateName: string; items: Array<{ task: string; category: string; sortOrder: number }> }) {
    return prisma.onboardingChecklist.create({ data: { tenantId, employeeId: dto.employeeId, templateName: dto.templateName, items: { create: dto.items.map(i => ({ tenantId, task: i.task, category: i.category, sortOrder: i.sortOrder })) } }, include: { items: true } });
  }

  async completeOnboardingItem(tenantId: string, itemId: string) {
    return prisma.onboardingItem.update({ where: { id: itemId }, data: { isCompleted: true, completedAt: new Date() } });
  }

  // ── TIER 2: Offboarding ──
  async getOffboardingChecklists(tenantId: string) { return prisma.offboardingChecklist.findMany({ where: { tenantId }, include: { items: { orderBy: { sortOrder: 'asc' } } } }); }

  async createOffboardingChecklist(tenantId: string, dto: { employeeId: string; exitDate: string; exitReason?: string; items: Array<{ task: string; sortOrder: number }> }) {
    return prisma.offboardingChecklist.create({ data: { tenantId, employeeId: dto.employeeId, exitDate: new Date(dto.exitDate), exitReason: dto.exitReason || null, items: { create: dto.items.map(i => ({ tenantId, task: i.task, sortOrder: i.sortOrder })) } }, include: { items: true } });
  }

  // ── TIER 3: Recruitment ──
  async getJobPostings(tenantId: string) { return prisma.jobPosting.findMany({ where: { tenantId }, orderBy: { postedAt: 'desc' } }); }

  async createJobPosting(tenantId: string, orgId: string, dto: { title: string; departmentId?: string; description: string; requirements?: string; location?: string; employmentType?: string }) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.jobPosting.create({ data: { tenantId, orgId: resolvedOrgId, title: dto.title, departmentId: dto.departmentId || null, description: dto.description, requirements: dto.requirements || null, location: dto.location || null, employmentType: dto.employmentType || 'FULL_TIME', status: 'OPEN' } });
  }

  async getApplicants(tenantId: string, jobPostingId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (jobPostingId) where.jobPostingId = jobPostingId;
    return prisma.applicant.findMany({ where: where as never, include: { jobPosting: true }, orderBy: { appliedAt: 'desc' } });
  }

  async createApplicant(tenantId: string, dto: { jobPostingId: string; firstName: string; lastName: string; email: string; phone?: string; resumeUrl?: string; coverLetter?: string }) {
    return prisma.applicant.create({ data: { tenantId, jobPostingId: dto.jobPostingId, firstName: dto.firstName, lastName: dto.lastName, email: dto.email, phone: dto.phone || null, resumeUrl: dto.resumeUrl || null, coverLetter: dto.coverLetter || null, status: 'ACTIVE', currentStage: 'APPLIED' } });
  }

  async advanceApplicant(tenantId: string, id: string, stage: string) {
    return prisma.applicant.update({ where: { id }, data: { currentStage: stage, status: stage === 'HIRED' ? 'HIRED' : stage === 'REJECTED' ? 'REJECTED' : 'ACTIVE' } });
  }

  async getInterviews(tenantId: string) { return prisma.interview.findMany({ where: { tenantId }, include: { applicant: true, jobPosting: true }, orderBy: { scheduledAt: 'asc' } }); }

  async createInterview(tenantId: string, dto: { applicantId: string; jobPostingId: string; interviewerId: string; scheduledAt: string; round?: string }) {
    return prisma.interview.create({ data: { tenantId, applicantId: dto.applicantId, jobPostingId: dto.jobPostingId, interviewerId: dto.interviewerId, scheduledAt: new Date(dto.scheduledAt), round: dto.round || 'TECHNICAL', status: 'SCHEDULED' } });
  }

  // ── TIER 3: Goals & OKRs ──
  async getGoals(tenantId: string, employeeId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.goal.findMany({ where: where as never, include: { keyResults: true }, orderBy: { createdAt: 'desc' } });
  }

  async createGoal(tenantId: string, dto: { employeeId: string; title: string; description?: string; category?: string; type?: string; startDate: string; endDate: string; weight?: number; keyResults?: Array<{ title: string; target: number; unit?: string }> }) {
    return prisma.goal.create({ data: { tenantId, employeeId: dto.employeeId, title: dto.title, description: dto.description || null, category: dto.category || 'INDIVIDUAL', type: dto.type || 'QUARTERLY', startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), weight: dto.weight || 100, keyResults: dto.keyResults ? { create: dto.keyResults.map(kr => ({ tenantId, title: kr.title, target: kr.target, unit: kr.unit || 'percentage' })) } : undefined }, include: { keyResults: true } });
  }

  async updateKeyResultProgress(tenantId: string, krId: string, current: number) {
    return prisma.keyResult.update({ where: { id: krId }, data: { current } });
  }

  // ── TIER 3: 360° Feedback ──
  async getFeedback360(tenantId: string, employeeId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.feedback360.findMany({ where: where as never, include: { responses: true }, orderBy: { createdAt: 'desc' } });
  }

  async createFeedback360(tenantId: string, dto: { employeeId: string; reviewerId: string; relationship?: string; period?: string; responses: Array<{ question: string; rating: number; comment?: string; category?: string }> }) {
    return prisma.feedback360.create({ data: { tenantId, employeeId: dto.employeeId, reviewerId: dto.reviewerId, relationship: dto.relationship || 'PEER', period: dto.period || '2026', responses: { create: dto.responses.map(r => ({ tenantId, question: r.question, rating: r.rating, comment: r.comment || null, category: r.category || 'COMMUNICATION' })) } }, include: { responses: true } });
  }

  // ── TIER 3: Succession Planning ──
  async getSuccessionPlans(tenantId: string) { return prisma.successionPlan.findMany({ where: { tenantId } }); }

  async createSuccessionPlan(tenantId: string, dto: { position: string; currentHolderId?: string; riskLevel?: string; readinessLevel?: string; successorId?: string; developmentPlan?: string }) {
    return prisma.successionPlan.create({ data: { tenantId, position: dto.position, currentHolderId: dto.currentHolderId || null, riskLevel: dto.riskLevel || 'LOW', readinessLevel: dto.readinessLevel || 'NOT_READY', successorId: dto.successorId || null, developmentPlan: dto.developmentPlan || null } });
  }

  // ── TIER 3: Skills Matrix ──
  async getEmployeeSkills(tenantId: string, employeeId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeeSkill.findMany({ where: where as never });
  }

  async createEmployeeSkill(tenantId: string, dto: { employeeId: string; skillName: string; proficiency?: number; category?: string; certified?: boolean; certificationUrl?: string }) {
    return prisma.employeeSkill.create({ data: { tenantId, employeeId: dto.employeeId, skillName: dto.skillName, proficiency: dto.proficiency || 1, category: dto.category || 'TECHNICAL', certified: dto.certified || false, certificationUrl: dto.certificationUrl || null } });
  }

  // ── TIER 3: Appraisals ──
  async getAppraisals(tenantId: string) {
    const appraisals = await prisma.appraisal.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    const employeeIds = appraisals.map(a => a.employeeId); const reviewerIds = appraisals.map(a => a.reviewerId);
    const [employees, reviewers] = await Promise.all([
      prisma.employee.findMany({ where: { tenantId, id: { in: employeeIds } }, select: { id: true, firstName: true, lastName: true } }),
      prisma.user.findMany({ where: { tenantId, id: { in: reviewerIds } }, select: { id: true, firstName: true, lastName: true } }),
    ]);
    const employeeMap = new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
    const reviewerMap = new Map(reviewers.map(r => [r.id, `${r.firstName} ${r.lastName}`]));
    return appraisals.map(app => ({ id: app.id, employeeId: app.employeeId, reviewerId: app.reviewerId, appraisalPeriod: app.appraisalPeriod, score: Number(app.score), feedback: app.feedback, status: app.status, employeeName: employeeMap.get(app.employeeId) || 'Unknown', reviewerName: reviewerMap.get(app.reviewerId) || 'System' }));
  }

  async createAppraisal(tenantId: string, dto: { employeeId: string; reviewerId: string; appraisalPeriod: string; score: number; feedback?: string }) {
    return prisma.appraisal.create({ data: { tenantId, employeeId: dto.employeeId, reviewerId: dto.reviewerId, appraisalPeriod: dto.appraisalPeriod, score: new Prisma.Decimal(dto.score), feedback: dto.feedback || null, status: 'COMPLETED' } });
  }

  // ── TIER 3: Trainings ──
  async getTrainings(tenantId: string) { return prisma.training.findMany({ where: { tenantId }, orderBy: { startDate: 'asc' } }); }

  async createTraining(tenantId: string, dto: { name: string; description?: string; instructor?: string; startDate: string; endDate: string }) {
    return prisma.training.create({ data: { tenantId, name: dto.name, description: dto.description || null, instructor: dto.instructor || null, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) } });
  }

  // ── TIER 4: Employee Dashboard (self-service) ──
  async getEmployeeDashboard(tenantId: string, employeeId: string) {
    const [employee, payslips, leaves, goals, skills, assets, documents] = await Promise.all([
      prisma.employee.findFirst({ where: { id: employeeId, tenantId }, include: { department: true } }),
      prisma.payrollSlip.findMany({ where: { tenantId, employeeId }, orderBy: { createdAt: 'desc' }, take: 6 }),
      prisma.leaveRequest.findMany({ where: { tenantId, employeeId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.goal.findMany({ where: { tenantId, employeeId, status: 'ACTIVE' }, include: { keyResults: true } }),
      prisma.employeeSkill.findMany({ where: { tenantId, employeeId } }),
      prisma.assetAssignment.findMany({ where: { tenantId, employeeId, status: 'ASSIGNED' } }),
      prisma.employeeDocument.findMany({ where: { tenantId, employeeId } }),
    ]);
    if (!employee) throw new NotFoundException('Employee not found');
    return { employee: { name: `${employee.firstName} ${employee.lastName}`, code: employee.employeeCode, designation: employee.designation, department: employee.department?.name || 'N/A', dateOfJoining: employee.dateOfJoining }, recentPayslips: payslips, pendingLeaves: leaves.filter(l => l.status === 'PENDING'), activeGoals: goals, skills, assignedAssets: assets, documents };
  }

  // ── TIER 4: HR Analytics ──
  async getHeadcountAnalytics(tenantId: string) {
    const [total, byDept, byType, byStatus, tenureBuckets] = await Promise.all([
      prisma.employee.count({ where: { tenantId } }),
      prisma.department.findMany({ where: { tenantId }, include: { _count: { select: { employees: true } } } }),
      prisma.employee.groupBy({ where: { tenantId }, by: ['employmentType'], _count: true }),
      prisma.employee.groupBy({ where: { tenantId }, by: ['status'], _count: true }),
      prisma.employee.findMany({ where: { tenantId, status: 'ACTIVE' }, select: { dateOfJoining: true } }),
    ]);
    const now = new Date();
    const tenure = { '<1 Year': 0, '1-3 Years': 0, '3-5 Years': 0, '5+ Years': 0 };
    for (const e of tenureBuckets) {
      const years = (now.getTime() - new Date(e.dateOfJoining).getTime()) / (365.25 * 86400000);
      if (years < 1) tenure['<1 Year']++; else if (years < 3) tenure['1-3 Years']++; else if (years < 5) tenure['3-5 Years']++; else tenure['5+ Years']++;
    }
    return { total, byDepartment: byDept.map(d => ({ name: d.name, count: d._count.employees })), byEmploymentType: byType, byStatus: byStatus, tenure };
  }

  async getCompensationAnalytics(tenantId: string) {
    const structures = await prisma.salaryStructure.findMany({ where: { tenantId } });
    const salaries = structures.map(s => Number(s.baseSalary));
    if (salaries.length === 0) return { average: 0, median: 0, min: 0, max: 0, count: 0 };
    salaries.sort((a, b) => a - b);
    return { average: salaries.reduce((s, v) => s + v, 0) / salaries.length, median: salaries[Math.floor(salaries.length / 2)], min: salaries[0], max: salaries[salaries.length - 1], count: salaries.length };
  }

  // ── TIER 4: HR Cost Analysis ──
  async getHRCostAnalysis(tenantId: string) {
    const payrollRuns = await prisma.payrollRun.findMany({ where: { tenantId, status: 'PAID' }, orderBy: { periodStart: 'desc' }, take: 12 });
    const monthly = payrollRuns.map(r => ({ period: `${r.periodStart.toISOString().slice(0, 7)}`, gross: Number(r.totalGross), deductions: Number(r.totalDeductions), net: Number(r.totalNet) }));
    const totalPaid = monthly.reduce((s, m) => s + m.net, 0);
    const employeeCount = await prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } });
    return { monthlyBreakdown: monthly, totalPaidThisYear: totalPaid, costPerEmployee: employeeCount > 0 ? totalPaid / employeeCount : 0, employeeCount };
  }

  // ── TIER 5: HR Tickets ──
  async getHRTickets(tenantId: string, employeeId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.hRTicket.findMany({ where: where as never, orderBy: { createdAt: 'desc' } });
  }

  async createHRTicket(tenantId: string, dto: { employeeId: string; category: string; title: string; description?: string; priority?: string }) {
    return prisma.hRTicket.create({ data: { tenantId, employeeId: dto.employeeId, category: dto.category, title: dto.title, description: dto.description || null, priority: dto.priority || 'MEDIUM', status: 'OPEN' } });
  }

  async resolveHRTicket(tenantId: string, id: string, resolution: string) {
    return prisma.hRTicket.update({ where: { id }, data: { status: 'RESOLVED', resolution, resolvedAt: new Date() } });
  }

  // ── TIER 5: Engagement Surveys ──
  async getEngagementSurveys(tenantId: string) { return prisma.engagementSurvey.findMany({ where: { tenantId }, include: { questions: { include: { responses: true } } } }); }

  async createEngagementSurvey(tenantId: string, dto: { title: string; description?: string; startDate: string; endDate: string; questions: Array<{ question: string; category?: string; sortOrder: number }> }) {
    return prisma.engagementSurvey.create({ data: { tenantId, title: dto.title, description: dto.description || null, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), status: 'ACTIVE', questions: { create: dto.questions.map(q => ({ tenantId, question: q.question, category: q.category || 'ENGAGEMENT', sortOrder: q.sortOrder })) } }, include: { questions: true } });
  }

  async submitSurveyResponse(tenantId: string, dto: { questionId: string; employeeId: string; rating: number; comment?: string }) {
    return prisma.surveyResponse.create({ data: { tenantId, questionId: dto.questionId, employeeId: dto.employeeId, rating: dto.rating, comment: dto.comment || null } });
  }

  // ── TIER 5: Shift Scheduling ──
  async getShiftSchedules(tenantId: string) { return prisma.shiftSchedule.findMany({ where: { tenantId }, orderBy: { startTime: 'asc' } }); }

  async createShiftSchedule(tenantId: string, dto: { employeeId: string; startTime: string; endTime: string; note?: string }) {
    return prisma.shiftSchedule.create({ data: { tenantId, employeeId: dto.employeeId, startTime: new Date(dto.startTime), endTime: new Date(dto.endTime), note: dto.note || null } });
  }
}
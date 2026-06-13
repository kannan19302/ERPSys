import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedHrController } from '../advanced-hr.controller';
import { AdvancedHrService } from '../advanced-hr.service';

describe('AdvancedHrController', () => {
  let controller: AdvancedHrController;
  let service: AdvancedHrService;

  beforeEach(() => {
    service = {
      getSalaryStructures: vi.fn(),
      createSalaryStructure: vi.fn(),
      getPayrollRuns: vi.fn(),
      runPayroll: vi.fn(),
      getAttendanceRecords: vi.fn(),
      checkIn: vi.fn(),
      checkOut: vi.fn(),
      getEmployeeDocuments: vi.fn(),
      createEmployeeDocument: vi.fn(),
      getAssets: vi.fn(),
      assignAsset: vi.fn(),
      returnAsset: vi.fn(),
      getOrgChart: vi.fn(),
      getLeaveBalances: vi.fn(),
      getLeavePolicies: vi.fn(),
      createLeavePolicy: vi.fn(),
      getLeaveRequests: vi.fn(),
      createLeaveRequest: vi.fn(),
      approveLeaveRequest: vi.fn(),
      getOnboardingChecklists: vi.fn(),
      createOnboardingChecklist: vi.fn(),
      completeOnboardingItem: vi.fn(),
      updateOnboardingItem: vi.fn(),
      addOnboardingItem: vi.fn(),
      deleteOnboardingItem: vi.fn(),
      getOffboardingChecklists: vi.fn(),
      createOffboardingChecklist: vi.fn(),
      updateOffboardingItem: vi.fn(),
      addOffboardingItem: vi.fn(),
      deleteOffboardingItem: vi.fn(),
      getShiftSchedules: vi.fn(),
      createShiftSchedule: vi.fn(),
      getJobPostings: vi.fn(),
      createJobPosting: vi.fn(),
      getApplicants: vi.fn(),
      createApplicant: vi.fn(),
      advanceApplicant: vi.fn(),
      getInterviews: vi.fn(),
      createInterview: vi.fn(),
      getGoals: vi.fn(),
      createGoal: vi.fn(),
      updateKeyResultProgress: vi.fn(),
      getGoalComments: vi.fn(),
      createGoalComment: vi.fn(),
      getFeedback360: vi.fn(),
      createFeedback360: vi.fn(),
      getSuccessionPlans: vi.fn(),
      createSuccessionPlan: vi.fn(),
      getEmployeeSkills: vi.fn(),
      createEmployeeSkill: vi.fn(),
      getAppraisals: vi.fn(),
      createAppraisal: vi.fn(),
      getTrainings: vi.fn(),
      createTraining: vi.fn(),
      getHeadcountAnalytics: vi.fn(),
      getCompensationAnalytics: vi.fn(),
      getHRCostAnalysis: vi.fn(),
      getHRTickets: vi.fn(),
      createHRTicket: vi.fn(),
      resolveHRTicket: vi.fn(),
      getEngagementSurveys: vi.fn(),
      createEngagementSurvey: vi.fn(),
      submitSurveyResponse: vi.fn(),
    } as unknown as AdvancedHrService;

    controller = new AdvancedHrController(service);
  });

  const req = { user: { tenantId: 'tenant-1', userId: 'user-1', orgId: 'org-1' } };

  it('should call getSalaryStructures with tenantId', async () => {
    await controller.getSalaryStructures(req as never);
    expect(service.getSalaryStructures).toHaveBeenCalledWith('tenant-1');
  });

  it('should call createSalaryStructure with tenantId and dto', async () => {
    const dto = { employeeId: 'emp-1', baseSalary: 5000 };
    await controller.createSalaryStructure(req as never, dto);
    expect(service.createSalaryStructure).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call getPayrollRuns with tenantId', async () => {
    await controller.getPayrollRuns(req as never);
    expect(service.getPayrollRuns).toHaveBeenCalledWith('tenant-1');
  });

  it('should call runPayroll with tenantId and dto', async () => {
    const dto = { periodStart: '2026-06-01', periodEnd: '2026-06-30' };
    await controller.runPayroll(req as never, dto);
    expect(service.runPayroll).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call getAttendanceRecords with tenantId and employeeId', async () => {
    await controller.getAttendanceRecords(req as never, 'emp-1');
    expect(service.getAttendanceRecords).toHaveBeenCalledWith('tenant-1', 'emp-1');
  });

  it('should call checkIn and checkOut', async () => {
    await controller.checkIn(req as never, { employeeId: 'emp-1' });
    expect(service.checkIn).toHaveBeenCalledWith('tenant-1', 'emp-1');

    await controller.checkOut(req as never, { employeeId: 'emp-1' });
    expect(service.checkOut).toHaveBeenCalledWith('tenant-1', 'emp-1');
  });

  it('should call getEmployeeDocuments and createEmployeeDocument', async () => {
    await controller.getEmployeeDocuments(req as never, 'emp-1');
    expect(service.getEmployeeDocuments).toHaveBeenCalledWith('tenant-1', 'emp-1');

    const dto = { name: 'Passport', docType: 'ID' };
    await controller.createEmployeeDocument(req as never, 'emp-1', dto);
    expect(service.createEmployeeDocument).toHaveBeenCalledWith('tenant-1', 'emp-1', dto);
  });

  it('should call getAssets, assignAsset and returnAsset', async () => {
    await controller.getAssets(req as never);
    expect(service.getAssets).toHaveBeenCalledWith('tenant-1');

    const dto = { employeeId: 'emp-1', assetType: 'LAPTOP', assetName: 'MacBook' };
    await controller.assignAsset(req as never, dto);
    expect(service.assignAsset).toHaveBeenCalledWith('tenant-1', dto);

    await controller.returnAsset(req as never, 'asset-1');
    expect(service.returnAsset).toHaveBeenCalledWith('tenant-1', 'asset-1');
  });

  it('should call getOrgChart', async () => {
    await controller.getOrgChart(req as never);
    expect(service.getOrgChart).toHaveBeenCalledWith('tenant-1', 'org-1');
  });

  it('should call getLeaveBalances, getLeavePolicies and createLeavePolicy', async () => {
    await controller.getLeaveBalances(req as never);
    expect(service.getLeaveBalances).toHaveBeenCalledWith('tenant-1');

    await controller.getLeavePolicies(req as never);
    expect(service.getLeavePolicies).toHaveBeenCalledWith('tenant-1');

    const dto = { name: 'Annual', leaveType: 'ANNUAL', annualAllocation: 20 };
    await controller.createLeavePolicy(req as never, dto);
    expect(service.createLeavePolicy).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call getLeaveRequests, createLeaveRequest and approveLeaveRequest', async () => {
    await controller.getLeaveRequests(req as never);
    expect(service.getLeaveRequests).toHaveBeenCalledWith('tenant-1');

    const dto = { employeeId: 'emp-1', policyId: 'pol-1', startDate: '2026-06-15', endDate: '2026-06-20' };
    await controller.createLeaveRequest(req as never, dto);
    expect(service.createLeaveRequest).toHaveBeenCalledWith('tenant-1', dto);

    await controller.approveLeaveRequest(req as never, 'req-1', { status: 'APPROVED' });
    expect(service.approveLeaveRequest).toHaveBeenCalledWith('tenant-1', 'req-1', 'APPROVED', 'user-1');
  });

  it('should call onboarding methods', async () => {
    await controller.getOnboardingChecklists(req as never);
    expect(service.getOnboardingChecklists).toHaveBeenCalledWith('tenant-1');

    const dto = { employeeId: 'emp-1', templateName: 'IT Onboarding', items: [] };
    await controller.createOnboardingChecklist(req as never, dto);
    expect(service.createOnboardingChecklist).toHaveBeenCalledWith('tenant-1', dto);

    await controller.completeOnboardingItem(req as never, 'item-1');
    expect(service.completeOnboardingItem).toHaveBeenCalledWith('tenant-1', 'item-1');

    await controller.updateOnboardingItem(req as never, 'item-1', { comments: 'done' });
    expect(service.updateOnboardingItem).toHaveBeenCalledWith('tenant-1', 'item-1', { comments: 'done' });

    await controller.addOnboardingItem(req as never, 'chk-1', { task: 'new' });
    expect(service.addOnboardingItem).toHaveBeenCalledWith('tenant-1', 'chk-1', { task: 'new' });

    await controller.deleteOnboardingItem(req as never, 'item-1');
    expect(service.deleteOnboardingItem).toHaveBeenCalledWith('tenant-1', 'item-1');
  });

  it('should call offboarding methods', async () => {
    await controller.getOffboardingChecklists(req as never);
    expect(service.getOffboardingChecklists).toHaveBeenCalledWith('tenant-1');

    const dto = { employeeId: 'emp-1', exitDate: '2026-06-30', items: [] };
    await controller.createOffboardingChecklist(req as never, dto);
    expect(service.createOffboardingChecklist).toHaveBeenCalledWith('tenant-1', dto);

    await controller.updateOffboardingItem(req as never, 'item-1', { comments: 'done' });
    expect(service.updateOffboardingItem).toHaveBeenCalledWith('tenant-1', 'item-1', { comments: 'done' });

    await controller.addOffboardingItem(req as never, 'chk-1', { task: 'new' });
    expect(service.addOffboardingItem).toHaveBeenCalledWith('tenant-1', 'chk-1', { task: 'new' });

    await controller.deleteOffboardingItem(req as never, 'item-1');
    expect(service.deleteOffboardingItem).toHaveBeenCalledWith('tenant-1', 'item-1');
  });

  it('should call getShiftSchedules and createShiftSchedule', async () => {
    await controller.getShiftSchedules(req as never);
    expect(service.getShiftSchedules).toHaveBeenCalledWith('tenant-1');

    const dto = { employeeId: 'emp-1', startTime: '09:00', endTime: '17:00' };
    await controller.createShiftSchedule(req as never, dto);
    expect(service.createShiftSchedule).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call recruitment methods', async () => {
    await controller.getJobPostings(req as never);
    expect(service.getJobPostings).toHaveBeenCalledWith('tenant-1');

    const jobDto = { title: 'Developer', description: 'Code stuff' };
    await controller.createJobPosting(req as never, jobDto);
    expect(service.createJobPosting).toHaveBeenCalledWith('tenant-1', 'org-1', jobDto);

    await controller.getApplicants(req as never, 'job-1');
    expect(service.getApplicants).toHaveBeenCalledWith('tenant-1', 'job-1');

    const appDto = { jobPostingId: 'job-1', firstName: 'John', lastName: 'Doe', email: 'john@doe.com' };
    await controller.createApplicant(req as never, appDto);
    expect(service.createApplicant).toHaveBeenCalledWith('tenant-1', appDto);

    await controller.advanceApplicant(req as never, 'app-1', { stage: 'INTERVIEW' });
    expect(service.advanceApplicant).toHaveBeenCalledWith('tenant-1', 'app-1', 'INTERVIEW');

    await controller.getInterviews(req as never);
    expect(service.getInterviews).toHaveBeenCalledWith('tenant-1');

    const intDto = { applicantId: 'app-1', jobPostingId: 'job-1', interviewerId: 'user-1', scheduledAt: '2026-06-20T10:00:00Z' };
    await controller.createInterview(req as never, intDto);
    expect(service.createInterview).toHaveBeenCalledWith('tenant-1', intDto);
  });

  it('should call goals methods', async () => {
    await controller.getGoals(req as never);
    expect(service.getGoals).toHaveBeenCalledWith('tenant-1', undefined);

    const dto = { employeeId: 'emp-1', title: 'Goal 1', startDate: '2026-01-01', endDate: '2026-12-31' };
    await controller.createGoal(req as never, dto);
    expect(service.createGoal).toHaveBeenCalledWith('tenant-1', dto);

    await controller.updateKeyResultProgress(req as never, 'kr-1', { current: 50 });
    expect(service.updateKeyResultProgress).toHaveBeenCalledWith('tenant-1', 'kr-1', 50);

    await controller.getGoalComments(req as never, 'goal-1');
    expect(service.getGoalComments).toHaveBeenCalledWith('tenant-1', 'goal-1');

    await controller.createGoalComment(req as never, 'goal-1', { comment: 'efforts' });
    expect(service.createGoalComment).toHaveBeenCalledWith('tenant-1', 'goal-1', { comment: 'efforts', authorName: 'System Admin', fileUrl: undefined, fileName: undefined });
  });

  it('should call feedback methods', async () => {
    await controller.getFeedback360(req as never, 'emp-1');
    expect(service.getFeedback360).toHaveBeenCalledWith('tenant-1', 'emp-1');

    const feedDto = { employeeId: 'emp-1', reviewerId: 'user-2', responses: [] };
    await controller.createFeedback360(req as never, feedDto);
    expect(service.createFeedback360).toHaveBeenCalledWith('tenant-1', feedDto);
  });

  it('should call succession methods', async () => {
    await controller.getSuccessionPlans(req as never);
    expect(service.getSuccessionPlans).toHaveBeenCalledWith('tenant-1');

    const succDto = { position: 'VP Eng' };
    await controller.createSuccessionPlan(req as never, succDto);
    expect(service.createSuccessionPlan).toHaveBeenCalledWith('tenant-1', succDto);
  });

  it('should call skills methods', async () => {
    await controller.getEmployeeSkills(req as never, 'emp-1');
    expect(service.getEmployeeSkills).toHaveBeenCalledWith('tenant-1', 'emp-1');

    const skillDto = { employeeId: 'emp-1', skillName: 'React' };
    await controller.createEmployeeSkill(req as never, skillDto);
    expect(service.createEmployeeSkill).toHaveBeenCalledWith('tenant-1', skillDto);
  });

  it('should call appraisals and trainings methods', async () => {
    await controller.getAppraisals(req as never);
    expect(service.getAppraisals).toHaveBeenCalledWith('tenant-1');

    const appDto = { employeeId: 'emp-1', appraisalPeriod: '2026', score: 5 };
    await controller.createAppraisal(req as never, appDto);
    expect(service.createAppraisal).toHaveBeenCalledWith('tenant-1', {
      employeeId: 'emp-1',
      reviewerId: 'user-1',
      appraisalPeriod: '2026',
      score: 5,
      feedback: undefined
    });

    await controller.getTrainings(req as never);
    expect(service.getTrainings).toHaveBeenCalledWith('tenant-1');

    const trainDto = { name: 'Security Awareness', startDate: '2026-06-15', endDate: '2026-06-16' };
    await controller.createTraining(req as never, trainDto);
    expect(service.createTraining).toHaveBeenCalledWith('tenant-1', trainDto);
  });

  it('should call analytics methods', async () => {
    await controller.getHeadcountAnalytics(req as never);
    expect(service.getHeadcountAnalytics).toHaveBeenCalledWith('tenant-1');

    await controller.getCompensationAnalytics(req as never);
    expect(service.getCompensationAnalytics).toHaveBeenCalledWith('tenant-1');

    await controller.getHRCostAnalysis(req as never);
    expect(service.getHRCostAnalysis).toHaveBeenCalledWith('tenant-1');
  });

  it('should call tickets methods', async () => {
    await controller.getHRTickets(req as never, 'emp-1');
    expect(service.getHRTickets).toHaveBeenCalledWith('tenant-1', 'emp-1');

    const ticketDto = { employeeId: 'emp-1', category: 'PAYROLL', title: 'Missing component' };
    await controller.createHRTicket(req as never, ticketDto);
    expect(service.createHRTicket).toHaveBeenCalledWith('tenant-1', ticketDto);

    await controller.resolveHRTicket(req as never, 'ticket-1', { resolution: 'Fixed component' });
    expect(service.resolveHRTicket).toHaveBeenCalledWith('tenant-1', 'ticket-1', 'Fixed component');
  });

  it('should call survey methods', async () => {
    await controller.getEngagementSurveys(req as never);
    expect(service.getEngagementSurveys).toHaveBeenCalledWith('tenant-1');

    const surveyDto = { title: 'Q2 Pulse', startDate: '2026-06-01', endDate: '2026-06-15', questions: [] };
    await controller.createEngagementSurvey(req as never, surveyDto);
    expect(service.createEngagementSurvey).toHaveBeenCalledWith('tenant-1', surveyDto);

    const responseDto = { questionId: 'q-1', employeeId: 'emp-1', rating: 4 };
    await controller.submitSurveyResponse(req as never, responseDto);
    expect(service.submitSurveyResponse).toHaveBeenCalledWith('tenant-1', responseDto);
  });
});


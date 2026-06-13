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
      getLeavePolicies: vi.fn(),
      createLeavePolicy: vi.fn(),
      getLeaveRequests: vi.fn(),
      createLeaveRequest: vi.fn(),
      approveLeaveRequest: vi.fn(),
      getShiftSchedules: vi.fn(),
      createShiftSchedule: vi.fn(),
      getAppraisals: vi.fn(),
      createAppraisal: vi.fn(),
      getTrainings: vi.fn(),
      createTraining: vi.fn(),
    } as unknown as AdvancedHrService;

    controller = new AdvancedHrController(service);
  });

  it('should call getSalaryStructures with tenantId', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    await controller.getSalaryStructures(req as never);
    expect(service.getSalaryStructures).toHaveBeenCalledWith('tenant-1');
  });

  it('should call createSalaryStructure with tenantId and dto', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    const dto = { employeeId: 'emp-1', baseSalary: 5000 };
    await controller.createSalaryStructure(req as never, dto);
    expect(service.createSalaryStructure).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call getPayrollRuns with tenantId', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    await controller.getPayrollRuns(req as never);
    expect(service.getPayrollRuns).toHaveBeenCalledWith('tenant-1');
  });

  it('should call runPayroll with tenantId and dto', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    const dto = { periodStart: '2026-06-01', periodEnd: '2026-06-30' };
    await controller.runPayroll(req as never, dto);
    expect(service.runPayroll).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call getLeavePolicies with tenantId', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    await controller.getLeavePolicies(req as never);
    expect(service.getLeavePolicies).toHaveBeenCalledWith('tenant-1');
  });

  it('should call createLeavePolicy with tenantId and dto', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    const dto = { name: 'Sabbatical', leaveType: 'CASUAL', annualAllocation: 30 };
    await controller.createLeavePolicy(req as never, dto);
    expect(service.createLeavePolicy).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call getLeaveRequests with tenantId', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    await controller.getLeaveRequests(req as never);
    expect(service.getLeaveRequests).toHaveBeenCalledWith('tenant-1');
  });

  it('should call createLeaveRequest with tenantId and dto', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    const dto = { employeeId: 'emp-1', policyId: 'pol-1', startDate: '2026-06-15', endDate: '2026-06-20' };
    await controller.createLeaveRequest(req as never, dto);
    expect(service.createLeaveRequest).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call approveLeaveRequest with correct params', async () => {
    const req = { user: { tenantId: 'tenant-1', userId: 'user-admin' } };
    const id = 'req-1';
    const dto = { status: 'APPROVED' as const };
    await controller.approveLeaveRequest(req as never, id, dto);
    expect(service.approveLeaveRequest).toHaveBeenCalledWith('tenant-1', id, 'APPROVED', 'user-admin');
  });

  it('should call getShiftSchedules with tenantId', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    await controller.getShiftSchedules(req as never);
    expect(service.getShiftSchedules).toHaveBeenCalledWith('tenant-1');
  });

  it('should call createShiftSchedule with tenantId and dto', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    const dto = { employeeId: 'emp-1', startTime: '2026-06-15T08:00:00Z', endTime: '2026-06-15T17:00:00Z' };
    await controller.createShiftSchedule(req as never, dto);
    expect(service.createShiftSchedule).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('should call getAppraisals with tenantId', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    await controller.getAppraisals(req as never);
    expect(service.getAppraisals).toHaveBeenCalledWith('tenant-1');
  });

  it('should call createAppraisal with tenantId, dto and reviewer fallback', async () => {
    const req = { user: { tenantId: 'tenant-1', userId: 'user-admin' } };
    const dto = { employeeId: 'emp-1', appraisalPeriod: 'Q1', score: 4.8, feedback: 'Great' };
    await controller.createAppraisal(req as never, dto);
    expect(service.createAppraisal).toHaveBeenCalledWith('tenant-1', {
      employeeId: 'emp-1',
      reviewerId: 'user-admin',
      appraisalPeriod: 'Q1',
      score: 4.8,
      feedback: 'Great'
    });
  });

  it('should call getTrainings with tenantId', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    await controller.getTrainings(req as never);
    expect(service.getTrainings).toHaveBeenCalledWith('tenant-1');
  });

  it('should call createTraining with tenantId and dto', async () => {
    const req = { user: { tenantId: 'tenant-1' } };
    const dto = { name: 'First Aid', instructor: 'Nurse Joy', startDate: '2026-07-01', endDate: '2026-07-02' };
    await controller.createTraining(req as never, dto);
    expect(service.createTraining).toHaveBeenCalledWith('tenant-1', dto);
  });
});

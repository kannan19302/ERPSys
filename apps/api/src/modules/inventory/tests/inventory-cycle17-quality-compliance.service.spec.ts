import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    capaRecord: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    capaAction: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    calibrationRecord: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    deviationRecord: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    sopDocument: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    sopRevision: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('QualityComplianceService', () => {
  const TENANT = 'tenant-qc';

  beforeEach(() => vi.clearAllMocks());

  // ─── CAPA ─────────────────────────────────────────────────────────────────

  it('listCapas — returns filtered results', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaRecord.findMany).mockResolvedValue([]);
    await svc.listCapas(TENANT, { status: 'OPEN', type: 'CORRECTIVE' });
    expect(vi.mocked(prisma.capaRecord.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT, status: 'OPEN', type: 'CORRECTIVE' }) }),
    );
  });

  it('createCapa — generates CAPA number and creates record', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    const dto = { title: 'Process failure in warehouse', type: 'CORRECTIVE' as const, source: 'INTERNAL' as const, priority: 'HIGH' as const, description: 'Root cause TBD' };
    vi.mocked(prisma.capaRecord.create).mockResolvedValue({ id: 'cap1', capaNumber: 'CAPA-001', ...dto } as any);
    const result = await svc.createCapa(TENANT, dto);
    expect(result).toMatchObject({ id: 'cap1' });
    expect(vi.mocked(prisma.capaRecord.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: TENANT, title: 'Process failure in warehouse' }) }),
    );
  });

  it('getCapa — throws NotFoundException for unknown id', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaRecord.findFirst).mockResolvedValue(null);
    await expect(svc.getCapa(TENANT, 'no-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('transitionCapaStatus — allows OPEN → IN_PROGRESS', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaRecord.findFirst).mockResolvedValue({ id: 'cap1', status: 'OPEN' } as any);
    vi.mocked(prisma.capaRecord.update).mockResolvedValue({ id: 'cap1', status: 'IN_PROGRESS' } as any);
    const result = await svc.transitionCapaStatus(TENANT, 'cap1', 'IN_PROGRESS');
    expect(result).toMatchObject({ status: 'IN_PROGRESS' });
  });

  it('transitionCapaStatus — rejects invalid transition from CLOSED', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaRecord.findFirst).mockResolvedValue({ id: 'cap1', status: 'CLOSED' } as any);
    await expect(svc.transitionCapaStatus(TENANT, 'cap1', 'IN_PROGRESS')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transitionCapaStatus — sets closedAt when closing', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaRecord.findFirst).mockResolvedValue({ id: 'cap1', status: 'PENDING_VERIFICATION' } as any);
    vi.mocked(prisma.capaRecord.update).mockResolvedValue({ id: 'cap1', status: 'CLOSED' } as any);
    await svc.transitionCapaStatus(TENANT, 'cap1', 'CLOSED');
    expect(vi.mocked(prisma.capaRecord.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED', closedAt: expect.any(Date) }) }),
    );
  });

  it('addCapaAction — creates action linked to CAPA', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaRecord.findFirst).mockResolvedValue({ id: 'cap1' } as any);
    vi.mocked(prisma.capaAction.create).mockResolvedValue({ id: 'act1', capaId: 'cap1' } as any);
    const dto = { actionType: 'CONTAINMENT' as const, description: 'Quarantine affected batches' };
    const result = await svc.addCapaAction(TENANT, 'cap1', dto);
    expect(result).toMatchObject({ id: 'act1' });
  });

  it('completeCapaAction — marks action complete with timestamp', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaAction.findFirst).mockResolvedValue({ id: 'act1', status: 'PENDING', notes: null } as any);
    vi.mocked(prisma.capaAction.update).mockResolvedValue({ id: 'act1', status: 'COMPLETE' } as any);
    await svc.completeCapaAction(TENANT, 'act1', 'Completed quarantine');
    expect(vi.mocked(prisma.capaAction.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETE', completedAt: expect.any(Date) }) }),
    );
  });

  it('completeCapaAction — rejects already completed action', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaAction.findFirst).mockResolvedValue({ id: 'act1', status: 'COMPLETE' } as any);
    await expect(svc.completeCapaAction(TENANT, 'act1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getCapaDashboard — returns aggregate counts', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaRecord.count).mockResolvedValue(3 as any);
    const result = await svc.getCapaDashboard(TENANT);
    expect(result).toHaveProperty('open', 3);
    expect(result).toHaveProperty('overdue', 3);
  });

  // ─── Calibration ──────────────────────────────────────────────────────────

  it('scheduleCalibration — creates calibration with DUE status', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    const dto = {
      instrumentId: 'inst-001',
      instrumentName: 'Torque Wrench #3',
      calibrationType: 'INTERNAL' as const,
      scheduledDate: new Date().toISOString(),
      intervalDays: 90,
    };
    vi.mocked(prisma.calibrationRecord.create).mockResolvedValue({ id: 'cal1', status: 'DUE' } as any);
    const result = await svc.scheduleCalibration(TENANT, dto);
    expect(result).toMatchObject({ id: 'cal1' });
    expect(vi.mocked(prisma.calibrationRecord.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DUE', intervalDays: 90 }) }),
    );
  });

  it('recordCalibrationResult — marks PASSED and sets nextDueDate when interval set', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.calibrationRecord.findFirst).mockResolvedValue({ id: 'cal1', status: 'DUE', intervalDays: 30 } as any);
    vi.mocked(prisma.calibrationRecord.update).mockResolvedValue({ id: 'cal1', status: 'PASSED' } as any);
    await svc.recordCalibrationResult(TENANT, 'cal1', { result: 'PASS', performedBy: 'John' });
    expect(vi.mocked(prisma.calibrationRecord.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PASSED', result: 'PASS', nextDueDate: expect.any(Date) }) }),
    );
  });

  it('recordCalibrationResult — rejects duplicate result recording', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.calibrationRecord.findFirst).mockResolvedValue({ id: 'cal1', status: 'PASSED', intervalDays: null } as any);
    await expect(svc.recordCalibrationResult(TENANT, 'cal1', { result: 'PASS' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getOverdueCalibrations — queries past scheduled_date with DUE/OVERDUE status', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.calibrationRecord.findMany).mockResolvedValue([{ id: 'cal2' }] as any);
    const result = await svc.getOverdueCalibrations(TENANT);
    expect(result).toHaveLength(1);
    expect(vi.mocked(prisma.calibrationRecord.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ scheduledDate: { lt: expect.any(Date) } }) }),
    );
  });

  // ─── Deviations ───────────────────────────────────────────────────────────

  it('createDeviation — generates deviation number', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    const dto = {
      title: 'Temperature excursion in cold store',
      type: 'ENVIRONMENTAL' as const,
      severity: 'MAJOR' as const,
      description: 'Cold store temp rose to 12°C for 2 hours',
      detectedAt: new Date().toISOString(),
    };
    vi.mocked(prisma.deviationRecord.create).mockResolvedValue({ id: 'dev1', deviationNumber: 'DEV-001' } as any);
    const result = await svc.createDeviation(TENANT, dto);
    expect(result).toMatchObject({ id: 'dev1' });
  });

  it('reviewDeviation — transitions OPEN to UNDER_REVIEW', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.deviationRecord.findFirst).mockResolvedValue({ id: 'dev1', status: 'OPEN' } as any);
    vi.mocked(prisma.deviationRecord.update).mockResolvedValue({ id: 'dev1', status: 'UNDER_REVIEW' } as any);
    const result = await svc.reviewDeviation(TENANT, 'dev1', 'Impact: 5 affected pallets');
    expect(result).toMatchObject({ status: 'UNDER_REVIEW' });
  });

  it('reviewDeviation — rejects non-OPEN deviation', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.deviationRecord.findFirst).mockResolvedValue({ id: 'dev1', status: 'CLOSED' } as any);
    await expect(svc.reviewDeviation(TENANT, 'dev1', 'notes')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closeDeviation — links optional CAPA id', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.deviationRecord.findFirst).mockResolvedValue({ id: 'dev1', status: 'UNDER_REVIEW' } as any);
    vi.mocked(prisma.deviationRecord.update).mockResolvedValue({ id: 'dev1', status: 'CLOSED' } as any);
    await svc.closeDeviation(TENANT, 'dev1', 'Jane Doe', 'cap1');
    expect(vi.mocked(prisma.deviationRecord.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED', capaId: 'cap1' }) }),
    );
  });

  it('getDeviationDashboard — counts by severity', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.deviationRecord.count).mockResolvedValue(2 as any);
    const result = await svc.getDeviationDashboard(TENANT);
    expect(result.bySeverity).toHaveProperty('critical', 2);
  });

  // ─── SOP Documents ────────────────────────────────────────────────────────

  it('createSop — generates docNumber and creates SOP', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.sopDocument.count).mockResolvedValue(5 as any);
    vi.mocked(prisma.sopDocument.create).mockResolvedValue({ id: 'sop1', docNumber: 'SOP-0006', status: 'DRAFT' } as any);
    const dto = { title: 'Goods Receipt Procedure', category: 'SOP' as const };
    const result = await svc.createSop(TENANT, dto);
    expect(result).toMatchObject({ id: 'sop1' });
    expect(vi.mocked(prisma.sopDocument.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ docNumber: 'SOP-0006', tenantId: TENANT }) }),
    );
  });

  it('submitSopForReview — transitions DRAFT to UNDER_REVIEW', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.sopDocument.findFirst).mockResolvedValue({ id: 'sop1', status: 'DRAFT' } as any);
    vi.mocked(prisma.sopDocument.update).mockResolvedValue({ id: 'sop1', status: 'UNDER_REVIEW' } as any);
    const result = await svc.submitSopForReview(TENANT, 'sop1');
    expect(result).toMatchObject({ status: 'UNDER_REVIEW' });
  });

  it('submitSopForReview — rejects non-DRAFT document', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.sopDocument.findFirst).mockResolvedValue({ id: 'sop1', status: 'APPROVED' } as any);
    await expect(svc.submitSopForReview(TENANT, 'sop1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('approveSop — sets APPROVED + approvedAt + effectiveDate', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.sopDocument.findFirst).mockResolvedValue({ id: 'sop1', status: 'UNDER_REVIEW' } as any);
    vi.mocked(prisma.sopDocument.update).mockResolvedValue({ id: 'sop1', status: 'APPROVED' } as any);
    await svc.approveSop(TENANT, 'sop1', 'user-admin');
    expect(vi.mocked(prisma.sopDocument.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED', approvedAt: expect.any(Date) }) }),
    );
  });

  it('reviseSOp — bumps version and logs revision', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.sopDocument.findFirst).mockResolvedValue({ id: 'sop1', version: '1.0', status: 'APPROVED' } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (ops: any[]) => Promise.all(ops.map(o => o)));
    vi.mocked(prisma.sopDocument.update).mockResolvedValue({ id: 'sop1', version: '2.0', status: 'DRAFT' } as any);
    vi.mocked(prisma.sopRevision.create).mockResolvedValue({ id: 'rev1' } as any);
    await svc.reviseSOp(TENANT, 'sop1', '2.0', 'Updated receipt procedure', 'user-editor');
    expect(vi.mocked(prisma.$transaction)).toHaveBeenCalled();
  });

  it('getSopsDueSoon — returns approved SOPs with review dates within window', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.sopDocument.findMany).mockResolvedValue([{ id: 'sop1' }] as any);
    const result = await svc.getSopsDueSoon(TENANT, 30);
    expect(result).toHaveLength(1);
    expect(vi.mocked(prisma.sopDocument.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'APPROVED' }) }),
    );
  });

  it('getComplianceDashboard — aggregates all sub-dashboards', async () => {
    const { prisma } = await import('@unerp/database');
    const { QualityComplianceService } = await import('../quality-compliance.service');
    const svc = new QualityComplianceService();
    vi.mocked(prisma.capaRecord.count).mockResolvedValue(1 as any);
    vi.mocked(prisma.calibrationRecord.count).mockResolvedValue(2 as any);
    vi.mocked(prisma.deviationRecord.count).mockResolvedValue(3 as any);
    vi.mocked(prisma.sopDocument.count).mockResolvedValue(4 as any);
    const result = await svc.getComplianceDashboard(TENANT);
    expect(result).toHaveProperty('capa');
    expect(result).toHaveProperty('calibration');
    expect(result).toHaveProperty('deviations');
    expect(result).toHaveProperty('sops');
    expect(result.sops.approved).toBe(4);
  });
});

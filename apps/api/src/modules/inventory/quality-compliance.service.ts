import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

// ─── Input Schemas ────────────────────────────────────────────────────────────

export const createCapaSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['CORRECTIVE', 'PREVENTIVE']).default('CORRECTIVE'),
  source: z.enum(['INTERNAL', 'CUSTOMER', 'AUDIT', 'NCR', 'DEVIATION']).default('INTERNAL'),
  sourceRefId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().min(1),
  rootCause: z.string().optional(),
  immediateAction: z.string().optional(),
  correctiveAction: z.string().optional(),
  preventiveAction: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
});

export const addCapaActionSchema = z.object({
  actionType: z.enum(['ROOT_CAUSE_ANALYSIS', 'CONTAINMENT', 'CORRECTIVE', 'PREVENTIVE', 'VERIFICATION']),
  description: z.string().min(1),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const createCalibrationSchema = z.object({
  instrumentId: z.string().min(1),
  instrumentName: z.string().min(1),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  calibrationType: z.enum(['INTERNAL', 'EXTERNAL', 'VENDOR']),
  scheduledDate: z.string().datetime(),
  intervalDays: z.number().int().positive().optional(),
  externalVendor: z.string().optional(),
  tolerance: z.string().optional(),
  notes: z.string().optional(),
});

export const recordCalibrationResultSchema = z.object({
  result: z.enum(['PASS', 'FAIL', 'LIMITED_USE']),
  performedBy: z.string().optional(),
  externalVendor: z.string().optional(),
  certificateNumber: z.string().optional(),
  certificateUrl: z.string().url().optional(),
  measurementBefore: z.string().optional(),
  measurementAfter: z.string().optional(),
  notes: z.string().optional(),
});

export const createDeviationSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['PROCESS', 'PRODUCT', 'MATERIAL', 'EQUIPMENT', 'DOCUMENTATION', 'ENVIRONMENTAL']).default('PROCESS'),
  severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).default('MINOR'),
  description: z.string().min(1),
  detectedAt: z.string().datetime(),
  detectedBy: z.string().optional(),
  area: z.string().optional(),
  productId: z.string().optional(),
  batchId: z.string().optional(),
  impact: z.string().optional(),
  immediateAction: z.string().optional(),
});

export const createSopSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['SOP', 'WORK_INSTRUCTION', 'FORM', 'POLICY', 'SPECIFICATION']).default('SOP'),
  department: z.string().optional(),
  version: z.string().default('1.0'),
  effectiveDate: z.string().datetime().optional(),
  reviewDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  authorId: z.string().optional(),
  fileUrl: z.string().url().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
});

@Injectable()
export class QualityComplianceService {

  // ─── CAPA ─────────────────────────────────────────────────────────────────

  async listCapas(tenantId: string, filters: { status?: string; type?: string; priority?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.status) where['status'] = filters.status;
    if (filters.type) where['type'] = filters.type;
    if (filters.priority) where['priority'] = filters.priority;
    return prisma.capaRecord.findMany({
      where,
      include: { actions: { orderBy: { createdAt: 'asc' } } },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getCapa(tenantId: string, id: string) {
    const record = await prisma.capaRecord.findFirst({
      where: { id, tenantId },
      include: { actions: { orderBy: { createdAt: 'asc' } } },
    });
    if (!record) throw new NotFoundException('CAPA record not found');
    return record;
  }

  async createCapa(tenantId: string, dto: z.infer<typeof createCapaSchema>) {
    const capaNumber = `CAPA-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return prisma.capaRecord.create({
      data: {
        tenantId,
        capaNumber,
        title: dto.title,
        type: dto.type ?? 'CORRECTIVE',
        source: dto.source ?? 'INTERNAL',
        sourceRefId: dto.sourceRefId,
        priority: dto.priority ?? 'MEDIUM',
        description: dto.description,
        rootCause: dto.rootCause,
        immediateAction: dto.immediateAction,
        correctiveAction: dto.correctiveAction,
        preventiveAction: dto.preventiveAction,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assignedTo: dto.assignedTo,
      },
      include: { actions: true },
    });
  }

  async updateCapa(tenantId: string, id: string, dto: Partial<z.infer<typeof createCapaSchema>>) {
    const record = await prisma.capaRecord.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('CAPA record not found');
    return prisma.capaRecord.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { actions: true },
    });
  }

  async transitionCapaStatus(tenantId: string, id: string, newStatus: string) {
    const record = await prisma.capaRecord.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('CAPA record not found');

    const allowed: Record<string, string[]> = {
      OPEN: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['PENDING_VERIFICATION', 'CANCELLED'],
      PENDING_VERIFICATION: ['CLOSED', 'IN_PROGRESS'],
      CLOSED: [],
      CANCELLED: [],
    };
    if (!allowed[record.status]?.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition CAPA from ${record.status} to ${newStatus}`);
    }

    const data: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'CLOSED') data['closedAt'] = new Date();
    if (newStatus === 'PENDING_VERIFICATION') data['verifiedAt'] = null;
    return prisma.capaRecord.update({ where: { id }, data, include: { actions: true } });
  }

  async addCapaAction(tenantId: string, capaId: string, dto: z.infer<typeof addCapaActionSchema>) {
    const capa = await prisma.capaRecord.findFirst({ where: { id: capaId, tenantId } });
    if (!capa) throw new NotFoundException('CAPA record not found');
    return prisma.capaAction.create({
      data: {
        tenantId,
        capaId,
        actionType: dto.actionType,
        description: dto.description,
        assignedTo: dto.assignedTo,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  async completeCapaAction(tenantId: string, actionId: string, notes?: string) {
    const action = await prisma.capaAction.findFirst({ where: { id: actionId, tenantId } });
    if (!action) throw new NotFoundException('CAPA action not found');
    if (action.status === 'COMPLETE') throw new BadRequestException('Action already complete');
    return prisma.capaAction.update({
      where: { id: actionId },
      data: { status: 'COMPLETE', completedAt: new Date(), notes: notes ?? action.notes },
    });
  }

  async getCapaDashboard(tenantId: string) {
    const [open, inProgress, pendingVerification, closed, overdue] = await Promise.all([
      prisma.capaRecord.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.capaRecord.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      prisma.capaRecord.count({ where: { tenantId, status: 'PENDING_VERIFICATION' } }),
      prisma.capaRecord.count({ where: { tenantId, status: 'CLOSED' } }),
      prisma.capaRecord.count({
        where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } },
      }),
    ]);
    return { open, inProgress, pendingVerification, closed, overdue };
  }

  // ─── Calibration ──────────────────────────────────────────────────────────

  async listCalibrations(tenantId: string, filters: { status?: string; instrumentId?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.status) where['status'] = filters.status;
    if (filters.instrumentId) where['instrumentId'] = filters.instrumentId;
    return prisma.calibrationRecord.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async getCalibration(tenantId: string, id: string) {
    const record = await prisma.calibrationRecord.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Calibration record not found');
    return record;
  }

  async scheduleCalibration(tenantId: string, dto: z.infer<typeof createCalibrationSchema>) {
    return prisma.calibrationRecord.create({
      data: {
        tenantId,
        instrumentId: dto.instrumentId,
        instrumentName: dto.instrumentName,
        serialNumber: dto.serialNumber,
        location: dto.location,
        calibrationType: dto.calibrationType,
        scheduledDate: new Date(dto.scheduledDate),
        intervalDays: dto.intervalDays,
        externalVendor: dto.externalVendor,
        tolerance: dto.tolerance,
        notes: dto.notes,
        status: 'DUE',
      },
    });
  }

  async recordCalibrationResult(tenantId: string, id: string, dto: z.infer<typeof recordCalibrationResultSchema>) {
    const record = await prisma.calibrationRecord.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Calibration record not found');
    if (record.status === 'PASSED' || record.status === 'FAILED') {
      throw new BadRequestException('Calibration result already recorded');
    }

    const nextDueDate = record.intervalDays
      ? new Date(Date.now() + record.intervalDays * 86400000)
      : undefined;

    return prisma.calibrationRecord.update({
      where: { id },
      data: {
        status: dto.result === 'PASS' ? 'PASSED' : 'FAILED',
        result: dto.result,
        performedAt: new Date(),
        nextDueDate,
        performedBy: dto.performedBy,
        externalVendor: dto.externalVendor,
        certificateNumber: dto.certificateNumber,
        certificateUrl: dto.certificateUrl,
        measurementBefore: dto.measurementBefore,
        measurementAfter: dto.measurementAfter,
        notes: dto.notes,
      },
    });
  }

  async getOverdueCalibrations(tenantId: string) {
    return prisma.calibrationRecord.findMany({
      where: {
        tenantId,
        status: { in: ['DUE', 'OVERDUE'] },
        scheduledDate: { lt: new Date() },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async getCalibrationDashboard(tenantId: string) {
    const [due, inProgress, passed, failed, overdue] = await Promise.all([
      prisma.calibrationRecord.count({ where: { tenantId, status: 'DUE' } }),
      prisma.calibrationRecord.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      prisma.calibrationRecord.count({ where: { tenantId, status: 'PASSED' } }),
      prisma.calibrationRecord.count({ where: { tenantId, status: 'FAILED' } }),
      prisma.calibrationRecord.count({
        where: { tenantId, status: { in: ['DUE', 'OVERDUE'] }, scheduledDate: { lt: new Date() } },
      }),
    ]);
    return { due, inProgress, passed, failed, overdue };
  }

  // ─── Deviations ───────────────────────────────────────────────────────────

  async listDeviations(tenantId: string, filters: { status?: string; severity?: string; type?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.status) where['status'] = filters.status;
    if (filters.severity) where['severity'] = filters.severity;
    if (filters.type) where['type'] = filters.type;
    return prisma.deviationRecord.findMany({
      where,
      orderBy: [{ severity: 'asc' }, { detectedAt: 'desc' }],
    });
  }

  async getDeviation(tenantId: string, id: string) {
    const record = await prisma.deviationRecord.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Deviation record not found');
    return record;
  }

  async createDeviation(tenantId: string, dto: z.infer<typeof createDeviationSchema>) {
    const deviationNumber = `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    return prisma.deviationRecord.create({
      data: {
        tenantId,
        deviationNumber,
        title: dto.title,
        type: dto.type ?? 'PROCESS',
        severity: dto.severity ?? 'MINOR',
        description: dto.description,
        detectedAt: new Date(dto.detectedAt),
        detectedBy: dto.detectedBy,
        area: dto.area,
        productId: dto.productId,
        batchId: dto.batchId,
        impact: dto.impact,
        immediateAction: dto.immediateAction,
      },
    });
  }

  async reviewDeviation(tenantId: string, id: string, reviewNotes: string) {
    const record = await prisma.deviationRecord.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Deviation record not found');
    if (record.status !== 'OPEN') throw new BadRequestException('Deviation is not in OPEN status');
    return prisma.deviationRecord.update({
      where: { id },
      data: { status: 'UNDER_REVIEW', impact: reviewNotes },
    });
  }

  async closeDeviation(tenantId: string, id: string, closedBy: string, capaId?: string) {
    const record = await prisma.deviationRecord.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Deviation record not found');
    if (record.status === 'CLOSED') throw new BadRequestException('Deviation already closed');
    return prisma.deviationRecord.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedBy, capaId },
    });
  }

  async escalateDeviationToCapa(tenantId: string, id: string, capaDto: z.infer<typeof createCapaSchema>) {
    const deviation = await prisma.deviationRecord.findFirst({ where: { id, tenantId } });
    if (!deviation) throw new NotFoundException('Deviation record not found');

    const capa = await this.createCapa(tenantId, {
      ...capaDto,
      source: 'DEVIATION',
      sourceRefId: id,
      priority: deviation.severity === 'CRITICAL' ? 'CRITICAL' : deviation.severity === 'MAJOR' ? 'HIGH' : 'MEDIUM',
    });

    await prisma.deviationRecord.update({ where: { id }, data: { capaId: capa.id } });
    return capa;
  }

  async getDeviationDashboard(tenantId: string) {
    const [open, underReview, closed, critical, major, minor] = await Promise.all([
      prisma.deviationRecord.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.deviationRecord.count({ where: { tenantId, status: 'UNDER_REVIEW' } }),
      prisma.deviationRecord.count({ where: { tenantId, status: 'CLOSED' } }),
      prisma.deviationRecord.count({ where: { tenantId, severity: 'CRITICAL' } }),
      prisma.deviationRecord.count({ where: { tenantId, severity: 'MAJOR' } }),
      prisma.deviationRecord.count({ where: { tenantId, severity: 'MINOR' } }),
    ]);
    return { open, underReview, closed, bySeverity: { critical, major, minor } };
  }

  // ─── SOP Document Control ─────────────────────────────────────────────────

  async listSops(tenantId: string, filters: { status?: string; category?: string; department?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.status) where['status'] = filters.status;
    if (filters.category) where['category'] = filters.category;
    if (filters.department) where['department'] = filters.department;
    return prisma.sopDocument.findMany({
      where,
      include: { revisions: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSop(tenantId: string, id: string) {
    const doc = await prisma.sopDocument.findFirst({
      where: { id, tenantId },
      include: { revisions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!doc) throw new NotFoundException('SOP document not found');
    return doc;
  }

  async createSop(tenantId: string, dto: z.infer<typeof createSopSchema>) {
    const docCount = await prisma.sopDocument.count({ where: { tenantId } });
    const docNumber = `SOP-${String(docCount + 1).padStart(4, '0')}`;
    return prisma.sopDocument.create({
      data: {
        tenantId,
        docNumber,
        title: dto.title,
        category: dto.category ?? 'SOP',
        department: dto.department,
        version: dto.version ?? '1.0',
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        authorId: dto.authorId,
        fileUrl: dto.fileUrl,
        description: dto.description,
        keywords: dto.keywords,
      },
      include: { revisions: true },
    });
  }

  async submitSopForReview(tenantId: string, id: string) {
    const doc = await prisma.sopDocument.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('SOP document not found');
    if (doc.status !== 'DRAFT') throw new BadRequestException('Only DRAFT documents can be submitted for review');
    return prisma.sopDocument.update({ where: { id }, data: { status: 'UNDER_REVIEW' } });
  }

  async approveSop(tenantId: string, id: string, approverId: string, effectiveDate?: string) {
    const doc = await prisma.sopDocument.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('SOP document not found');
    if (doc.status !== 'UNDER_REVIEW') throw new BadRequestException('Document must be UNDER_REVIEW to approve');
    return prisma.sopDocument.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId,
        approvedAt: new Date(),
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      },
    });
  }

  async obsoleteSop(tenantId: string, id: string, supersededById?: string) {
    const doc = await prisma.sopDocument.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('SOP document not found');
    return prisma.sopDocument.update({
      where: { id },
      data: { status: 'OBSOLETE', supersededById },
    });
  }

  async reviseSOp(tenantId: string, id: string, newVersion: string, changeSummary: string, changedBy?: string) {
    const doc = await prisma.sopDocument.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('SOP document not found');

    const [updated] = await prisma.$transaction([
      prisma.sopDocument.update({ where: { id }, data: { version: newVersion, status: 'DRAFT' } }),
      prisma.sopRevision.create({
        data: { tenantId, docId: id, version: newVersion, changeSummary, changedBy },
      }),
    ]);
    return updated;
  }

  async searchSops(tenantId: string, keyword: string) {
    return prisma.sopDocument.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { keywords: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { docNumber: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async getSopsDueSoon(tenantId: string, days = 30) {
    const cutoff = new Date(Date.now() + days * 86400000);
    return prisma.sopDocument.findMany({
      where: {
        tenantId,
        status: 'APPROVED',
        OR: [
          { reviewDate: { lte: cutoff } },
          { expiryDate: { lte: cutoff } },
        ],
      },
      orderBy: { reviewDate: 'asc' },
    });
  }

  // ─── Compliance Dashboard ─────────────────────────────────────────────────

  async getComplianceDashboard(tenantId: string) {
    const [capaDash, calDash, devDash, approvedSops, overdueReviews, expiringSoon] = await Promise.all([
      this.getCapaDashboard(tenantId),
      this.getCalibrationDashboard(tenantId),
      this.getDeviationDashboard(tenantId),
      prisma.sopDocument.count({ where: { tenantId, status: 'APPROVED' } }),
      prisma.sopDocument.count({
        where: {
          tenantId,
          status: 'APPROVED',
          reviewDate: { lt: new Date() },
        },
      }),
      prisma.sopDocument.count({
        where: {
          tenantId,
          status: 'APPROVED',
          reviewDate: { lte: new Date(Date.now() + 30 * 86400000) },
        },
      }),
    ]);

    return {
      capa: capaDash,
      calibration: calDash,
      deviations: devDash,
      sops: { approved: approvedSops, overdueReviews, expiringSoon },
    };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ComplianceControlsService {
  // ── FINANCIAL CONTROLS ──────────────────────────────────

  async listControls(tenantId: string, riskLevel?: string) {
    return prisma.financialControl.findMany({
      where: { tenantId, ...(riskLevel && { riskLevel }), isActive: true },
      include: { tests: { orderBy: { testDate: 'desc' }, take: 1 } },
      orderBy: [{ riskLevel: 'desc' }, { controlCode: 'asc' }],
    });
  }

  async getControl(tenantId: string, id: string) {
    const c = await prisma.financialControl.findFirst({ where: { id, tenantId }, include: { tests: true } });
    if (!c) throw new NotFoundException('Financial control not found');
    return c;
  }

  async createControl(tenantId: string, dto: {
    controlCode: string; name: string; description?: string; riskLevel?: string;
    controlType: string; category?: string; ownerId?: string;
    testFrequency?: string; procedure?: string;
  }) {
    return prisma.financialControl.create({ data: { tenantId, ...dto } });
  }

  async updateControl(tenantId: string, id: string, dto: Partial<{
    name: string; description: string; riskLevel: string; ownerId: string;
    testFrequency: string; procedure: string; isActive: boolean;
  }>) {
    await this.getControl(tenantId, id);
    return prisma.financialControl.update({ where: { id }, data: dto });
  }

  async deleteControl(tenantId: string, id: string) {
    await this.getControl(tenantId, id);
    return prisma.financialControl.update({ where: { id }, data: { isActive: false } });
  }

  // ── CONTROL TESTS ──────────────────────────────────

  async listControlTests(tenantId: string, controlId?: string) {
    return prisma.controlTest.findMany({
      where: { tenantId, ...(controlId && { controlId }) },
      include: { control: true },
      orderBy: { testDate: 'desc' },
    });
  }

  async createControlTest(tenantId: string, dto: {
    controlId: string; testDate: string; testerId: string; result: string;
    findingNotes?: string; remediationPlan?: string; remediationDue?: string;
    evidenceUrls?: string[];
  }) {
    await this.getControl(tenantId, dto.controlId);
    return prisma.controlTest.create({
      data: {
        tenantId,
        controlId: dto.controlId,
        testDate: new Date(dto.testDate),
        testerId: dto.testerId,
        result: dto.result,
        findingNotes: dto.findingNotes,
        remediationPlan: dto.remediationPlan,
        remediationDue: dto.remediationDue ? new Date(dto.remediationDue) : null,
        evidenceUrls: (dto.evidenceUrls ?? []) as never,
      },
    });
  }

  async reviewControlTest(tenantId: string, id: string, reviewedBy: string) {
    const t = await prisma.controlTest.findFirst({ where: { id, tenantId } });
    if (!t) throw new NotFoundException('Control test not found');
    return prisma.controlTest.update({ where: { id }, data: { reviewedBy, reviewedAt: new Date() } });
  }

  async getControlEffectivenessDashboard(tenantId: string) {
    const tests = await prisma.controlTest.findMany({ where: { tenantId }, include: { control: true } });
    const byOwner: Record<string, { ownerId: string; total: number; effective: number; deficient: number; materialWeakness: number }> = {};
    for (const t of tests) {
      const owner = t.control.ownerId ?? 'unassigned';
      if (!byOwner[owner]) byOwner[owner] = { ownerId: owner, total: 0, effective: 0, deficient: 0, materialWeakness: 0 };
      byOwner[owner].total++;
      if (t.result === 'EFFECTIVE') byOwner[owner].effective++;
      else if (t.result === 'DEFICIENT') byOwner[owner].deficient++;
      else if (t.result === 'MATERIAL_WEAKNESS') byOwner[owner].materialWeakness++;
    }
    const overallTotal = tests.length;
    const overallEffective = tests.filter(t => t.result === 'EFFECTIVE').length;
    return {
      passRate: overallTotal > 0 ? ((overallEffective / overallTotal) * 100).toFixed(1) : '0.0',
      totalTests: overallTotal,
      effective: overallEffective,
      deficiencies: tests.filter(t => t.result === 'DEFICIENT').length,
      materialWeaknesses: tests.filter(t => t.result === 'MATERIAL_WEAKNESS').length,
      byOwner: Object.values(byOwner),
    };
  }

  // ── SOD RULE DEFINITIONS ──────────────────────────────────

  async listSodRules(tenantId: string) {
    return prisma.sodRuleDefinition.findMany({ where: { tenantId, isActive: true } });
  }

  async createSodRule(tenantId: string, dto: {
    name: string; permission1: string; permission2: string;
    riskLevel?: string; description?: string;
  }) {
    return prisma.sodRuleDefinition.create({ data: { tenantId, ...dto } });
  }

  async updateSodRule(tenantId: string, id: string, dto: Partial<{ isActive: boolean; riskLevel: string; description: string }>) {
    const rule = await prisma.sodRuleDefinition.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('SoD rule not found');
    return prisma.sodRuleDefinition.update({ where: { id }, data: dto });
  }

  // ── SOD CONFLICT DETECTION ──────────────────────────────────

  async runSodScan(tenantId: string) {
    const rules = await prisma.sodRuleDefinition.findMany({ where: { tenantId, isActive: true } });
    const users = await prisma.user.findMany({
      where: { tenantId },
      include: { roles: { include: { role: true } } },
    });

    const conflicts = [];
    for (const user of users) {
      const permissions: string[] = [];
      for (const ur of user.roles) {
        const rolePerms = ur.role.permissions as string[];
        permissions.push(...rolePerms);
      }
      for (const rule of rules) {
        const has1 = permissions.includes(rule.permission1);
        const has2 = permissions.includes(rule.permission2);
        if (has1 && has2) {
          const exists = await prisma.sodConflict.findFirst({
            where: { tenantId, userId: user.id, permission1: rule.permission1, permission2: rule.permission2, status: 'OPEN' },
          });
          if (!exists) {
            const conflict = await prisma.sodConflict.create({
              data: {
                tenantId, userId: user.id,
                permission1: rule.permission1, permission2: rule.permission2,
                riskLevel: rule.riskLevel, status: 'OPEN',
              },
            });
            conflicts.push(conflict);
          }
        }
      }
    }
    return { scanned: users.length, newConflicts: conflicts.length, conflicts };
  }

  async listSodConflicts(tenantId: string, status?: string) {
    return prisma.sodConflict.findMany({
      where: { tenantId, ...(status && { status }) },
      orderBy: [{ riskLevel: 'desc' }, { detectedAt: 'desc' }],
    });
  }

  async resolveSodConflict(tenantId: string, id: string, dto: {
    status: string; resolvedBy: string; mitigationNotes?: string;
  }) {
    const conflict = await prisma.sodConflict.findFirst({ where: { id, tenantId } });
    if (!conflict) throw new NotFoundException('SoD conflict not found');
    return prisma.sodConflict.update({
      where: { id },
      data: { status: dto.status, resolvedBy: dto.resolvedBy, mitigationNotes: dto.mitigationNotes, resolvedAt: new Date() },
    });
  }

  // ── AUDIT CONFIRMATIONS ──────────────────────────────────

  async listAuditConfirmations(tenantId: string, status?: string) {
    return prisma.auditConfirmation.findMany({
      where: { tenantId, ...(status && { status }) },
      orderBy: { requestDate: 'desc' },
    });
  }

  async createAuditConfirmation(tenantId: string, dto: {
    confirmationType: string; entityType: string; entityId: string; entityName: string;
    requestDate: string; balanceAsOf: string; bookAmount?: number; notes?: string;
  }) {
    return prisma.auditConfirmation.create({
      data: {
        tenantId,
        confirmationType: dto.confirmationType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        entityName: dto.entityName,
        requestDate: new Date(dto.requestDate),
        balanceAsOf: new Date(dto.balanceAsOf),
        bookAmount: dto.bookAmount,
        notes: dto.notes,
        status: 'SENT',
      },
    });
  }

  async recordAuditConfirmationResponse(tenantId: string, id: string, dto: {
    confirmedAmount: number; responseDate?: string; notes?: string;
  }) {
    const conf = await prisma.auditConfirmation.findFirst({ where: { id, tenantId } });
    if (!conf) throw new NotFoundException('Audit confirmation not found');
    const difference = dto.confirmedAmount - Number(conf.bookAmount ?? 0);
    const status = Math.abs(difference) < 0.01 ? 'RECONCILED' : 'EXCEPTION';
    return prisma.auditConfirmation.update({
      where: { id },
      data: {
        confirmedAmount: dto.confirmedAmount,
        difference,
        responseDate: dto.responseDate ? new Date(dto.responseDate) : new Date(),
        status,
        notes: dto.notes,
      },
    });
  }

  // ── PERIOD CERTIFICATION ──────────────────────────────────

  async listPeriodCertifications(tenantId: string, period?: string) {
    return prisma.periodCertification.findMany({
      where: { tenantId, ...(period && { period }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPeriodCertification(tenantId: string, dto: {
    period: string; certifierRole: string; certifierId: string; certifierName: string;
  }) {
    const orgId = (await prisma.organization.findFirst({ where: { tenantId } }))?.id ?? 'org-system-default';
    // Check not already certified
    const existing = await prisma.periodCertification.findFirst({
      where: { tenantId, period: dto.period, certifierRole: dto.certifierRole, status: 'CERTIFIED' },
    });
    if (existing) throw new BadRequestException('Period already certified by this role');
    return prisma.periodCertification.create({
      data: { tenantId, orgId, ...dto, status: 'PENDING' },
    });
  }

  async certifyPeriod(tenantId: string, id: string, dto: {
    statement: string; ipAddress?: string;
  }) {
    const cert = await prisma.periodCertification.findFirst({ where: { id, tenantId } });
    if (!cert) throw new NotFoundException('Period certification not found');
    if (cert.status !== 'PENDING') throw new BadRequestException('Certification is not pending');
    return prisma.periodCertification.update({
      where: { id },
      data: { status: 'CERTIFIED', statement: dto.statement, ipAddress: dto.ipAddress, certifiedAt: new Date() },
    });
  }

  async rejectPeriodCertification(tenantId: string, id: string, notes: string) {
    const cert = await prisma.periodCertification.findFirst({ where: { id, tenantId } });
    if (!cert) throw new NotFoundException('Period certification not found');
    return prisma.periodCertification.update({ where: { id }, data: { status: 'REJECTED', notes } });
  }
}

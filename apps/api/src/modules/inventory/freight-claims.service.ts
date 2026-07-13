import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class FreightClaimsService {
  // ── Damage Reports ────────────────────────────────────────────────────────

  async createDamageReport(tenantId: string, userId: string, dto: {
    shipmentId?: string; purchaseOrderId?: string; carrierId?: string; warehouseId?: string;
    discoveredAt: Date; severity?: string; description: string; affectedSkus?: string;
    quantityDamaged?: number; estimatedLoss?: number; currency?: string;
    photoUrls?: string; notes?: string;
  }) {
    const count = await prisma.cargoDamageReport.count({ where: { tenantId } });
    const reportNumber = `CDR-${String(count + 1).padStart(6, '0')}`;
    return prisma.cargoDamageReport.create({
      data: {
        tenantId, reportNumber,
        shipmentId: dto.shipmentId, purchaseOrderId: dto.purchaseOrderId,
        carrierId: dto.carrierId, warehouseId: dto.warehouseId,
        reportedById: userId, discoveredAt: dto.discoveredAt,
        severity: (dto.severity as any) ?? 'MINOR',
        description: dto.description, affectedSkus: dto.affectedSkus,
        quantityDamaged: dto.quantityDamaged != null ? dto.quantityDamaged : undefined,
        estimatedLoss: dto.estimatedLoss != null ? dto.estimatedLoss : undefined,
        currency: dto.currency ?? 'USD',
        photoUrls: dto.photoUrls, notes: dto.notes,
      },
    });
  }

  async listDamageReports(tenantId: string, params: { status?: string; carrierId?: string; skip?: number; take?: number }) {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.carrierId) where.carrierId = params.carrierId;
    const [items, total] = await Promise.all([
      prisma.cargoDamageReport.findMany({ where, skip: params.skip ?? 0, take: params.take ?? 20, orderBy: { createdAt: 'desc' } }),
      prisma.cargoDamageReport.count({ where }),
    ]);
    return { items, total };
  }

  async getDamageReport(tenantId: string, id: string) {
    const report = await prisma.cargoDamageReport.findFirst({ where: { tenantId, id } });
    if (!report) throw new NotFoundException('Damage report not found');
    return report;
  }

  async submitDamageReport(tenantId: string, id: string) {
    const report = await prisma.cargoDamageReport.findFirst({ where: { tenantId, id } });
    if (!report) throw new NotFoundException('Damage report not found');
    if (report.status !== 'DRAFT') throw new BadRequestException('Only DRAFT reports can be submitted');
    return prisma.cargoDamageReport.update({ where: { id }, data: { status: 'SUBMITTED' } });
  }

  async reviewDamageReport(tenantId: string, id: string, userId: string, decision: 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED') {
    const report = await prisma.cargoDamageReport.findFirst({ where: { tenantId, id } });
    if (!report) throw new NotFoundException('Damage report not found');
    return prisma.cargoDamageReport.update({
      where: { id },
      data: { status: decision, reviewedById: userId, reviewedAt: new Date() },
    });
  }

  // ── Freight Claims ────────────────────────────────────────────────────────

  async fileClaim(tenantId: string, userId: string, dto: {
    damageReportId: string; carrierId: string; claimType: string;
    claimedAmount: number; currency?: string; dueDate?: Date; notes?: string;
  }) {
    const report = await prisma.cargoDamageReport.findFirst({ where: { tenantId, id: dto.damageReportId } });
    if (!report) throw new NotFoundException('Damage report not found');
    const existing = await prisma.freightClaim.findUnique({ where: { damageReportId: dto.damageReportId } });
    if (existing) throw new BadRequestException('A claim already exists for this damage report');
    if (dto.claimedAmount <= 0) throw new BadRequestException('Claimed amount must be positive');
    const count = await prisma.freightClaim.count({ where: { tenantId } });
    const claimNumber = `FC-${String(count + 1).padStart(6, '0')}`;
    const claim = await prisma.freightClaim.create({
      data: {
        tenantId, claimNumber, damageReportId: dto.damageReportId,
        carrierId: dto.carrierId, claimType: dto.claimType as any,
        status: 'DRAFT', claimedAmount: dto.claimedAmount,
        currency: dto.currency ?? 'USD', filedById: userId,
        dueDate: dto.dueDate, notes: dto.notes,
      },
    });
    await prisma.cargoDamageReport.update({ where: { id: dto.damageReportId }, data: { status: 'CLAIM_FILED' } });
    return claim;
  }

  async listClaims(tenantId: string, params: { status?: string; claimType?: string; carrierId?: string; skip?: number; take?: number }) {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.claimType) where.claimType = params.claimType;
    if (params.carrierId) where.carrierId = params.carrierId;
    const [items, total] = await Promise.all([
      prisma.freightClaim.findMany({ where, skip: params.skip ?? 0, take: params.take ?? 20, orderBy: { createdAt: 'desc' } }),
      prisma.freightClaim.count({ where }),
    ]);
    return { items, total };
  }

  async getClaim(tenantId: string, id: string) {
    const claim = await prisma.freightClaim.findFirst({ where: { tenantId, id } });
    if (!claim) throw new NotFoundException('Freight claim not found');
    return claim;
  }

  async updateClaimStatus(tenantId: string, id: string, userId: string, dto: {
    status: string; carrierRefNumber?: string; settlementAmount?: number;
    settlementDate?: Date; rejectionReason?: string;
  }) {
    const claim = await prisma.freightClaim.findFirst({ where: { tenantId, id } });
    if (!claim) throw new NotFoundException('Freight claim not found');

    const transitions: Record<string, string[]> = {
      DRAFT: ['FILED'],
      FILED: ['ACKNOWLEDGED', 'CLOSED'],
      ACKNOWLEDGED: ['UNDER_INVESTIGATION', 'CLOSED'],
      UNDER_INVESTIGATION: ['SETTLEMENT_OFFERED', 'REJECTED', 'CLOSED'],
      SETTLEMENT_OFFERED: ['ACCEPTED', 'REJECTED'],
      ACCEPTED: ['CLOSED'],
      REJECTED: ['CLOSED'],
    };
    const allowed = transitions[claim.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${claim.status} to ${dto.status}`);
    }

    const updateData: any = { status: dto.status };
    if (dto.status === 'FILED') { updateData.filedAt = new Date(); updateData.filedById = userId; }
    if (dto.carrierRefNumber) updateData.carrierRefNumber = dto.carrierRefNumber;
    if (dto.status === 'ACCEPTED' || dto.status === 'SETTLEMENT_OFFERED') {
      if (dto.settlementAmount != null) updateData.settlementAmount = dto.settlementAmount;
      if (dto.settlementDate) updateData.settlementDate = dto.settlementDate;
      updateData.acceptedById = userId;
    }
    if (dto.status === 'REJECTED') updateData.rejectionReason = dto.rejectionReason;

    await this.addClaimEvent(tenantId, id, userId, `Status changed to ${dto.status}`, dto.status);
    return prisma.freightClaim.update({ where: { id }, data: updateData });
  }

  // ── Claim Events ──────────────────────────────────────────────────────────

  async addClaimEvent(tenantId: string, claimId: string, userId: string, description: string, eventType: string) {
    return prisma.freightClaimEvent.create({
      data: { tenantId, claimId, eventType, description, recordedById: userId },
    });
  }

  async listClaimEvents(tenantId: string, claimId: string) {
    return prisma.freightClaimEvent.findMany({
      where: { tenantId, claimId },
      orderBy: { occurredAt: 'asc' },
    });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [
      totalReports, draftReports, submittedReports,
      totalClaims, draftClaims, filedClaims, underInvestigation, settlementOffered,
    ] = await Promise.all([
      prisma.cargoDamageReport.count({ where: { tenantId } }),
      prisma.cargoDamageReport.count({ where: { tenantId, status: 'DRAFT' } }),
      prisma.cargoDamageReport.count({ where: { tenantId, status: 'SUBMITTED' } }),
      prisma.freightClaim.count({ where: { tenantId } }),
      prisma.freightClaim.count({ where: { tenantId, status: 'DRAFT' } }),
      prisma.freightClaim.count({ where: { tenantId, status: 'FILED' } }),
      prisma.freightClaim.count({ where: { tenantId, status: 'UNDER_INVESTIGATION' } }),
      prisma.freightClaim.count({ where: { tenantId, status: 'SETTLEMENT_OFFERED' } }),
    ]);
    return { totalReports, draftReports, submittedReports, totalClaims, draftClaims, filedClaims, underInvestigation, settlementOffered };
  }
}

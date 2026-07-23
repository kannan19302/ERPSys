import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class SupplierRiskService {
  async getRiskProfiles(tenantId: string, params?: { riskCategory?: string; page?: number; limit?: number }) {
    const where: any = { tenantId, isActive: true };
    if (params?.riskCategory) where.riskCategory = params.riskCategory;
    const data = await prisma.supplierRiskProfile.findMany({ where, include: { factors: true, alerts: { where: { status: 'OPEN' } }, diversity: true }, orderBy: { overallRiskScore: 'desc' }, skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0, take: params?.limit || 20 });
    const total = await prisma.supplierRiskProfile.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async getRiskProfileById(tenantId: string, id: string) {
    const profile = await prisma.supplierRiskProfile.findFirst({ where: { id, tenantId }, include: { factors: true, alerts: { orderBy: { createdAt: 'desc' }, take: 20 }, diversity: true } });
    if (!profile) throw new NotFoundException('Supplier risk profile not found');
    return profile;
  }

  async getRiskProfileByVendor(tenantId: string, vendorId: string) {
    let profile = await prisma.supplierRiskProfile.findFirst({ where: { tenantId, vendorId }, include: { factors: true, alerts: { where: { status: 'OPEN' } }, diversity: true } });
    if (!profile) {
      profile = await prisma.supplierRiskProfile.create({ data: { tenantId, vendorId, overallRiskScore: 50, riskCategory: 'MEDIUM' }, include: { factors: true, alerts: true, diversity: true } });
    }
    return profile;
  }

  async createRiskProfile(tenantId: string, dto: any) {
    return prisma.$transaction(async (tx) => {
      const scores = [dto.financialHealth, dto.geopoliticalRisk, dto.operationalRisk, dto.complianceRisk, dto.qualityRisk, dto.concentrationRisk].filter((s): s is number => s != null);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;
      const riskCategory = avgScore >= 70 ? 'HIGH' : avgScore >= 40 ? 'MEDIUM' : 'LOW';
      const profile = await tx.supplierRiskProfile.create({
        data: {
          tenantId, vendorId: dto.vendorId, vendorName: dto.vendorName || null,
          overallRiskScore: avgScore, riskCategory, financialHealth: dto.financialHealth ? new Prisma.Decimal(dto.financialHealth) : null,
          geopoliticalRisk: dto.geopoliticalRisk ? new Prisma.Decimal(dto.geopoliticalRisk) : null,
          operationalRisk: dto.operationalRisk ? new Prisma.Decimal(dto.operationalRisk) : null,
          complianceRisk: dto.complianceRisk ? new Prisma.Decimal(dto.complianceRisk) : null,
          qualityRisk: dto.qualityRisk ? new Prisma.Decimal(dto.qualityRisk) : null,
          concentrationRisk: dto.concentrationRisk ? new Prisma.Decimal(dto.concentrationRisk) : null,
        },
      });
      if (dto.factors?.length) {
        await tx.supplierRiskFactor.createMany({
          data: dto.factors.map((f: any) => ({ tenantId, profileId: profile.id, factorType: f.factorType, factorName: f.factorName, score: new Prisma.Decimal(f.score), weight: f.weight ? new Prisma.Decimal(f.weight) : new Prisma.Decimal(1), trend: f.trend || 'STABLE', description: f.description || null })),
        });
      }
      return tx.supplierRiskProfile.findUnique({ where: { id: profile.id }, include: { factors: true } });
    });
  }

  async updateRiskProfile(tenantId: string, id: string, dto: any) {
    const profile = await prisma.supplierRiskProfile.findFirst({ where: { id, tenantId } });
    if (!profile) throw new NotFoundException('Risk profile not found');
    const scores = [dto.financialHealth ?? profile.financialHealth ? Number(profile.financialHealth) : null, dto.geopoliticalRisk ?? profile.geopoliticalRisk ? Number(profile.geopoliticalRisk) : null, dto.operationalRisk ?? profile.operationalRisk ? Number(profile.operationalRisk) : null, dto.complianceRisk ?? profile.complianceRisk ? Number(profile.complianceRisk) : null, dto.qualityRisk ?? profile.qualityRisk ? Number(profile.qualityRisk) : null, dto.concentrationRisk ?? profile.concentrationRisk ? Number(profile.concentrationRisk) : null].filter((s): s is number => s != null);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;
    return prisma.supplierRiskProfile.update({ where: { id }, data: { ...dto, overallRiskScore: avgScore, riskCategory: avgScore >= 70 ? 'HIGH' : avgScore >= 40 ? 'MEDIUM' : 'LOW' } });
  }

  async getRiskAlerts(tenantId: string, params?: { status?: string; severity?: string }) {
    const where: any = { tenantId, isActive: true };
    if (params?.status) where.status = params.status;
    if (params?.severity) where.severity = params.severity;
    return prisma.supplierRiskAlert.findMany({ where, include: { profile: true }, orderBy: { createdAt: 'desc' } });
  }

  async createRiskAlert(tenantId: string, dto: any) {
    const profile = await prisma.supplierRiskProfile.findFirst({ where: { id: dto.profileId, tenantId } });
    if (!profile) throw new NotFoundException('Risk profile not found');
    return prisma.supplierRiskAlert.create({ data: { tenantId, profileId: dto.profileId, alertType: dto.alertType, severity: dto.severity || 'MEDIUM', title: dto.title, description: dto.description || null, source: dto.source || null } });
  }

  async resolveRiskAlert(tenantId: string, id: string, resolution: string, userId?: string) {
    const alert = await prisma.supplierRiskAlert.findFirst({ where: { id, tenantId } });
    if (!alert) throw new NotFoundException('Risk alert not found');
    return prisma.supplierRiskAlert.update({ where: { id }, data: { status: 'RESOLVED', resolvedBy: userId, resolvedAt: new Date(), resolution } });
  }

  async getAlternativeSourcing(tenantId: string, productId?: string) {
    const where: any = { tenantId, isActive: true };
    if (productId) where.productId = productId;
    return prisma.alternativeSourcing.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createAlternativeSourcing(tenantId: string, dto: any) {
    return prisma.alternativeSourcing.create({ data: { tenantId, ...dto } });
  }

  async getSupplierDiversity(tenantId: string, diversityType?: string) {
    const where: any = { tenantId, isActive: true };
    if (diversityType) where.diversityType = diversityType;
    return prisma.supplierDiversity.findMany({ where, include: { profile: true }, orderBy: { createdAt: 'desc' } });
  }

  async createSupplierDiversity(tenantId: string, profileId: string, dto: any) {
    const profile = await prisma.supplierRiskProfile.findFirst({ where: { id: profileId, tenantId } });
    if (!profile) throw new NotFoundException('Risk profile not found');
    return prisma.supplierDiversity.create({
      data: { tenantId, profileId, diversityType: dto.diversityType, certificationBody: dto.certificationBody || null, certificationNumber: dto.certificationNumber || null, certificationDate: dto.certificationDate ? new Date(dto.certificationDate) : null, expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null, spendAmount: dto.spendAmount ? new Prisma.Decimal(dto.spendAmount) : null, fiscalYear: dto.fiscalYear || null },
    });
  }

  async getRiskHeatMap(tenantId: string) {
    const profiles = await prisma.supplierRiskProfile.findMany({ where: { tenantId, isActive: true }, include: { factors: true } });
    return {
      vendors: profiles.map(p => ({ vendorId: p.vendorId, vendorName: p.vendorName, overallRiskScore: p.overallRiskScore ? Number(p.overallRiskScore) : 50, riskCategory: p.riskCategory, financialHealth: p.financialHealth ? Number(p.financialHealth) : null, geopoliticalRisk: p.geopoliticalRisk ? Number(p.geopoliticalRisk) : null, operationalRisk: p.operationalRisk ? Number(p.operationalRisk) : null, complianceRisk: p.complianceRisk ? Number(p.complianceRisk) : null, qualityRisk: p.qualityRisk ? Number(p.qualityRisk) : null, concentrationRisk: p.concentrationRisk ? Number(p.concentrationRisk) : null })),
      summary: {
        total: profiles.length,
        high: profiles.filter(p => p.riskCategory === 'HIGH').length,
        medium: profiles.filter(p => p.riskCategory === 'MEDIUM').length,
        low: profiles.filter(p => p.riskCategory === 'LOW').length,
        averageScore: profiles.length ? Math.round(profiles.reduce((s, p) => s + Number(p.overallRiskScore || 50), 0) / profiles.length) : 0,
      },
    };
  }
}

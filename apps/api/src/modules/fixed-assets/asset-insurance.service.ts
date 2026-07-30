import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssetInsuranceService {
  async getPolicies(tenantId: string, assetId?: string) {
    const where: Prisma.FixedAssetInsurancePolicyWhereInput = { tenantId };
    if (assetId) where.assetId = assetId;
    return prisma.fixedAssetInsurancePolicy.findMany({
      where,
      orderBy: { startDate: "desc" },
    });
  }

  async getPolicyById(tenantId: string, id: string) {
    const policy = await prisma.fixedAssetInsurancePolicy.findFirst({
      where: { tenantId, id },
    });
    if (!policy) throw new NotFoundException("Insurance policy not found");
    return policy;
  }

  async createPolicy(
    tenantId: string,
    assetId: string,
    dto: {
      policyNo: string;
      insurer: string;
      coverageAmount: number;
      premiumAmount: number;
      startDate: string;
      endDate: string;
    },
  ) {
    const exists = await prisma.fixedAssetInsurancePolicy.findFirst({
      where: { tenantId, policyNo: dto.policyNo },
    });
    if (exists)
      throw new BadRequestException(`Policy "${dto.policyNo}" already exists`);
    return prisma.fixedAssetInsurancePolicy.create({
      data: {
        tenantId,
        assetId,
        policyNo: dto.policyNo,
        insurer: dto.insurer,
        coverageAmount: new Prisma.Decimal(dto.coverageAmount),
        premiumAmount: new Prisma.Decimal(dto.premiumAmount),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: "ACTIVE",
      },
    });
  }

  async updatePolicy(
    tenantId: string,
    id: string,
    dto: Partial<{
      coverageAmount: number;
      premiumAmount: number;
      endDate: string;
      status: string;
    }>,
  ) {
    await this.getPolicyById(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.coverageAmount !== undefined)
      data.coverageAmount = new Prisma.Decimal(dto.coverageAmount);
    if (dto.premiumAmount !== undefined)
      data.premiumAmount = new Prisma.Decimal(dto.premiumAmount);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.status !== undefined) data.status = dto.status;
    return prisma.fixedAssetInsurancePolicy.update({ where: { id }, data });
  }

  async expirePolicies(tenantId: string) {
    const now = new Date();
    const result = await prisma.fixedAssetInsurancePolicy.updateMany({
      where: { tenantId, endDate: { lte: now }, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });
    return { updated: result.count };
  }

  async getPolicyStats(tenantId: string) {
    const [active, expired, totalPremium, totalCoverage] = await Promise.all([
      prisma.fixedAssetInsurancePolicy.count({
        where: { tenantId, status: "ACTIVE" },
      }),
      prisma.fixedAssetInsurancePolicy.count({
        where: { tenantId, status: "EXPIRED" },
      }),
      prisma.fixedAssetInsurancePolicy.aggregate({
        where: { tenantId },
        _sum: { premiumAmount: true },
      }),
      prisma.fixedAssetInsurancePolicy.aggregate({
        where: { tenantId, status: "ACTIVE" },
        _sum: { coverageAmount: true },
      }),
    ]);
    return {
      activePolicies: active,
      expiredPolicies: expired,
      totalPremium: totalPremium._sum.premiumAmount || 0,
      activeCoverage: totalCoverage._sum.coverageAmount || 0,
    };
  }
}

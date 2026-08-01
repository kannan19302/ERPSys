import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssetWarrantyService {
  async getWarranties(tenantId: string, assetId?: string) {
    const where: Prisma.FixedAssetWarrantyWhereInput = { tenantId };
    if (assetId) where.assetId = assetId;
    return prisma.fixedAssetWarranty.findMany({
      where,
      include: { claims: true },
      orderBy: { startDate: "desc" },
    });
  }

  async getWarrantyById(tenantId: string, id: string) {
    const w = await prisma.fixedAssetWarranty.findFirst({
      where: { tenantId, id },
      include: { claims: true },
    });
    if (!w) throw new NotFoundException("Warranty not found");
    return w;
  }

  async createWarranty(
    tenantId: string,
    assetId: string,
    dto: {
      warrantyProvider: string;
      warrantyType?: string;
      startDate: string;
      endDate: string;
      coverageDetails?: string;
      contractValue?: number;
      claimPhone?: string;
      claimEmail?: string;
    },
  ) {
    return prisma.fixedAssetWarranty.create({
      data: {
        tenantId,
        assetId,
        ...dto,
        warrantyType: dto.warrantyType || "MANUFACTURER",
        status: "ACTIVE",
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        contractValue: dto.contractValue
          ? new Prisma.Decimal(dto.contractValue)
          : undefined,
      },
    });
  }

  async fileClaim(
    tenantId: string,
    warrantyId: string,
    dto: {
      claimDate: string;
      description: string;
      claimAmount: number;
    },
  ) {
    const w = await this.getWarrantyById(tenantId, warrantyId);
    const claim = await prisma.fixedAssetWarrantyClaim.create({
      data: {
        tenantId,
        warrantyId,
        claimDate: new Date(dto.claimDate),
        description: dto.description,
        claimAmount: new Prisma.Decimal(dto.claimAmount),
        status: "SUBMITTED",
      },
    });
    await prisma.fixedAssetWarranty.update({
      where: { id: warrantyId },
      data: { status: "CLAIMED" },
    });
    return claim;
  }

  async updateClaimStatus(
    tenantId: string,
    claimId: string,
    dto: {
      status: string;
      approvedAmount?: number;
      resolution?: string;
    },
  ) {
    const claim = await prisma.fixedAssetWarrantyClaim.findFirst({
      where: { tenantId, id: claimId },
    });
    if (!claim) throw new NotFoundException("Warranty claim not found");
    const data: Record<string, unknown> = { status: dto.status };
    if (dto.approvedAmount !== undefined)
      data.approvedAmount = new Prisma.Decimal(dto.approvedAmount);
    if (dto.resolution !== undefined) data.resolution = dto.resolution;
    if (dto.status === "APPROVED" || dto.status === "CLOSED")
      data.resolvedAt = new Date();
    return prisma.fixedAssetWarrantyClaim.update({
      where: { id: claimId },
      data,
    });
  }

  async expireWarranties(tenantId: string) {
    const now = new Date();
    const result = await prisma.fixedAssetWarranty.updateMany({
      where: { tenantId, endDate: { lte: now }, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });
    return { updated: result.count };
  }

  async getWarrantyClaims(tenantId: string, warrantyId?: string) {
    const where: Prisma.FixedAssetWarrantyClaimWhereInput = { tenantId };
    if (warrantyId) where.warrantyId = warrantyId;
    return prisma.fixedAssetWarrantyClaim.findMany({
      where,
      orderBy: { claimDate: "desc" },
    });
  }
}

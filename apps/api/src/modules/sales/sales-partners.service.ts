import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesPartnersService {
  async getPartners(tenantId: string, status?: string) {
    const where: Prisma.SalesPartnerWhereInput = { tenantId, deletedAt: null };
    if (status) where.status = status;
    return prisma.salesPartner.findMany({
      where,
      include: {
        tier: { select: { id: true, name: true, commissionRate: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPartnerById(tenantId: string, id: string) {
    const partner = await prisma.salesPartner.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { tier: true },
    });
    if (!partner) throw new NotFoundException("Partner not found");
    return partner;
  }

  async createPartner(
    tenantId: string,
    orgId: string,
    dto: any,
    createdBy: string,
  ) {
    if (dto.tierId) {
      const tier = await prisma.salesPartnerTier.findFirst({
        where: { id: dto.tierId, tenantId },
      });
      if (!tier) throw new NotFoundException("Partner tier not found");
    }

    const existing = await prisma.salesPartner.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });
    if (existing)
      throw new BadRequestException("A partner with this name already exists");

    const referralCode =
      dto.referralCode ||
      dto.name.substring(0, 4).toUpperCase().replace(/\s+/g, "") +
        "-" +
        Math.random().toString(36).substring(2, 8).toUpperCase();

    return prisma.salesPartner.create({
      data: {
        tenantId,
        orgId,
        tierId: dto.tierId || null,
        name: dto.name,
        email: dto.email || null,
        phone: dto.phone || null,
        website: dto.website || null,
        address: (dto.address || {}) as Prisma.InputJsonValue,
        commissionRate:
          dto.commissionRate != null
            ? new Prisma.Decimal(dto.commissionRate)
            : null,
        referralCode,
        status: dto.status || "ACTIVE",
        type: dto.type || "RESELLER",
        notes: dto.notes || null,
        createdBy,
      },
    });
  }

  async updatePartner(tenantId: string, id: string, dto: any) {
    const existing = await prisma.salesPartner.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Partner not found");

    if (dto.tierId) {
      const tier = await prisma.salesPartnerTier.findFirst({
        where: { id: dto.tierId, tenantId },
      });
      if (!tier) throw new NotFoundException("Partner tier not found");
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await prisma.salesPartner.findUnique({
        where: { tenantId_name: { tenantId, name: dto.name } },
      });
      if (duplicate)
        throw new BadRequestException(
          "A partner with this name already exists",
        );
    }

    const data: Prisma.SalesPartnerUpdateInput = {};
    if (dto.tierId !== undefined)
      data.tier = dto.tierId
        ? { connect: { id: dto.tierId } }
        : { disconnect: true };
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.address !== undefined)
      data.address = dto.address as Prisma.InputJsonValue;
    if (dto.commissionRate !== undefined)
      data.commissionRate = new Prisma.Decimal(dto.commissionRate);
    if (dto.referralCode !== undefined) data.referralCode = dto.referralCode;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return prisma.salesPartner.update({ where: { id }, data });
  }

  async deletePartner(tenantId: string, id: string) {
    const existing = await prisma.salesPartner.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Partner not found");
    return prisma.salesPartner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getPartnerDashboard(tenantId: string) {
    const [
      totalPartners,
      activePartners,
      inactivePartners,
      suspendedPartners,
      typeBreakdown,
      revenueAgg,
      commissionAgg,
      topPartners,
    ] = await Promise.all([
      prisma.salesPartner.count({ where: { tenantId, deletedAt: null } }),
      prisma.salesPartner.count({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.salesPartner.count({
        where: { tenantId, deletedAt: null, status: "INACTIVE" },
      }),
      prisma.salesPartner.count({
        where: { tenantId, deletedAt: null, status: "SUSPENDED" },
      }),
      prisma.salesPartner.groupBy({
        by: ["type"],
        where: { tenantId, deletedAt: null },
        _count: { id: true },
      }),
      prisma.salesPartner.aggregate({
        where: { tenantId, deletedAt: null },
        _sum: { totalRevenue: true },
      }),
      prisma.salesPartner.aggregate({
        where: { tenantId, deletedAt: null },
        _sum: { commissionEarned: true },
      }),
      prisma.salesPartner.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { totalRevenue: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          totalRevenue: true,
          commissionEarned: true,
        },
      }),
    ]);

    return {
      totalPartners,
      activePartners,
      inactivePartners,
      suspendedPartners,
      typeBreakdown: typeBreakdown.map((t) => ({
        type: t.type,
        count: t._count.id,
      })),
      totalRevenue: Number(revenueAgg._sum.totalRevenue || 0),
      totalCommissionEarned: Number(commissionAgg._sum.commissionEarned || 0),
      topPartners: topPartners.map((p) => ({
        ...p,
        totalRevenue: Number(p.totalRevenue),
        commissionEarned: Number(p.commissionEarned),
      })),
    };
  }

  async getTiers(tenantId: string) {
    return prisma.salesPartnerTier.findMany({
      where: { tenantId },
      include: {
        _count: { select: { partners: { where: { deletedAt: null } } } },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createTier(tenantId: string, orgId: string, dto: any) {
    return prisma.salesPartnerTier.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        description: dto.description || null,
        commissionRate: new Prisma.Decimal(dto.commissionRate),
        minRevenue:
          dto.minRevenue != null ? new Prisma.Decimal(dto.minRevenue) : null,
        benefits: (dto.benefits || {}) as Prisma.InputJsonValue,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateTier(tenantId: string, id: string, dto: any) {
    const existing = await prisma.salesPartnerTier.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Partner tier not found");

    const data: Prisma.SalesPartnerTierUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.commissionRate !== undefined)
      data.commissionRate = new Prisma.Decimal(dto.commissionRate);
    if (dto.minRevenue !== undefined)
      data.minRevenue =
        dto.minRevenue != null ? new Prisma.Decimal(dto.minRevenue) : null;
    if (dto.benefits !== undefined)
      data.benefits = dto.benefits as Prisma.InputJsonValue;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    return prisma.salesPartnerTier.update({ where: { id }, data });
  }

  async deleteTier(tenantId: string, id: string) {
    const existing = await prisma.salesPartnerTier.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Partner tier not found");

    const partnerCount = await prisma.salesPartner.count({
      where: { tierId: id, deletedAt: null },
    });
    if (partnerCount > 0) {
      throw new BadRequestException(
        `Cannot delete tier: ${partnerCount} partner(s) are currently assigned to this tier`,
      );
    }

    return prisma.salesPartnerTier.delete({ where: { id } });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class RealEstatePropertiesService {
  // ── Properties ──
  async getProperties(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.portfolioId) where.portfolioId = query.portfolioId;
    if (query.buildingId) where.buildingId = query.buildingId;
    if (query.city) where.city = query.city;
    if (query.search)
      where.name = { contains: query.search, mode: "insensitive" };
    if (query.featured !== undefined)
      where.featured = query.featured === "true";
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const orderBy: any = {};
    orderBy[query.sortBy || "createdAt"] = query.sortOrder || "desc";
    const [data, total] = await Promise.all([
      prisma.realEstateProperty.findMany({
        where,
        include: {
          portfolio: true,
          building: true,
          _count: { select: { units: true, leases: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.realEstateProperty.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getPropertyById(tenantId: string, id: string) {
    const prop = await prisma.realEstateProperty.findFirst({
      where: { tenantId, id },
      include: {
        portfolio: true,
        building: true,
        leases: { where: { status: "ACTIVE" } },
        tenants: { where: { status: "ACTIVE" } },
        maintenance: { take: 10, orderBy: { createdAt: "desc" } },
        valuations: { orderBy: { valuationDate: "desc" }, take: 5 },
        units: { where: { isActive: true } },
        commissionPlans: { where: { status: "ACTIVE" } },
      },
    });
    if (!prop) throw new NotFoundException("Property not found");
    return prop;
  }
  async createProperty(tenantId: string, data: any) {
    return prisma.realEstateProperty.create({
      data: { ...data, tenantId },
      include: { portfolio: true, building: true },
    });
  }
  async updateProperty(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateProperty.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Property not found");
    return prisma.realEstateProperty.update({
      where: { id },
      data,
      include: { portfolio: true, building: true },
    });
  }
  async deleteProperty(tenantId: string, id: string) {
    const existing = await prisma.realEstateProperty.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Property not found");
    return prisma.realEstateProperty.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async getPropertyStats(tenantId: string) {
    const [total, available, leased, byType, cities] = await Promise.all([
      prisma.realEstateProperty.count({ where: { tenantId, isActive: true } }),
      prisma.realEstateProperty.count({
        where: { tenantId, status: "AVAILABLE", isActive: true },
      }),
      prisma.realEstateProperty.count({
        where: { tenantId, status: "LEASED", isActive: true },
      }),
      prisma.realEstateProperty.groupBy({
        by: ["type"],
        where: { tenantId, isActive: true },
        _count: true,
      }),
      prisma.realEstateProperty.groupBy({
        by: ["city"],
        where: { tenantId, isActive: true, city: { not: null } },
        _count: true,
      }),
    ]);
    return { total, available, leased, byType, cities };
  }
  async bulkUpdateProperties(tenantId: string, ids: string[], data: any) {
    return prisma.realEstateProperty.updateMany({
      where: { tenantId, id: { in: ids } },
      data,
    });
  }
  async getPropertyMapData(tenantId: string) {
    return prisma.realEstateProperty.findMany({
      where: { tenantId, isActive: true, latitude: { not: null } },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        latitude: true,
        longitude: true,
        address: true,
      },
    });
  }

  // ── Portfolios ──
  async getPortfolios(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.type) where.type = query.type;
    if (query.search)
      where.name = { contains: query.search, mode: "insensitive" };
    const include = { _count: { select: { properties: true } } };
    const data = await prisma.realEstatePropertyPortfolio.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });
    return data;
  }
  async getPortfolioById(tenantId: string, id: string) {
    const portfolio = await prisma.realEstatePropertyPortfolio.findFirst({
      where: { tenantId, id },
      include: {
        properties: {
          where: { isActive: true },
          include: { _count: { select: { units: true, leases: true } } },
        },
      },
    });
    if (!portfolio) throw new NotFoundException("Portfolio not found");
    return portfolio;
  }
  async createPortfolio(tenantId: string, data: any) {
    return prisma.realEstatePropertyPortfolio.create({
      data: { ...data, tenantId },
      include: { _count: { select: { properties: true } } },
    });
  }
  async updatePortfolio(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstatePropertyPortfolio.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Portfolio not found");
    return prisma.realEstatePropertyPortfolio.update({ where: { id }, data });
  }
  async deletePortfolio(tenantId: string, id: string) {
    const existing = await prisma.realEstatePropertyPortfolio.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Portfolio not found");
    const count = await prisma.realEstateProperty.count({
      where: { portfolioId: id },
    });
    if (count > 0)
      throw new BadRequestException(
        "Cannot delete portfolio with assigned properties",
      );
    return prisma.realEstatePropertyPortfolio.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async getPortfolioAnalytics(tenantId: string, id: string) {
    const portfolio = await prisma.realEstatePropertyPortfolio.findFirst({
      where: { tenantId, id },
      include: {
        properties: {
          where: { isActive: true },
          include: {
            valuations: { orderBy: { valuationDate: "desc" }, take: 1 },
            leases: {
              where: { status: "ACTIVE" },
              select: { rentAmount: true },
            },
          },
        },
      },
    });
    if (!portfolio) throw new NotFoundException("Portfolio not found");
    const totalValue = portfolio.properties.reduce(
      (sum, p) => sum + Number(p.valuations[0]?.appraisedValue || 0),
      0,
    );
    const totalRent = portfolio.properties.reduce(
      (sum, p) => sum + p.leases.reduce((s, l) => s + Number(l.rentAmount), 0),
      0,
    );
    const occupancy =
      (portfolio.properties.filter((p) => p.leases.length > 0).length /
        (portfolio.properties.length || 1)) *
      100;
    return {
      ...portfolio,
      analytics: {
        totalValue,
        totalRent,
        occupancy: Math.round(occupancy * 100) / 100,
        propertyCount: portfolio.properties.length,
      },
    };
  }

  // ── Buildings ──
  async getBuildings(tenantId: string) {
    return prisma.realEstatePropertyBuilding.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { properties: true } } },
      orderBy: { name: "asc" },
    });
  }
  async getBuildingById(tenantId: string, id: string) {
    const building = await prisma.realEstatePropertyBuilding.findFirst({
      where: { tenantId, id },
      include: { properties: { where: { isActive: true } } },
    });
    if (!building) throw new NotFoundException("Building not found");
    return building;
  }
  async createBuilding(tenantId: string, data: any) {
    return prisma.realEstatePropertyBuilding.create({
      data: { ...data, tenantId },
    });
  }
  async updateBuilding(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstatePropertyBuilding.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Building not found");
    return prisma.realEstatePropertyBuilding.update({ where: { id }, data });
  }
  async deleteBuilding(tenantId: string, id: string) {
    const existing = await prisma.realEstatePropertyBuilding.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Building not found");
    return prisma.realEstatePropertyBuilding.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Units ──
  async getUnits(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    if (query.minRent) where.rentAmount = { gte: parseFloat(query.minRent) };
    if (query.maxRent)
      where.rentAmount = {
        ...where.rentAmount,
        lte: parseFloat(query.maxRent),
      };
    if (query.bedrooms) where.bedrooms = parseInt(query.bedrooms);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.realEstatePropertyUnit.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, address: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.realEstatePropertyUnit.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getUnitById(tenantId: string, id: string) {
    const unit = await prisma.realEstatePropertyUnit.findFirst({
      where: { tenantId, id },
      include: { property: true },
    });
    if (!unit) throw new NotFoundException("Unit not found");
    return unit;
  }
  async createUnit(tenantId: string, data: any) {
    return prisma.realEstatePropertyUnit.create({
      data: { ...data, tenantId },
      include: { property: true },
    });
  }
  async updateUnit(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstatePropertyUnit.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Unit not found");
    return prisma.realEstatePropertyUnit.update({ where: { id }, data });
  }
  async deleteUnit(tenantId: string, id: string) {
    const existing = await prisma.realEstatePropertyUnit.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Unit not found");
    return prisma.realEstatePropertyUnit.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async bulkUpdateUnits(tenantId: string, ids: string[], data: any) {
    return prisma.realEstatePropertyUnit.updateMany({
      where: { tenantId, id: { in: ids } },
      data,
    });
  }
  async getUnitAvailability(tenantId: string, propertyId?: string) {
    const where: any = { tenantId };
    if (propertyId) where.propertyId = propertyId;
    const units = await prisma.realEstatePropertyUnit.groupBy({
      by: ["status"],
      where,
      _count: true,
    });
    return units;
  }
}

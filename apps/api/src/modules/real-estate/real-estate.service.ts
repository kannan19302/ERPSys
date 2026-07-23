import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class RealEstateService {
  // ── Properties ──
  async getProperties(tenantId: string) {
    return prisma.realEstateProperty.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  async getPropertyById(tenantId: string, id: string) {
    return prisma.realEstateProperty.findFirst({
      where: { tenantId, id },
      include: { leases: true, maintenance: true, tenants: true, children: true },
    });
  }
  async createProperty(tenantId: string, data: any) {
    return prisma.realEstateProperty.create({ data: { ...data, tenantId } });
  }

  // ── Leases ──
  async getLeases(tenantId: string) {
    return prisma.realEstateLease.findMany({
      where: { tenantId },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async getLeaseById(tenantId: string, id: string) {
    return prisma.realEstateLease.findFirst({ where: { tenantId, id }, include: { property: true } });
  }
  async createLease(tenantId: string, data: any) {
    return prisma.realEstateLease.create({ data: { ...data, tenantId }, include: { property: true } });
  }

  // ── Tenants ──
  async getTenants(tenantId: string) {
    return prisma.realEstateTenant.findMany({
      where: { tenantId },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Maintenance Work Orders ──
  async getMaintenances(tenantId: string) {
    return prisma.realEstateMaintenanceWorkOrder.findMany({
      where: { tenantId },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async createMaintenance(tenantId: string, data: any) {
    return prisma.realEstateMaintenanceWorkOrder.create({
      data: { ...data, tenantId },
      include: { property: true },
    });
  }

  // ── Commissions ──
  async getCommissions(tenantId: string) {
    return prisma.realEstateCommission.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  async createCommission(tenantId: string, data: any) {
    return prisma.realEstateCommission.create({ data: { ...data, tenantId } });
  }
}

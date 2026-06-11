import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class RealEstateService {
  async getProperties(tenantId: string) {
    return prisma.property.findMany({
      where: { tenantId },
      include: { parent: true },
      orderBy: { name: 'asc' },
    });
  }

  async createProperty(
    tenantId: string,
    dto: { name: string; type: string; portfolio: string; address: string; parentId?: string }
  ) {
    return prisma.property.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type,
        portfolio: dto.portfolio,
        address: JSON.parse(dto.address),
        parentId: dto.parentId,
      },
    });
  }

  async getLeases(tenantId: string) {
    return prisma.lease.findMany({
      where: { tenantId },
      include: { property: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async createLease(
    tenantId: string,
    dto: { propertyId: string; tenantName: string; startDate: string; endDate: string; rentAmount: number; securityDeposit: number; billingFrequency: string }
  ) {
    return prisma.lease.create({
      data: {
        tenantId,
        propertyId: dto.propertyId,
        tenantName: dto.tenantName,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        rentAmount: dto.rentAmount,
        securityDeposit: dto.securityDeposit,
        billingFrequency: dto.billingFrequency,
        status: 'ACTIVE',
      },
    });
  }

  async getPropertyMaintenances(tenantId: string) {
    return prisma.propertyMaintenance.findMany({
      where: { tenantId },
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPropertyMaintenance(
    tenantId: string,
    dto: { propertyId: string; description: string; vendorId?: string; cost?: number }
  ) {
    return prisma.propertyMaintenance.create({
      data: {
        tenantId,
        propertyId: dto.propertyId,
        description: dto.description,
        vendorId: dto.vendorId,
        cost: dto.cost ?? 0,
        status: 'OPEN',
      },
    });
  }

  async getAgentCommissions(tenantId: string) {
    return prisma.agentCommission.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAgentCommission(
    tenantId: string,
    dto: { agentId: string; amount: number; splitRatio: number; generalLedgerRef: string }
  ) {
    return prisma.agentCommission.create({
      data: {
        tenantId,
        agentId: dto.agentId,
        amount: dto.amount,
        splitRatio: dto.splitRatio,
        generalLedgerRef: dto.generalLedgerRef,
        status: 'PENDING',
      },
    });
  }
}

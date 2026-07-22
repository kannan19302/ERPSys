import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesContractsService {
  async getContracts(tenantId: string, status?: string) {
    const where: Prisma.ContractWhereInput = {
      tenantId,
      type: "SALES",
      deletedAt: null,
    };
    if (status) where.status = status;
    const contracts = await prisma.contract.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
    return contracts.map((c: any) => ({
      id: c.id,
      contractNumber: c.contractNumber,
      title: c.title,
      status: c.status,
      value: Number(c.value),
      currency: c.currency,
      startDate: c.startDate,
      endDate: c.endDate,
      autoRenew: c.autoRenew,
      customerName: c.customer?.name || null,
    }));
  }

  async getContractById(tenantId: string, id: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, tenantId, type: "SALES", deletedAt: null },
      include: {
        customer: true,
        lineItems: true,
        billingMilestones: { orderBy: { dueDate: "asc" } },
        salesOrders: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!contract) throw new NotFoundException("Sales contract not found");
    return contract;
  }

  async createContract(
    tenantId: string,
    orgId: string,
    dto: any,
    createdBy: string,
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org)
        throw new BadRequestException("No Organization found for this Tenant.");
      resolvedOrgId = org.id;
    }
    const existing = await prisma.contract.findFirst({
      where: { tenantId, contractNumber: dto.contractNumber },
    });
    if (existing)
      throw new BadRequestException(
        `Contract number ${dto.contractNumber} already exists.`,
      );
    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    return prisma.contract.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        contractNumber: dto.contractNumber,
        title: dto.title,
        customerId: dto.customerId,
        type: dto.type || "SALES",
        value: new Prisma.Decimal(dto.value),
        currency: dto.currency || "USD",
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        renewalDate: new Date(dto.endDate),
        autoRenew: dto.autoRenew || false,
        renewalTermMonths: dto.renewalTermMonths || null,
        terms: dto.terms || null,
        ownerId: createdBy,
        status: "DRAFT",
      },
    });
  }

  async updateContract(tenantId: string, id: string, dto: any) {
    const contract = await prisma.contract.findFirst({
      where: { id, tenantId, type: "SALES", deletedAt: null },
    });
    if (!contract) throw new NotFoundException("Sales contract not found");

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.value !== undefined)
      updateData.value = new Prisma.Decimal(dto.value);
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.startDate !== undefined)
      updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.autoRenew !== undefined) updateData.autoRenew = dto.autoRenew;
    if (dto.renewalTermMonths !== undefined)
      updateData.renewalTermMonths = dto.renewalTermMonths;
    if (dto.terms !== undefined) updateData.terms = dto.terms;
    if (dto.ownerId !== undefined) updateData.ownerId = dto.ownerId;
    if (dto.customerId !== undefined) updateData.customerId = dto.customerId;

    return prisma.contract.update({ where: { id }, data: updateData });
  }

  async updateContractStatus(
    tenantId: string,
    id: string,
    status: string,
    userId: string,
  ) {
    const contract = await prisma.contract.findFirst({
      where: { id, tenantId, type: "SALES", deletedAt: null },
    });
    if (!contract) throw new NotFoundException("Sales contract not found");
    return prisma.contract.update({
      where: { id },
      data: {
        status,
        ...(status === "ACTIVE"
          ? { approvalStatus: "APPROVED", approverId: userId }
          : {}),
      },
    });
  }

  async renewContract(tenantId: string, id: string, userId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, tenantId, type: "SALES", deletedAt: null },
    });
    if (!contract) throw new NotFoundException("Sales contract not found");
    if (!contract.autoRenew)
      throw new BadRequestException(
        "Contract does not have auto-renew enabled",
      );
    if (!contract.renewalTermMonths)
      throw new BadRequestException("Contract has no renewal term months set");

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newStart = new Date(contract.endDate);
      newStart.setDate(newStart.getDate() + 1);
      const newEnd = new Date(newStart);
      newEnd.setMonth(newEnd.getMonth() + contract.renewalTermMonths!);

      const newContract = await tx.contract.create({
        data: {
          tenantId: contract.tenantId,
          orgId: contract.orgId,
          contractNumber: `${contract.contractNumber}-R${Math.floor(Math.random() * 1000)}`,
          title: contract.title,
          customerId: contract.customerId,
          type: contract.type,
          value: contract.value,
          currency: contract.currency,
          startDate: newStart,
          endDate: newEnd,
          renewalDate: newEnd,
          autoRenew: contract.autoRenew,
          renewalTermMonths: contract.renewalTermMonths,
          terms: contract.terms,
          ownerId: userId,
          status: "ACTIVE",
          renewedFromId: contract.id,
        },
      });
      await tx.contract.update({
        where: { id: contract.id },
        data: { status: "RENEWED" },
      });
      return newContract;
    });
  }

  async deleteContract(tenantId: string, id: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, tenantId, type: "SALES", deletedAt: null },
    });
    if (!contract) throw new NotFoundException("Sales contract not found");
    return prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getMilestones(tenantId: string, contractId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, tenantId, deletedAt: null },
    });
    if (!contract) throw new NotFoundException("Contract not found");
    return prisma.contractBillingMilestone.findMany({
      where: { tenantId, contractId },
      orderBy: { dueDate: "asc" },
    });
  }

  async updateMilestoneStatus(tenantId: string, id: string, status: string) {
    const milestone = await prisma.contractBillingMilestone.findFirst({
      where: { id, tenantId },
    });
    if (!milestone) throw new NotFoundException("Billing milestone not found");
    return prisma.contractBillingMilestone.update({
      where: { id },
      data: { status },
    });
  }

  async getContractDashboard(tenantId: string) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const [active, expiringSoon, expired, valueAgg] = await Promise.all([
      prisma.contract.count({
        where: { tenantId, type: "SALES", status: "ACTIVE", deletedAt: null },
      }),
      prisma.contract.count({
        where: {
          tenantId,
          type: "SALES",
          deletedAt: null,
          status: "ACTIVE",
          endDate: { lte: thirtyDaysFromNow, gte: new Date() },
        },
      }),
      prisma.contract.count({
        where: { tenantId, type: "SALES", status: "EXPIRED", deletedAt: null },
      }),
      prisma.contract.aggregate({
        where: { tenantId, type: "SALES", status: "ACTIVE", deletedAt: null },
        _sum: { value: true },
      }),
    ]);
    return {
      totalActive: active,
      expiringSoon,
      expired,
      totalValue: Number(valueAgg._sum.value || 0),
    };
  }
}

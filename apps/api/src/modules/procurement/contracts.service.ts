import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ContractsService {

  async getContracts(tenantId: string, vendorId?: string) {
    return prisma.blanketPurchaseAgreement.findMany({
      where: {
        tenantId,
        ...(vendorId ? { vendorId } : {}),
        deletedAt: null,
      },
      include: { vendor: true, lineItems: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async getContractCompliance(tenantId: string, contractId: string) {
    const agreement = await prisma.blanketPurchaseAgreement.findFirst({
      where: { id: contractId, tenantId, deletedAt: null },
      include: { vendor: true, lineItems: true, purchaseOrders: true },
    });
    if (!agreement) throw new NotFoundException('Contract not found');

    const now = new Date();
    const endDate = new Date(agreement.endDate);
    const isActive = now >= new Date(agreement.startDate) && now <= endDate;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const totalContractValue = Number(agreement.agreementLimit);
    const releasedAmount = Number(agreement.releasedAmount);
    const utilizationPct = totalContractValue > 0 ? (releasedAmount / totalContractValue) * 100 : 0;

    const itemCompliance = (agreement.lineItems || []).map((item) => ({
      itemId: item.id,
      productId: item.productId,
      description: item.description,
      committedQty: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));

    const alerts: string[] = [];
    if (!isActive && now > endDate) alerts.push('Contract has expired');
    if (daysRemaining > 0 && daysRemaining < 30) alerts.push('Contract expiring within 30 days');
    if (utilizationPct > 90) alerts.push('Contract utilization above 90%');
    if (utilizationPct < 30 && daysRemaining < 90) alerts.push('Low utilization with less than 90 days remaining');

    return {
      contractId,
      vendorName: agreement.vendor?.name,
      status: isActive ? 'ACTIVE' : (now < new Date(agreement.startDate) ? 'FUTURE' : 'EXPIRED'),
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      daysRemaining,
      totalContractValue,
      releasedAmount,
      remainingValue: Math.round((totalContractValue - releasedAmount) * 100) / 100,
      utilizationPct: Math.round(utilizationPct * 10) / 10,
      linkedPOs: agreement.purchaseOrders?.length || 0,
      itemCompliance,
      alerts,
    };
  }

  async getExpiringContracts(tenantId: string, withinDays = 60) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);

    const contracts = await prisma.blanketPurchaseAgreement.findMany({
      where: {
        tenantId,
        deletedAt: null,
        endDate: { lte: cutoff, gte: new Date() },
        status: { not: 'TERMINATED' },
      },
      include: { vendor: true },
      orderBy: { endDate: 'asc' },
    });

    return contracts.map((c) => ({
      id: c.id,
      agreementNumber: c.agreementNumber,
      vendorName: c.vendor?.name,
      endDate: c.endDate,
      daysRemaining: Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      agreementLimit: Number(c.agreementLimit),
      releasedAmount: Number(c.releasedAmount),
    }));
  }
}

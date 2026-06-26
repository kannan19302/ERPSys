import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class LeaseAccountingService {

  async calculateLeaseSchedule(tenantId: string, leaseId: string, discountRate = 0.05) {
    const lease = await prisma.lease.findFirst({
      where: { id: leaseId, tenantId }, include: { property: true },
    });
    if (!lease) throw new NotFoundException('Lease not found');

    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);
    const monthlyRent = Number(lease.rentAmount);
    const totalMonths = Math.max(1,
      (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1);

    const monthlyRate = discountRate / 12;
    let pvTotal = 0;
    for (let m = 1; m <= totalMonths; m++) {
      pvTotal += monthlyRent / Math.pow(1 + monthlyRate, m);
    }

    let liabilityBalance = pvTotal;
    let rouAssetBalance = pvTotal;
    const monthlyAmort = pvTotal / totalMonths;
    const schedule: Array<{ month: number; date: string; payment: number; interest: number; amortization: number; liabilityBalance: number; rouAssetBalance: number }> = [];

    for (let m = 1; m <= totalMonths; m++) {
      const d = new Date(startDate); d.setMonth(d.getMonth() + m - 1);
      const interest = Math.round(liabilityBalance * monthlyRate * 100) / 100;
      liabilityBalance = Math.max(0, liabilityBalance - (monthlyRent - interest));
      rouAssetBalance = Math.max(0, rouAssetBalance - monthlyAmort);

      schedule.push({
        month: m, date: d.toISOString().slice(0, 10), payment: monthlyRent,
        interest, amortization: Math.round(monthlyAmort * 100) / 100,
        liabilityBalance: Math.round(liabilityBalance * 100) / 100,
        rouAssetBalance: Math.round(rouAssetBalance * 100) / 100,
      });
    }

    return {
      leaseId, propertyName: lease.property?.name || 'Unknown',
      classification: totalMonths > 12 ? 'FINANCE_LEASE' : 'OPERATING_LEASE',
      totalMonths, monthlyPayment: monthlyRent, discountRate,
      initialRouAsset: Math.round(pvTotal * 100) / 100,
      initialLeaseLiability: Math.round(pvTotal * 100) / 100,
      totalPayments: Math.round(monthlyRent * totalMonths * 100) / 100,
      schedule,
    };
  }

  async getPortfolioSummary(tenantId: string) {
    const properties = await prisma.property.findMany({
      where: { tenantId }, include: { leases: true },
    });

    let totalRentIncome = 0;
    let vacantUnits = 0;
    let occupiedUnits = 0;

    for (const prop of properties) {
      const activeLeases = prop.leases.filter(
        (l) => new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date(),
      );
      if (activeLeases.length > 0) {
        occupiedUnits++;
        totalRentIncome += activeLeases.reduce((s, l) => s + Number(l.rentAmount), 0);
      } else {
        vacantUnits++;
      }
    }

    return {
      totalProperties: properties.length, occupiedUnits, vacantUnits,
      occupancyRate: properties.length > 0 ? Math.round((occupiedUnits / properties.length) * 1000) / 10 : 0,
      monthlyRentIncome: Math.round(totalRentIncome * 100) / 100,
      annualRentIncome: Math.round(totalRentIncome * 12 * 100) / 100,
    };
  }

  async getRentRoll(tenantId: string) {
    const leases = await prisma.lease.findMany({
      where: { tenantId, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
      include: { property: true },
    });

    return leases.map((l) => ({
      leaseId: l.id, propertyName: l.property?.name || 'Unknown',
      tenantName: l.tenantName, rentAmount: Number(l.rentAmount),
      leaseStart: l.startDate, leaseEnd: l.endDate,
      daysRemaining: Math.max(0, Math.ceil((new Date(l.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      status: l.status,
    }));
  }

  async getExpiringLeases(tenantId: string, withinDays = 90) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + withinDays);

    const leases = await prisma.lease.findMany({
      where: { tenantId, endDate: { lte: cutoff, gte: new Date() } },
      include: { property: true },
      orderBy: { endDate: 'asc' },
    });

    return leases.map((l) => ({
      leaseId: l.id, propertyName: l.property?.name,
      rentAmount: Number(l.rentAmount), endDate: l.endDate,
      daysRemaining: Math.ceil((new Date(l.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    }));
  }
}

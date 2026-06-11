import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class AnalyticsService {
  async getDashboards(tenantId: string) {
    return prisma.dashboard.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardById(tenantId: string, id: string) {
    return prisma.dashboard.findFirst({
      where: { id, tenantId },
    });
  }

  async createDashboard(
    tenantId: string,
    orgId: string,
    dto: { name: string; description?: string; layout?: any }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    return prisma.dashboard.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        description: dto.description || null,
        layout: dto.layout || [],
      },
    });
  }

  async getReports(tenantId: string) {
    return prisma.report.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createReport(
    tenantId: string,
    orgId: string,
    dto: { name: string; description?: string; query?: any; type?: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    return prisma.report.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        description: dto.description || null,
        query: dto.query || {},
        type: dto.type || 'BUILDER',
      },
    });
  }

  async getKPIs(tenantId: string) {
    // We can fetch from KPI table, and auto-calculate if empty
    const existing = await prisma.kPI.findMany({
      where: { tenantId },
    });

    if (existing.length === 0) {
      // Seed some dynamic KPIs
      const invoiceSum = await prisma.invoice.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true },
      });
      const employeeCount = await prisma.employee.count({
        where: { tenantId },
      });
      const productCount = await prisma.product.count({
        where: { tenantId },
      });

      const org = await prisma.organization.findFirst({ where: { tenantId } });
      const orgId = org ? org.id : 'org-default';

      await prisma.kPI.createMany({
        data: [
          {
            tenantId,
            orgId,
            name: 'Total Revenue',
            code: 'TOTAL_REVENUE',
            value: `$${(invoiceSum._sum.totalAmount || 0).toLocaleString()}`,
            unit: 'USD',
            trend: JSON.stringify([10, 15, 8, 12, 18, 24]),
          },
          {
            tenantId,
            orgId,
            name: 'Total Employees',
            code: 'TOTAL_EMPLOYEES',
            value: employeeCount.toString(),
            trend: JSON.stringify([2, 2, 3, 4, 5, employeeCount]),
          },
          {
            tenantId,
            orgId,
            name: 'Total Products',
            code: 'TOTAL_PRODUCTS',
            value: productCount.toString(),
            trend: JSON.stringify([5, 10, 15, 20, 25, productCount]),
          },
        ],
      });

      return prisma.kPI.findMany({ where: { tenantId } });
    }

    return existing.map(k => ({
      ...k,
      trend: typeof k.trend === 'string' ? JSON.parse(k.trend) : k.trend,
    }));
  }
}

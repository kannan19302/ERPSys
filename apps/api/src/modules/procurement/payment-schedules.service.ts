import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { buildPaginationValues, buildOrderBy, paginatedResult, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class PaymentSchedulesService {
  async list(tenantId: string, params: PaginationParams & { status?: string; vendorId?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.vendorId) where.vendorId = params.vendorId;

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [items, total] = await Promise.all([
      prisma.paymentSchedule.findMany({ where, skip, take, orderBy: orderBy as any, include: { vendor: { select: { name: true } }, purchaseOrder: { select: { poNumber: true } } } }),
      prisma.paymentSchedule.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getById(tenantId: string, id: string) {
    const schedule = await prisma.paymentSchedule.findFirst({ where: { id, tenantId }, include: { vendor: true, purchaseOrder: { select: { poNumber: true } } } });
    if (!schedule) throw new NotFoundException('Payment schedule not found');
    return schedule;
  }

  async create(tenantId: string, orgId: string, dto: { vendorId: string; purchaseOrderId?: string; dueDate: string; amount: number }) {
    return prisma.paymentSchedule.create({
      data: { tenantId, orgId, vendorId: dto.vendorId, purchaseOrderId: dto.purchaseOrderId, dueDate: new Date(dto.dueDate), amount: dto.amount, status: 'PENDING' },
      include: { vendor: { select: { name: true } } },
    });
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const schedule = await prisma.paymentSchedule.findFirst({ where: { id, tenantId } });
    if (!schedule) throw new NotFoundException('Payment schedule not found');
    return prisma.paymentSchedule.update({ where: { id }, data: { status } });
  }

  async bulkCreateFromPo(tenantId: string, orgId: string, purchaseOrderId: string, milestones: Array<{ dueDate: string; amount: number }>) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id: purchaseOrderId, tenantId } });
    if (!po) throw new NotFoundException('Purchase order not found');

    const schedules = milestones.map(m => ({
      tenantId, orgId, vendorId: po.vendorId, purchaseOrderId, dueDate: new Date(m.dueDate), amount: m.amount, status: 'PENDING' as const,
    }));

    await prisma.paymentSchedule.createMany({ data: schedules });
    return prisma.paymentSchedule.findMany({ where: { purchaseOrderId } });
  }

  async getUpcoming(tenantId: string, days: number = 30) {
    const windowEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const now = new Date();

    const schedules = await prisma.paymentSchedule.findMany({
      where: { tenantId, dueDate: { gte: now, lte: windowEnd }, status: 'PENDING' },
      include: { vendor: { select: { name: true } }, purchaseOrder: { select: { poNumber: true } } },
      orderBy: { dueDate: 'asc' },
    });

    return {
      schedules,
      totalDue: schedules.reduce((sum, s) => sum + Number(s.amount), 0),
      count: schedules.length,
      windowDays: days,
    };
  }

  async getStats(tenantId: string) {
    const schedules = await prisma.paymentSchedule.findMany({ where: { tenantId } });
    const overdue = schedules.filter(s => s.status === 'PENDING' && s.dueDate < new Date());
    return {
      total: schedules.length,
      totalAmount: schedules.reduce((sum, s) => sum + Number(s.amount), 0),
      byStatus: schedules.reduce((acc: Record<string, number>, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {}),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, s) => sum + Number(s.amount), 0),
    };
  }

  async getSchedulesByPurchaseOrder(tenantId: string, purchaseOrderId: string): Promise<any[]> {
    return prisma.paymentSchedule.findMany({
      where: { tenantId, purchaseOrderId },
      include: { vendor: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getSchedulesByDateRange(tenantId: string, startDate: string, endDate: string, params: PaginationParams = {}): Promise<PaginatedResult<any>> {
    const where = { tenantId, dueDate: { gte: new Date(startDate), lte: new Date(endDate) } };
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [items, total] = await Promise.all([
      prisma.paymentSchedule.findMany({ where, skip, take, orderBy: orderBy as any, include: { vendor: { select: { name: true } }, purchaseOrder: { select: { poNumber: true } } } }),
      prisma.paymentSchedule.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async markOverdue(tenantId: string, id: string) {
    const schedule = await prisma.paymentSchedule.findFirst({ where: { id, tenantId } });
    if (!schedule) throw new NotFoundException('Payment schedule not found');
    if (schedule.status !== 'PENDING') throw new BadRequestException('Only pending schedules can be marked overdue');

    return prisma.paymentSchedule.update({
      where: { id },
      data: { status: 'OVERDUE' },
      include: { vendor: { select: { name: true } }, purchaseOrder: { select: { poNumber: true } } },
    });
  }

  async getPaymentForecast(tenantId: string, months: number = 6) {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + months, 1);

    const schedules = await prisma.paymentSchedule.findMany({
      where: { tenantId, dueDate: { gte: now, lte: endDate } },
      include: { vendor: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const monthlyForecast: Record<string, { total: number; count: number; schedules: Array<{ id: string; vendorName: string; amount: number; dueDate: string }> }> = {};
    for (const s of schedules) {
      const key = `${s.dueDate.getFullYear()}-${String(s.dueDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyForecast[key]) monthlyForecast[key] = { total: 0, count: 0, schedules: [] };
      monthlyForecast[key].total += Number(s.amount);
      monthlyForecast[key].count += 1;
      monthlyForecast[key].schedules.push({
        id: s.id,
        vendorName: s.vendor.name,
        amount: Number(s.amount),
        dueDate: s.dueDate.toISOString(),
      });
    }

    const totalProjected = schedules.reduce((s, schedule) => s + Number(schedule.amount), 0);

    return {
      totalProjected,
      totalSchedules: schedules.length,
      monthlyForecast: Object.entries(monthlyForecast).map(([month, data]) => ({ month, ...data })),
      currency: 'USD',
    };
  }
}

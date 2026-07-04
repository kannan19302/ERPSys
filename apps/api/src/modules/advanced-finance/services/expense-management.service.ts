import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { GlAccountingService } from './gl-accounting.service';

@Injectable()
export class ExpenseManagementService {
  constructor(private readonly glService: GlAccountingService) {}

  async getExpenseReports(tenantId: string) {
    const reports = await prisma.expenseReport.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    const employeeIds = reports.map((r) => r.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds }, tenantId },
      select: { id: true, firstName: true, lastName: true },
    });
    const employeeMap = new Map(employees.map((e) => [e.id, e]));
    return reports.map((r) => ({
      ...r,
      employee: employeeMap.get(r.employeeId) || null,
    }));
  }

  async getExpenseReportById(tenantId: string, reportId: string) {
    const report = await prisma.expenseReport.findFirst({
      where: { id: reportId, tenantId },
      include: { items: true },
    });
    if (!report) throw new NotFoundException('Expense report not found');
    const employee = await prisma.employee.findFirst({
      where: { id: report.employeeId, tenantId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    return {
      ...report,
      employee: employee || null,
    };
  }

  async createExpenseReport(tenantId: string, orgId: string, dto: Record<string, unknown>) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.expenseReport.create({
      data: { ...dto, tenantId, orgId: resolvedOrgId, status: 'DRAFT' } as never,
    });
  }

  async submitExpenseReport(tenantId: string, reportId: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT expense reports can be submitted.');
    }
    return prisma.expenseReport.update({
      where: { id: reportId },
      data: { status: 'SUBMITTED' },
    });
  }

  async approveExpenseReport(tenantId: string, reportId: string, approvedBy: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED expense reports can be approved.');
    }
    const updated = await prisma.expenseReport.update({
      where: { id: reportId },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
    await this.glService.logAudit(prisma, tenantId, 'ExpenseReport', reportId, 'APPROVE', { approvedBy }, approvedBy);
    return updated;
  }

  async rejectExpenseReport(tenantId: string, reportId: string, reason: string, rejectedBy: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED expense reports can be rejected.');
    }
    const updated = await prisma.expenseReport.update({
      where: { id: reportId },
      data: {
        status: 'REJECTED',
        description: `${report.description || ''}\n[REJECTED by ${rejectedBy}]: ${reason}`.trim(),
        approvedBy: rejectedBy,
        approvedAt: new Date(),
      },
    });
    await this.glService.logAudit(prisma, tenantId, 'ExpenseReport', reportId, 'REJECT', { reason, rejectedBy }, rejectedBy);
    return updated;
  }

  async markExpenseReportPaid(tenantId: string, reportId: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED expense reports can be marked as paid.');
    }
    return prisma.expenseReport.update({
      where: { id: reportId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }
}

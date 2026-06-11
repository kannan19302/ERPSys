import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdvancedHrService {
  async getSalaryStructures(tenantId: string) {
    return prisma.salaryStructure.findMany({
      where: { tenantId },
      orderBy: { employeeId: 'asc' },
    });
  }

  async createSalaryStructure(
    tenantId: string,
    dto: { employeeId: string; baseSalary: number; allowances?: any; deductions?: any }
  ) {
    const existing = await prisma.salaryStructure.findFirst({
      where: { tenantId, employeeId: dto.employeeId },
    });
    if (existing) {
      return prisma.salaryStructure.update({
        where: { id: existing.id },
        data: {
          baseSalary: new Prisma.Decimal(dto.baseSalary),
          allowances: dto.allowances || {},
          deductions: dto.deductions || {},
        },
      });
    }

    return prisma.salaryStructure.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        baseSalary: new Prisma.Decimal(dto.baseSalary),
        allowances: dto.allowances || {},
        deductions: dto.deductions || {},
      },
    });
  }

  async getPayrollRuns(tenantId: string) {
    return prisma.payrollRun.findMany({
      where: { tenantId },
      include: { slips: true },
      orderBy: { periodStart: 'desc' },
    });
  }

  async runPayroll(
    tenantId: string,
    dto: { periodStart: string; periodEnd: string }
  ) {
    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);

    // Fetch all active salary structures
    const structures = await prisma.salaryStructure.findMany({ where: { tenantId } });
    if (structures.length === 0) throw new BadRequestException('No salary structures configured for payroll.');

    return prisma.$transaction(async (tx) => {
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      const run = await tx.payrollRun.create({
        data: {
          tenantId,
          periodStart: start,
          periodEnd: end,
          status: 'DRAFT',
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
        },
      });

      for (const struct of structures) {
        const gross = parseFloat(struct.baseSalary.toString());
        // Simple mock calculations for allowances and deductions
        const allowanceSum = 150.00; // Mock allowance
        const deductionSum = gross * 0.1; // 10% mock deduction
        const net = gross + allowanceSum - deductionSum;

        totalGross += gross + allowanceSum;
        totalDeductions += deductionSum;
        totalNet += net;

        await tx.payrollSlip.create({
          data: {
            tenantId,
            payrollRunId: run.id,
            employeeId: struct.employeeId,
            grossSalary: new Prisma.Decimal(gross + allowanceSum),
            deductions: new Prisma.Decimal(deductionSum),
            netSalary: new Prisma.Decimal(net),
          },
        });
      }

      return tx.payrollRun.update({
        where: { id: run.id },
        data: {
          totalGross: new Prisma.Decimal(totalGross),
          totalDeductions: new Prisma.Decimal(totalDeductions),
          totalNet: new Prisma.Decimal(totalNet),
          status: 'PAID',
        },
        include: { slips: true },
      });
    });
  }

  async getLeavePolicies(tenantId: string) {
    return prisma.leavePolicy.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createLeavePolicy(tenantId: string, dto: { name: string; leaveType: string; annualAllocation: number }) {
    const existing = await prisma.leavePolicy.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing) throw new BadRequestException(`Policy with name ${dto.name} already exists.`);

    return prisma.leavePolicy.create({
      data: {
        tenantId,
        name: dto.name,
        leaveType: dto.leaveType,
        annualAllocation: dto.annualAllocation,
      },
    });
  }

  async getLeaveRequests(tenantId: string) {
    return prisma.leaveRequest.findMany({
      where: { tenantId },
      include: { policy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeaveRequest(
    tenantId: string,
    dto: { employeeId: string; policyId: string; startDate: string; endDate: string; reason?: string }
  ) {
    return prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        policyId: dto.policyId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason || null,
        status: 'PENDING',
      },
    });
  }

  async approveLeaveRequest(tenantId: string, id: string, status: 'APPROVED' | 'REJECTED', approverId: string) {
    const req = await prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!req) throw new NotFoundException('Leave request not found');

    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });
  }

  async getShiftSchedules(tenantId: string) {
    return prisma.shiftSchedule.findMany({
      where: { tenantId },
      orderBy: { startTime: 'asc' },
    });
  }

  async createShiftSchedule(
    tenantId: string,
    dto: { employeeId: string; startTime: string; endTime: string; note?: string }
  ) {
    return prisma.shiftSchedule.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        note: dto.note || null,
      },
    });
  }
}

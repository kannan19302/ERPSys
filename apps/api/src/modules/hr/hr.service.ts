import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { buildPaginationValues, buildOrderBy, paginatedResult, resolveOrgId, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class HrService {
  constructor(private readonly eventEmitter?: EventEmitter2) { }

  // ── Dashboard ──

  async getDashboard(tenantId: string): Promise<{
    totalEmployees: number; activeEmployees: number; newHiresThisMonth: number;
    departuresThisMonth: number; pendingLeaveRequests: number; openPositions: number;
    attendanceToday: { present: number; absent: number; onLeave: number }; departmentCount: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalEmployees, activeEmployees, newHiresThisMonth, pendingLeaveRequests, openPositions, departmentCount] = await Promise.all([
      prisma.employee.count({ where: { tenantId, deletedAt: null } }),
      prisma.employee.count({ where: { tenantId, deletedAt: null, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { tenantId, deletedAt: null, dateOfJoining: { gte: startOfMonth } } }),
      prisma.leaveRequest.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.position.count({ where: { tenantId, status: 'VACANT' } }),
      prisma.department.count({ where: { tenantId } }),
    ]);

    const [present, absent, onLeave] = await Promise.all([
      prisma.attendanceRecord.count({ where: { tenantId, date: today, status: 'PRESENT' } }),
      prisma.attendanceRecord.count({ where: { tenantId, date: today, status: 'ABSENT' } }),
      prisma.employee.count({ where: { tenantId, deletedAt: null, status: 'ON_LEAVE' } }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      newHiresThisMonth,
      departuresThisMonth: 0,
      pendingLeaveRequests,
      openPositions,
      attendanceToday: { present, absent, onLeave },
      departmentCount,
    };
  }

  // ── Employees ──

  async getEmployees(tenantId: string, params: PaginationParams & { status?: string; departmentId?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { employeeCode: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: { department: { select: { id: true, name: true } } },
        skip,
        take,
        orderBy: orderBy as any,
      }),
      prisma.employee.count({ where }),
    ]);

    const data = (employees as any[]).map((emp) => ({
      id: emp.id,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      designation: emp.designation,
      departmentId: emp.department?.id || null,
      departmentName: emp.department?.name || 'Unassigned',
      employmentType: emp.employmentType,
      status: emp.status,
      dateOfJoining: emp.dateOfJoining,
      dateOfLeaving: emp.dateOfLeaving,
    }));

    return paginatedResult(data, total, params);
  }

  async getEmployeeById(tenantId: string, id: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { department: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async createEmployee(tenantId: string, orgId: string, dto: any) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const existing = await prisma.employee.findFirst({ where: { tenantId, orgId: resolvedOrgId, employeeCode: dto.employeeCode } });
    if (existing) throw new BadRequestException(`Employee code ${dto.employeeCode} already exists.`);

    const employee = await prisma.employee.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        employeeCode: dto.employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone || null,
        designation: dto.designation || null,
        departmentId: dto.departmentId || null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : new Date(),
        employmentType: dto.employmentType || 'FULL_TIME',
        status: dto.status || 'ACTIVE',
        address: dto.address || undefined,
        bankDetails: dto.bankDetails || undefined,
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit('hr.employee.onboarded', {
        employeeId: employee.id, tenantId, email: dto.email,
        firstName: dto.firstName, lastName: dto.lastName,
        departmentId: dto.departmentId, employmentType: dto.employmentType,
        createdAt: new Date(),
      });
    }
    return employee;
  }

  async updateEmployee(tenantId: string, id: string, dto: any) {
    const employee = await prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!employee) throw new NotFoundException('Employee not found');
    return prisma.employee.update({
      where: { id },
      data: {
        firstName: dto.firstName, lastName: dto.lastName, email: dto.email,
        phone: dto.phone, designation: dto.designation, departmentId: dto.departmentId,
        employmentType: dto.employmentType, status: dto.status,
        dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        address: dto.address, bankDetails: dto.bankDetails,
      },
    });
  }

  async deleteEmployee(tenantId: string, id: string) {
    const employee = await prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!employee) throw new NotFoundException('Employee not found');
    await prisma.employee.update({ where: { id }, data: { deletedAt: new Date(), status: 'TERMINATED' } });
    return { success: true };
  }

  async bulkAction(tenantId: string, action: string, ids: string[], data?: Record<string, unknown>) {
    const results: Array<{ id: string; status: 'success' | 'error'; error?: string }> = [];
    for (const id of ids) {
      try {
        switch (action) {
          case 'delete': await this.deleteEmployee(tenantId, id); break;
          case 'update-status':
            if (data?.status && typeof data.status === 'string') {
              await prisma.employee.update({ where: { id }, data: { status: data.status as string } });
            } else throw new BadRequestException('Status is required');
            break;
          default: throw new BadRequestException(`Unsupported action: ${action}`);
        }
        results.push({ id, status: 'success' });
      } catch (err: any) {
        results.push({ id, status: 'error', error: err.message });
      }
    }
    return { total: ids.length, succeeded: results.filter((r) => r.status === 'success').length, failed: results.filter((r) => r.status === 'error').length, results };
  }

  async getEmployeeStats(tenantId: string) {
    const [total, active, onLeave, terminated] = await Promise.all([
      prisma.employee.count({ where: { tenantId, deletedAt: null } }),
      prisma.employee.count({ where: { tenantId, deletedAt: null, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { tenantId, deletedAt: null, status: 'ON_LEAVE' } }),
      prisma.employee.count({ where: { tenantId, deletedAt: null, status: 'TERMINATED' } }),
    ]);
    return { total, active, onLeave, terminated, activeRate: total > 0 ? Math.round((active / total) * 100) : 0 };
  }

  // ── Departments ──

  async getDepartments(tenantId: string) {
    return prisma.department.findMany({ where: { tenantId }, include: { _count: { select: { employees: true } } }, orderBy: { name: 'asc' } });
  }

  async getDepartmentById(tenantId: string, id: string) {
    const dept = await prisma.department.findFirst({ where: { id, tenantId } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async createDepartment(tenantId: string, orgId: string, dto: any) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const existing = await prisma.department.findFirst({ where: { tenantId, orgId: resolvedOrgId, code: dto.code } });
    if (existing) throw new BadRequestException(`Department code ${dto.code} already exists`);
    return prisma.department.create({
      data: { tenantId, orgId: resolvedOrgId, name: dto.name, code: dto.code, parentId: dto.parentId || null, managerId: dto.managerId || null },
    });
  }

  async updateDepartment(tenantId: string, id: string, dto: any) {
    const dept = await prisma.department.findFirst({ where: { id, tenantId } });
    if (!dept) throw new NotFoundException('Department not found');
    return prisma.department.update({ where: { id }, data: dto });
  }

  async deleteDepartment(tenantId: string, id: string) {
    const dept = await prisma.department.findFirst({ where: { id, tenantId } });
    if (!dept) throw new NotFoundException('Department not found');
    await prisma.department.delete({ where: { id } });
    return { success: true };
  }

  async getDepartmentTree(tenantId: string) {
    const all = await prisma.department.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
    const map = new Map<string, any>();
    const roots: any[] = [];
    for (const dept of all) {
      map.set(dept.id, { ...dept, children: [] });
    }
    for (const dept of all) {
      const node = map.get(dept.id);
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  // ── Positions ──

  async getPositions(tenantId: string) {
    return prisma.position.findMany({ where: { tenantId }, include: { department: { select: { id: true, name: true } } }, orderBy: { title: 'asc' } });
  }

  async getPositionById(tenantId: string, id: string) {
    const pos = await prisma.position.findFirst({ where: { id, tenantId }, include: { department: true } });
    if (!pos) throw new NotFoundException('Position not found');
    return pos;
  }

  async createPosition(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    const existing = await prisma.position.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException(`Position code ${dto.code} already exists`);
    return prisma.position.create({
      data: {
        tenantId, departmentId: dto.departmentId, title: dto.title, code: dto.code,
        budgetedSalary: dto.minSalary || 0, status: 'VACANT',
      },
    });
  }

  async updatePosition(tenantId: string, id: string, dto: any) {
    const pos = await prisma.position.findFirst({ where: { id, tenantId } });
    if (!pos) throw new NotFoundException('Position not found');
    return prisma.position.update({
      where: { id },
      data: { title: dto.title, departmentId: dto.departmentId, budgetedSalary: dto.minSalary || dto.budgetedSalary, status: dto.status },
    });
  }

  async deletePosition(tenantId: string, id: string) {
    const pos = await prisma.position.findFirst({ where: { id, tenantId } });
    if (!pos) throw new NotFoundException('Position not found');
    await prisma.position.delete({ where: { id } });
    return { success: true };
  }

  // ── Attendance ──

  async getAttendance(tenantId: string, params: PaginationParams & { employeeId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.status) where.status = params.status;
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [items, total] = await Promise.all([
      prisma.attendanceRecord.findMany({ where, skip, take, orderBy: orderBy as any }),
      prisma.attendanceRecord.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getAttendanceById(tenantId: string, id: string) {
    const item = await prisma.attendanceRecord.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Attendance record not found');
    return item;
  }

  async createAttendance(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    const date = new Date(dto.date);
    const existing = await prisma.attendanceRecord.findFirst({ where: { tenantId, employeeId: dto.employeeId, date } });
    if (existing) throw new BadRequestException('Attendance already exists for this employee on this date');
    return prisma.attendanceRecord.create({
      data: {
        tenantId, employeeId: dto.employeeId, date,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
        status: dto.status || 'PRESENT',
        overtime: dto.overtimeHours || 0,
        notes: dto.notes || null,
      },
    });
  }

  async updateAttendance(tenantId: string, id: string, dto: any) {
    const item = await prisma.attendanceRecord.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Attendance record not found');
    return prisma.attendanceRecord.update({
      where: { id },
      data: {
        checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
        status: dto.status, overtime: dto.overtimeHours, notes: dto.notes,
      },
    });
  }

  async bulkCreateAttendance(tenantId: string, records: any[]) {
    const created = [];
    for (const r of records) {
      try {
        const item = await this.createAttendance(tenantId, r.orgId || 'default', r);
        created.push({ employeeId: r.employeeId, status: 'success', id: item.id });
      } catch (err: any) {
        created.push({ employeeId: r.employeeId, status: 'error', error: err.message });
      }
    }
    return { total: records.length, succeeded: created.filter((r) => r.status === 'success').length, failed: created.filter((r) => r.status === 'error').length, results: created };
  }

  async getAttendanceSummary(tenantId: string, employeeId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const records = await prisma.attendanceRecord.findMany({ where: { tenantId, employeeId, date: { gte: startDate, lte: endDate } } });
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const halfDay = records.filter((r) => r.status === 'HALF_DAY').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const totalOvertime = records.reduce((sum, r) => sum + Number(r.overtime), 0);
    return { employeeId, year, month, total: records.length, present, absent, halfDay, late, totalOvertime };
  }

  async getAttendanceOverview(tenantId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const records = await prisma.attendanceRecord.findMany({ where: { tenantId, date: { gte: startDate, lte: endDate } } });
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const halfDay = records.filter((r) => r.status === 'HALF_DAY').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    return { year, month, total: records.length, present, absent, halfDay, late };
  }

  // ── Shifts ──

  async getShifts(tenantId: string) {
    return prisma.shiftSchedule.findMany({ where: { tenantId }, orderBy: { startTime: 'asc' } });
  }

  async getShiftById(tenantId: string, id: string) {
    const shift = await prisma.shiftSchedule.findFirst({ where: { id, tenantId } });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async createShift(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    return prisma.shiftSchedule.create({
      data: {
        tenantId, employeeId: dto.employeeId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        note: dto.note || dto.notes || null,
      },
    });
  }

  async updateShift(tenantId: string, id: string, dto: any) {
    const shift = await prisma.shiftSchedule.findFirst({ where: { id, tenantId } });
    if (!shift) throw new NotFoundException('Shift not found');
    return prisma.shiftSchedule.update({
      where: { id },
      data: {
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        note: dto.note !== undefined ? dto.note : dto.notes,
      },
    });
  }

  async deleteShift(tenantId: string, id: string) {
    const shift = await prisma.shiftSchedule.findFirst({ where: { id, tenantId } });
    if (!shift) throw new NotFoundException('Shift not found');
    await prisma.shiftSchedule.delete({ where: { id } });
    return { success: true };
  }

  async assignShiftToEmployees(tenantId: string, shiftId: string, employeeIds: string[]) {
    const shift = await prisma.shiftSchedule.findFirst({ where: { id: shiftId, tenantId } });
    if (!shift) throw new NotFoundException('Shift not found');
    const created = [];
    for (const employeeId of employeeIds) {
      const s = await prisma.shiftSchedule.create({
        data: { tenantId, employeeId, startTime: shift.startTime, endTime: shift.endTime, note: 'Assigned' },
      });
      created.push(s);
    }
    return { assigned: created.length, shifts: created };
  }

  // ── Leave Types (LeavePolicy) ──

  async getLeaveTypes(tenantId: string) {
    return prisma.leavePolicy.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async createLeaveType(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    const existing = await prisma.leavePolicy.findFirst({ where: { tenantId, name: dto.name } });
    if (existing) throw new BadRequestException(`Leave type ${dto.name} already exists`);
    return prisma.leavePolicy.create({
      data: {
        tenantId, name: dto.name, leaveType: dto.code || dto.name,
        annualAllocation: dto.defaultDays || dto.annualAllocation,
        carryForwardLimit: dto.carryForwardDays || 0,
      },
    });
  }

  async updateLeaveType(tenantId: string, id: string, dto: any) {
    const lt = await prisma.leavePolicy.findFirst({ where: { id, tenantId } });
    if (!lt) throw new NotFoundException('Leave type not found');
    return prisma.leavePolicy.update({
      where: { id },
      data: { name: dto.name, leaveType: dto.code, annualAllocation: dto.defaultDays, carryForwardLimit: dto.carryForwardDays },
    });
  }

  async deleteLeaveType(tenantId: string, id: string) {
    const lt = await prisma.leavePolicy.findFirst({ where: { id, tenantId } });
    if (!lt) throw new NotFoundException('Leave type not found');
    await prisma.leavePolicy.delete({ where: { id } });
    return { success: true };
  }

  // ── Leave Requests ──

  async getLeaveRequests(tenantId: string, params: PaginationParams & { employeeId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.status) where.status = params.status;
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [items, total] = await Promise.all([
      prisma.leaveRequest.findMany({ where, skip, take, orderBy: orderBy as any, include: { policy: { select: { id: true, name: true } } } }),
      prisma.leaveRequest.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getLeaveRequestById(tenantId: string, id: string) {
    const item = await prisma.leaveRequest.findFirst({ where: { id, tenantId }, include: { policy: true } });
    if (!item) throw new NotFoundException('Leave request not found');
    return item;
  }

  async createLeaveRequest(tenantId: string, orgId: string, userId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    const employee = await prisma.employee.findFirst({ where: { userId: userId, tenantId } });
    const employeeId = dto.employeeId || employee?.id;
    if (!employeeId) throw new BadRequestException('Employee not found for user');
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    return prisma.leaveRequest.create({
      data: { tenantId, employeeId, policyId: dto.leaveTypeId, startDate: start, endDate: end, reason: dto.reason || null, status: 'PENDING' },
    });
  }

  async updateLeaveRequest(tenantId: string, id: string, dto: any) {
    const item = await prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Leave request not found');
    if (item.status !== 'PENDING') throw new BadRequestException('Can only update pending requests');
    return prisma.leaveRequest.update({
      where: { id },
      data: { startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined, reason: dto.reason, policyId: dto.leaveTypeId },
    });
  }

  async approveLeaveRequest(tenantId: string, id: string, userId: string) {
    const item = await prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Leave request not found');
    if (item.status !== 'PENDING') throw new BadRequestException('Leave request is not pending');
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
    });
    if (this.eventEmitter) {
      this.eventEmitter.emit('hr.leave.approved', { leaveRequestId: id, tenantId, employeeId: item.employeeId, approvedBy: userId });
    }
    return updated;
  }

  async rejectLeaveRequest(tenantId: string, id: string, userId: string, reason?: string) {
    const item = await prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Leave request not found');
    if (item.status !== 'PENDING') throw new BadRequestException('Leave request is not pending');
    return prisma.leaveRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: userId, approvedAt: new Date(), reason: reason || item.reason },
    });
  }

  async cancelLeaveRequest(tenantId: string, id: string) {
    const item = await prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Leave request not found');
    if (item.status !== 'PENDING' && item.status !== 'APPROVED') throw new BadRequestException('Cannot cancel leave request');
    return prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async reclaimLeaveRequest(tenantId: string, id: string) {
    const item = await prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Leave request not found');
    if (item.status !== 'APPROVED') throw new BadRequestException('Only approved leave can be reclaimed');
    return prisma.leaveRequest.update({ where: { id }, data: { status: 'PENDING', approvedBy: null, approvedAt: null } });
  }

  async deleteLeaveRequest(tenantId: string, id: string) {
    const item = await prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Leave request not found');
    await prisma.leaveRequest.delete({ where: { id } });
    return { success: true };
  }

  // ── Leave Balances ──

  async getLeaveBalances(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    const leaveTypes = await prisma.leavePolicy.findMany({ where: { tenantId } });
    const employees = employeeId ? [{ id: employeeId }] : await prisma.employee.findMany({ where: { tenantId, deletedAt: null }, select: { id: true } });
    const balances = [];
    for (const emp of employees) {
      for (const lt of leaveTypes) {
        const used = await prisma.leaveRequest.count({
          where: { tenantId, employeeId: emp.id, policyId: lt.id, status: 'APPROVED' },
        });
        balances.push({ employeeId: emp.id, leaveTypeId: lt.id, leaveTypeName: lt.name, totalDays: lt.annualAllocation, usedDays: used, pendingDays: 0, remaining: lt.annualAllocation - used });
      }
    }
    return balances;
  }

  async getEmployeeLeaveBalances(tenantId: string, employeeId: string) {
    const balances = await this.getLeaveBalances(tenantId, employeeId);
    return balances.filter((b) => b.employeeId === employeeId);
  }

  async allocateLeaveBalance(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    const existing = await prisma.leavePolicy.findFirst({ where: { tenantId, id: dto.leaveTypeId } });
    if (!existing) throw new BadRequestException('Leave type not found');
    return { success: true, message: 'Leave allocation recorded (leave balance computed from leave policy and usage)' };
  }

  // ── Salary Structures ──

  async getSalaryStructures(tenantId: string) {
    return prisma.salaryStructure.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getSalaryStructureById(tenantId: string, id: string) {
    const item = await prisma.salaryStructure.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Salary structure not found');
    return item;
  }

  async getSalaryStructureByEmployee(tenantId: string, employeeId: string) {
    const item = await prisma.salaryStructure.findFirst({ where: { tenantId, employeeId } });
    if (!item) throw new NotFoundException('Salary structure not found for employee');
    return item;
  }

  async createSalaryStructure(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    const existing = await prisma.salaryStructure.findFirst({ where: { tenantId, employeeId: dto.employeeId } });
    if (existing) throw new BadRequestException('Salary structure already exists for this employee');
    return prisma.salaryStructure.create({
      data: {
        tenantId, employeeId: dto.employeeId, baseSalary: dto.baseSalary,
        allowances: dto.allowances || dto.components || {},
        deductions: dto.deductions || {},
      },
    });
  }

  async updateSalaryStructure(tenantId: string, id: string, dto: any) {
    const item = await prisma.salaryStructure.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Salary structure not found');
    return prisma.salaryStructure.update({
      where: { id },
      data: { baseSalary: dto.baseSalary, allowances: dto.allowances || dto.components, deductions: dto.deductions },
    });
  }

  async deleteSalaryStructure(tenantId: string, id: string) {
    const item = await prisma.salaryStructure.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Salary structure not found');
    await prisma.salaryStructure.delete({ where: { id } });
    return { success: true };
  }

  // ── Pay Runs (PayrollRun) ──

  async getPayRuns(tenantId: string) {
    return prisma.payrollRun.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { slips: true } } } });
  }

  async getPayRunById(tenantId: string, id: string) {
    const item = await prisma.payrollRun.findFirst({ where: { id, tenantId }, include: { slips: true } });
    if (!item) throw new NotFoundException('Pay run not found');
    return item;
  }

  async createPayRun(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    return prisma.payrollRun.create({
      data: {
        tenantId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        status: 'DRAFT',
        totalGross: 0, totalDeductions: 0, totalNet: 0,
      },
    });
  }

  async updatePayRun(tenantId: string, id: string, dto: any) {
    const item = await prisma.payrollRun.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Pay run not found');
    return prisma.payrollRun.update({
      where: { id },
      data: {
        periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
      },
    });
  }

  async processPayRun(tenantId: string, id: string) {
    const payRun = await prisma.payrollRun.findFirst({ where: { id, tenantId } });
    if (!payRun) throw new NotFoundException('Pay run not found');
    if (payRun.status !== 'DRAFT') throw new BadRequestException('Pay run is not in DRAFT status');
    const updated = await prisma.payrollRun.update({ where: { id }, data: { status: 'PROCESSED' } });
    if (this.eventEmitter) {
      this.eventEmitter.emit('hr.payroll.processed', { payRunId: id, tenantId, periodStart: payRun.periodStart, periodEnd: payRun.periodEnd });
    }
    return updated;
  }

  async approvePayRun(tenantId: string, id: string) {
    const payRun = await prisma.payrollRun.findFirst({ where: { id, tenantId } });
    if (!payRun) throw new NotFoundException('Pay run not found');
    return prisma.payrollRun.update({ where: { id }, data: { status: 'PAID' } });
  }

  async submitPayRun(tenantId: string, id: string) {
    const payRun = await prisma.payrollRun.findFirst({ where: { id, tenantId } });
    if (!payRun) throw new NotFoundException('Pay run not found');
    if (payRun.status !== 'DRAFT') throw new BadRequestException('Pay run is not in DRAFT status');
    return prisma.payrollRun.update({ where: { id }, data: { status: 'SUBMITTED' } });
  }

  async deletePayRun(tenantId: string, id: string) {
    const item = await prisma.payrollRun.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Pay run not found');
    await prisma.payrollRun.delete({ where: { id } });
    return { success: true };
  }

  // ── Pay Run Items (PayrollSlip) ──

  async getPayRunItems(tenantId: string, payRunId: string) {
    return prisma.payrollSlip.findMany({ where: { tenantId, payrollRunId: payRunId } });
  }

  async createPayRunItem(tenantId: string, dto: any) {
    return prisma.payrollSlip.create({
      data: {
        tenantId, payrollRunId: dto.payRunId, employeeId: dto.employeeId,
        grossSalary: dto.grossPay, deductions: dto.totalDeductions || 0, netSalary: dto.netPay,
      },
    });
  }

  async updatePayRunItem(tenantId: string, id: string, dto: any) {
    const item = await prisma.payrollSlip.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Pay run item not found');
    return prisma.payrollSlip.update({
      where: { id },
      data: { grossSalary: dto.grossPay, deductions: dto.totalDeductions, netSalary: dto.netPay },
    });
  }

  // ── Performance Reviews (Appraisal) ──

  async getPerformanceReviews(tenantId: string) {
    return prisma.appraisal.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getPerformanceReviewById(tenantId: string, id: string) {
    const item = await prisma.appraisal.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Performance review not found');
    return item;
  }

  async createPerformanceReview(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    return prisma.appraisal.create({
      data: {
        tenantId, employeeId: dto.employeeId, reviewerId: dto.reviewerId || '',
        appraisalPeriod: dto.period || 'QUARTERLY', score: dto.overallRating || 0,
        feedback: dto.notes || null, status: 'DRAFT',
      },
    });
  }

  async updatePerformanceReview(tenantId: string, id: string, dto: any) {
    const item = await prisma.appraisal.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Performance review not found');
    return prisma.appraisal.update({
      where: { id },
      data: { score: dto.overallRating, feedback: dto.notes, reviewerId: dto.reviewerId },
    });
  }

  async submitPerformanceReview(tenantId: string, id: string) {
    const item = await prisma.appraisal.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Performance review not found');
    return prisma.appraisal.update({ where: { id }, data: { status: 'COMPLETED' } });
  }

  async acknowledgePerformanceReview(tenantId: string, id: string) {
    const item = await prisma.appraisal.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Performance review not found');
    return prisma.appraisal.update({ where: { id }, data: { status: 'ACKNOWLEDGED' } });
  }

  async deletePerformanceReview(tenantId: string, id: string) {
    const item = await prisma.appraisal.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Performance review not found');
    await prisma.appraisal.delete({ where: { id } });
    return { success: true };
  }

  // ── Training Courses (Training) ──

  async getTrainingCourses(tenantId: string) {
    return prisma.training.findMany({ where: { tenantId }, orderBy: { startDate: 'desc' }, include: { _count: { select: { enrollments: true } } } });
  }

  async getTrainingCourseById(tenantId: string, id: string) {
    const item = await prisma.training.findFirst({ where: { id, tenantId }, include: { enrollments: { include: { employee: { select: { id: true, firstName: true, lastName: true } } } } } });
    if (!item) throw new NotFoundException('Training course not found');
    return item;
  }

  async createTrainingCourse(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    return prisma.training.create({
      data: {
        tenantId, name: dto.title, description: dto.description || null,
        instructor: dto.provider || null, capacity: dto.maxAttendees || null,
        startDate: new Date(), endDate: new Date(),
      },
    });
  }

  async updateTrainingCourse(tenantId: string, id: string, dto: any) {
    const item = await prisma.training.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Training course not found');
    return prisma.training.update({
      where: { id },
      data: { name: dto.title, description: dto.description, instructor: dto.provider, capacity: dto.maxAttendees },
    });
  }

  async deleteTrainingCourse(tenantId: string, id: string) {
    const item = await prisma.training.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Training course not found');
    await prisma.training.delete({ where: { id } });
    return { success: true };
  }

  // ── Training Sessions ──

  async getTrainingSessions(tenantId: string) {
    return prisma.training.findMany({ where: { tenantId }, orderBy: { startDate: 'desc' } });
  }

  async createTrainingSession(tenantId: string, dto: any) {
    return prisma.training.create({
      data: {
        tenantId, name: dto.title, description: dto.description || null,
        instructor: dto.instructor || null, capacity: dto.maxAttendees || null,
        startDate: new Date(dto.startDate), endDate: dto.endDate ? new Date(dto.endDate) : new Date(dto.startDate),
      },
    });
  }

  async updateTrainingSession(tenantId: string, id: string, dto: any) {
    const item = await prisma.training.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Training session not found');
    return prisma.training.update({
      where: { id },
      data: {
        name: dto.title, description: dto.description, instructor: dto.instructor,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async enrollInTraining(tenantId: string, sessionId: string, employeeId: string) {
    const existing = await prisma.trainingEnrollment.findFirst({ where: { tenantId, trainingId: sessionId, employeeId } });
    if (existing) throw new BadRequestException('Employee already enrolled in this training');
    return prisma.trainingEnrollment.create({ data: { tenantId, trainingId: sessionId, employeeId, status: 'ENROLLED' } });
  }

  async completeTrainingEnrollment(tenantId: string, enrollmentId: string, _dto: any) {
    const item = await prisma.trainingEnrollment.findFirst({ where: { id: enrollmentId, tenantId } });
    if (!item) throw new NotFoundException('Training enrollment not found');
    return prisma.trainingEnrollment.update({ where: { id: enrollmentId }, data: { status: 'COMPLETED' } });
  }

  // ── Employee Documents ──

  async getEmployeeDocuments(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeeDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getEmployeeDocumentById(tenantId: string, id: string) {
    const item = await prisma.employeeDocument.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Document not found');
    return item;
  }

  async createEmployeeDocument(tenantId: string, dto: any) {
    return prisma.employeeDocument.create({
      data: {
        tenantId, employeeId: dto.employeeId, name: dto.name,
        docType: dto.docType, fileUrl: dto.fileUrl || null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        notes: dto.notes || null,
      },
    });
  }

  async deleteEmployeeDocument(tenantId: string, id: string) {
    const item = await prisma.employeeDocument.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Document not found');
    await prisma.employeeDocument.delete({ where: { id } });
    return { success: true };
  }

  // ── Employee Skills ──

  async getEmployeeSkills(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.employeeSkill.findMany({ where, orderBy: { skillName: 'asc' } });
  }

  async getEmployeeSkillById(tenantId: string, id: string) {
    const item = await prisma.employeeSkill.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Skill not found');
    return item;
  }

  async createEmployeeSkill(tenantId: string, dto: any) {
    return prisma.employeeSkill.create({
      data: {
        tenantId, employeeId: dto.employeeId, skillName: dto.skillName,
        proficiency: dto.proficiency || 1, category: dto.category || 'TECHNICAL',
        certified: dto.certified || false, certificationUrl: dto.certificationUrl || null,
      },
    });
  }

  async updateEmployeeSkill(tenantId: string, id: string, dto: any) {
    const item = await prisma.employeeSkill.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Skill not found');
    return prisma.employeeSkill.update({
      where: { id },
      data: { skillName: dto.skillName, proficiency: dto.proficiency, category: dto.category, certified: dto.certified, certificationUrl: dto.certificationUrl },
    });
  }

  async deleteEmployeeSkill(tenantId: string, id: string) {
    const item = await prisma.employeeSkill.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Skill not found');
    await prisma.employeeSkill.delete({ where: { id } });
    return { success: true };
  }

  // ── Goals ──

  async getGoals(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.goal.findMany({ where, orderBy: { createdAt: 'desc' }, include: { keyResults: true } });
  }

  async getGoalById(tenantId: string, id: string) {
    const item = await prisma.goal.findFirst({ where: { id, tenantId }, include: { keyResults: true, comments: true } });
    if (!item) throw new NotFoundException('Goal not found');
    return item;
  }

  async createGoal(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    return prisma.goal.create({
      data: {
        tenantId, employeeId: dto.employeeId, title: dto.title, description: dto.description || null,
        category: dto.category || 'INDIVIDUAL', type: dto.type || 'QUARTERLY',
        startDate: new Date(dto.startDate), endDate: new Date(dto.endDate),
        weight: dto.weight || 100, progress: 0, status: 'ACTIVE',
      },
    });
  }

  async updateGoal(tenantId: string, id: string, dto: any) {
    const item = await prisma.goal.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Goal not found');
    return prisma.goal.update({
      where: { id },
      data: { title: dto.title, description: dto.description, category: dto.category, type: dto.type, weight: dto.weight, endDate: dto.endDate ? new Date(dto.endDate) : undefined },
    });
  }

  async updateGoalProgress(tenantId: string, id: string, progress: number) {
    const item = await prisma.goal.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Goal not found');
    const status = progress >= 100 ? 'COMPLETED' : 'ACTIVE';
    return prisma.goal.update({ where: { id }, data: { progress: Math.min(100, Math.max(0, progress)), status } });
  }

  async deleteGoal(tenantId: string, id: string) {
    const item = await prisma.goal.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Goal not found');
    await prisma.goal.delete({ where: { id } });
    return { success: true };
  }

  // ── 360 Feedback ──

  async getFeedback360(tenantId: string) {
    return prisma.feedback360.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, include: { responses: true } });
  }

  async getFeedback360ById(tenantId: string, id: string) {
    const item = await prisma.feedback360.findFirst({ where: { id, tenantId }, include: { responses: true } });
    if (!item) throw new NotFoundException('Feedback not found');
    return item;
  }

  async createFeedback360(tenantId: string, dto: any) {
    return prisma.feedback360.create({
      data: {
        tenantId, employeeId: dto.employeeId, reviewerId: dto.reviewerId || '',
        relationship: dto.relationship || 'PEER', period: dto.period || '',
        overallRating: dto.overallRating || null, strengths: dto.strengths || null,
        improvements: dto.improvements || null, status: 'PENDING',
      },
    });
  }

  async submitFeedback360(tenantId: string, id: string) {
    const item = await prisma.feedback360.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Feedback not found');
    return prisma.feedback360.update({ where: { id }, data: { status: 'SUBMITTED' } });
  }

  // ── Onboarding ──

  async getOnboardingChecklists(tenantId: string) {
    return prisma.onboardingChecklist.findMany({ where: { tenantId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  }

  async getOnboardingById(tenantId: string, id: string) {
    const item = await prisma.onboardingChecklist.findFirst({ where: { id, tenantId }, include: { items: { orderBy: { sortOrder: 'asc' } } } });
    if (!item) throw new NotFoundException('Onboarding checklist not found');
    return item;
  }

  async createOnboardingChecklist(tenantId: string, dto: any) {
    return prisma.onboardingChecklist.create({
      data: {
        tenantId, employeeId: dto.employeeId, templateName: dto.templateName || 'Default',
        status: 'IN_PROGRESS',
        items: dto.items ? {
          create: dto.items.map((item: any, idx: number) => ({
            tenantId, task: item.task || item, category: item.category || 'GENERAL', sortOrder: idx,
          })),
        } : undefined,
      },
      include: { items: true },
    });
  }

  async completeOnboardingItem(tenantId: string, checklistId: string, itemId: string) {
    const item = await prisma.onboardingItem.findFirst({ where: { id: itemId, checklistId, tenantId } });
    if (!item) throw new NotFoundException('Onboarding item not found');
    const updated = await prisma.onboardingItem.update({
      where: { id: itemId },
      data: { isCompleted: true, status: 'COMPLETED', completedAt: new Date() },
    });
    const allItems = await prisma.onboardingItem.findMany({ where: { checklistId } });
    const allDone = allItems.every((i) => i.isCompleted);
    if (allDone) {
      await prisma.onboardingChecklist.update({ where: { id: checklistId }, data: { status: 'COMPLETED' } });
    }
    return updated;
  }

  // ── Offboarding ──

  async getOffboardingChecklists(tenantId: string) {
    return prisma.offboardingChecklist.findMany({ where: { tenantId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  }

  async createOffboardingChecklist(tenantId: string, dto: any) {
    return prisma.offboardingChecklist.create({
      data: {
        tenantId, employeeId: dto.employeeId, status: 'IN_PROGRESS',
        exitDate: dto.exitDate ? new Date(dto.exitDate) : new Date(),
        exitReason: dto.exitReason || null,
        items: dto.items ? {
          create: dto.items.map((item: any, idx: number) => ({
            tenantId, task: item.task || item, sortOrder: idx,
          })),
        } : undefined,
      },
      include: { items: true },
    });
  }

  // ── Job Postings ──

  async getJobPostings(tenantId: string) {
    return prisma.jobPosting.findMany({ where: { tenantId }, orderBy: { postedAt: 'desc' }, include: { _count: { select: { applicants: true } } } });
  }

  async getJobPostingById(tenantId: string, id: string) {
    const item = await prisma.jobPosting.findFirst({ where: { id, tenantId }, include: { applicants: true } });
    if (!item) throw new NotFoundException('Job posting not found');
    return item;
  }

  async createJobPosting(tenantId: string, orgId: string, dto: any) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.jobPosting.create({
      data: {
        tenantId, orgId: resolvedOrgId, title: dto.title,
        departmentId: dto.departmentId || null, description: dto.description || '',
        requirements: dto.requirements || null, location: dto.location || null,
        employmentType: dto.employmentType || 'FULL_TIME', salaryRange: dto.salaryRange || null,
        status: dto.status || 'OPEN',
      },
    });
  }

  async updateJobPosting(tenantId: string, id: string, dto: any) {
    const item = await prisma.jobPosting.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Job posting not found');
    return prisma.jobPosting.update({
      where: { id },
      data: {
        title: dto.title, description: dto.description, requirements: dto.requirements,
        location: dto.location, employmentType: dto.employmentType, salaryRange: dto.salaryRange,
        status: dto.status,
      },
    });
  }

  async closeJobPosting(tenantId: string, id: string) {
    const item = await prisma.jobPosting.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Job posting not found');
    return prisma.jobPosting.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date() } });
  }

  async deleteJobPosting(tenantId: string, id: string) {
    const item = await prisma.jobPosting.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Job posting not found');
    await prisma.jobPosting.delete({ where: { id } });
    return { success: true };
  }

  // ── Applicants ──

  async getApplicants(tenantId: string) {
    return prisma.applicant.findMany({ where: { tenantId }, orderBy: { appliedAt: 'desc' }, include: { jobPosting: { select: { id: true, title: true } } } });
  }

  async getApplicantById(tenantId: string, id: string) {
    const item = await prisma.applicant.findFirst({ where: { id, tenantId }, include: { jobPosting: true, interviews: true } });
    if (!item) throw new NotFoundException('Applicant not found');
    return item;
  }

  async createApplicant(tenantId: string, orgId: string, dto: any) {
    await resolveOrgId(tenantId, orgId);
    return prisma.applicant.create({
      data: {
        tenantId, jobPostingId: dto.jobPostingId, firstName: dto.firstName,
        lastName: dto.lastName, email: dto.email, phone: dto.phone || null,
        resumeUrl: dto.resumeUrl || null, coverLetter: dto.coverLetter || null,
        currentStage: dto.currentStage || 'APPLIED', status: dto.status || 'ACTIVE',
        notes: dto.notes || null,
      },
    });
  }

  async updateApplicant(tenantId: string, id: string, dto: any) {
    const item = await prisma.applicant.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Applicant not found');
    return prisma.applicant.update({
      where: { id },
      data: { firstName: dto.firstName, lastName: dto.lastName, email: dto.email, phone: dto.phone, notes: dto.notes, currentStage: dto.currentStage },
    });
  }

  async advanceApplicantStage(tenantId: string, id: string, stage: string) {
    const item = await prisma.applicant.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Applicant not found');
    return prisma.applicant.update({ where: { id }, data: { currentStage: stage } });
  }

  async convertApplicantToEmployee(tenantId: string, orgId: string, applicantId: string, dto: any) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const applicant = await prisma.applicant.findFirst({ where: { id: applicantId, tenantId } });
    if (!applicant) throw new NotFoundException('Applicant not found');
    const employee = await prisma.employee.create({
      data: {
        tenantId, orgId: resolvedOrgId, employeeCode: dto.employeeCode || `EMP-${Date.now()}`,
        firstName: applicant.firstName, lastName: applicant.lastName, email: applicant.email,
        phone: applicant.phone, designation: dto.designation || null,
        departmentId: dto.departmentId || null, dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : new Date(),
        employmentType: dto.employmentType || 'FULL_TIME', status: 'ACTIVE',
      },
    });
    await prisma.applicant.update({ where: { id: applicantId }, data: { status: 'HIRED', currentStage: 'HIRED' } });
    if (this.eventEmitter) {
      this.eventEmitter.emit('hr.employee.onboarded', {
        employeeId: employee.id, tenantId, email: applicant.email,
        firstName: applicant.firstName, lastName: applicant.lastName,
        departmentId: dto.departmentId, employmentType: dto.employmentType,
        createdAt: new Date(), source: 'applicant-conversion', applicantId,
      });
    }
    return employee;
  }

  // ── Interviews ──

  async getInterviews(tenantId: string) {
    return prisma.interview.findMany({ where: { tenantId }, orderBy: { scheduledAt: 'desc' }, include: { applicant: { select: { id: true, firstName: true, lastName: true } }, jobPosting: { select: { id: true, title: true } } } });
  }

  async getInterviewById(tenantId: string, id: string) {
    const item = await prisma.interview.findFirst({ where: { id, tenantId }, include: { applicant: true, jobPosting: true } });
    if (!item) throw new NotFoundException('Interview not found');
    return item;
  }

  async createInterview(tenantId: string, dto: any) {
    return prisma.interview.create({
      data: {
        tenantId, applicantId: dto.applicantId, jobPostingId: dto.jobPostingId,
        interviewerId: dto.interviewerId || '', scheduledAt: new Date(dto.scheduledAt),
        durationMin: dto.durationMin || 60, round: dto.round || 'TECHNICAL',
        status: 'SCHEDULED', feedback: null, rating: null,
      },
    });
  }

  async updateInterview(tenantId: string, id: string, dto: any) {
    const item = await prisma.interview.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Interview not found');
    return prisma.interview.update({
      where: { id },
      data: {
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        durationMin: dto.durationMin, round: dto.round, status: dto.status,
        interviewerId: dto.interviewerId,
      },
    });
  }

  async completeInterview(tenantId: string, id: string, dto: any) {
    const item = await prisma.interview.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Interview not found');
    return prisma.interview.update({
      where: { id },
      data: { status: 'COMPLETED', feedback: dto.feedback || null, rating: dto.rating || null },
    });
  }

  // ── HR Tickets ──

  async getHrTickets(tenantId: string) {
    return prisma.hRTicket.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getHrTicketById(tenantId: string, id: string) {
    const item = await prisma.hRTicket.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('HR Ticket not found');
    return item;
  }

  async createHrTicket(tenantId: string, dto: any) {
    return prisma.hRTicket.create({
      data: {
        tenantId, employeeId: dto.employeeId, category: dto.category || 'QUERY',
        title: dto.title, description: dto.description || null, priority: dto.priority || 'MEDIUM',
        status: 'OPEN', assignedTo: dto.assignedTo || null,
      },
    });
  }

  async updateHrTicket(tenantId: string, id: string, dto: any) {
    const item = await prisma.hRTicket.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('HR Ticket not found');
    return prisma.hRTicket.update({
      where: { id },
      data: { category: dto.category, title: dto.title, description: dto.description, priority: dto.priority, assignedTo: dto.assignedTo },
    });
  }

  async resolveHrTicket(tenantId: string, id: string, resolution: string) {
    const item = await prisma.hRTicket.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('HR Ticket not found');
    return prisma.hRTicket.update({
      where: { id },
      data: { status: 'RESOLVED', resolution: resolution || null, resolvedAt: new Date() },
    });
  }

  // ── Succession Plans ──

  async getSuccessionPlans(tenantId: string) {
    return prisma.successionPlan.findMany({ where: { tenantId }, orderBy: { position: 'asc' } });
  }

  async createSuccessionPlan(tenantId: string, dto: any) {
    return prisma.successionPlan.create({
      data: {
        tenantId, position: dto.position, currentHolderId: dto.currentHolderId || null,
        riskLevel: dto.riskLevel || 'LOW', readinessLevel: dto.readinessLevel || 'NOT_READY',
        successorId: dto.successorId || null, developmentPlan: dto.developmentPlan || null,
      },
    });
  }

  async updateSuccessionPlan(tenantId: string, id: string, dto: any) {
    const item = await prisma.successionPlan.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Succession plan not found');
    return prisma.successionPlan.update({
      where: { id },
      data: { position: dto.position, currentHolderId: dto.currentHolderId, riskLevel: dto.riskLevel, readinessLevel: dto.readinessLevel, successorId: dto.successorId, developmentPlan: dto.developmentPlan },
    });
  }

  async deleteSuccessionPlan(tenantId: string, id: string) {
    const item = await prisma.successionPlan.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Succession plan not found');
    await prisma.successionPlan.delete({ where: { id } });
    return { success: true };
  }

  // ── Asset Assignments ──

  async getAssetAssignments(tenantId: string) {
    return prisma.assetAssignment.findMany({ where: { tenantId }, orderBy: { assignedDate: 'desc' } });
  }

  async assignAsset(tenantId: string, dto: any) {
    return prisma.assetAssignment.create({
      data: {
        tenantId, employeeId: dto.employeeId, assetType: dto.assetType,
        assetName: dto.assetName, serialNumber: dto.serialNumber || null,
        returnDueDate: dto.returnDueDate ? new Date(dto.returnDueDate) : null,
        status: 'ASSIGNED', notes: dto.notes || null,
      },
    });
  }

  async returnAsset(tenantId: string, id: string) {
    const item = await prisma.assetAssignment.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Asset assignment not found');
    return prisma.assetAssignment.update({ where: { id }, data: { status: 'RETURNED', returnedDate: new Date() } });
  }

  // ── Reports ──

  async getHeadcountReport(tenantId: string) {
    const departments = await prisma.department.findMany({ where: { tenantId }, include: { _count: { select: { employees: true } } } });
    const byDepartment = departments.map((d) => ({ departmentId: d.id, departmentName: d.name, count: d._count.employees }));
    const total = byDepartment.reduce((sum, d) => sum + d.count, 0);
    const byEmploymentType = await prisma.employee.groupBy({ by: ['employmentType'], where: { tenantId, deletedAt: null }, _count: true });
    const byStatus = await prisma.employee.groupBy({ by: ['status'], where: { tenantId, deletedAt: null }, _count: true });
    return { total, byDepartment, byEmploymentType: byEmploymentType.map((e) => ({ type: e.employmentType, count: e._count })), byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })) };
  }

  async getAttendanceReport(tenantId: string, params: any = {}) {
    const where: any = { tenantId };
    if (params.startDate) where.date = { gte: new Date(params.startDate) };
    if (params.endDate) where.date = { ...where.date, lte: new Date(params.endDate) };
    return prisma.attendanceRecord.groupBy({ by: ['date', 'status'], where, _count: true, orderBy: { date: 'asc' } });
  }

  async getLeaveAnalytics(tenantId: string) {
    const byStatus = await prisma.leaveRequest.groupBy({ by: ['status'], where: { tenantId }, _count: true });
    const byPolicy = await prisma.leaveRequest.groupBy({ by: ['policyId'], where: { tenantId }, _count: true });
    const policies = await prisma.leavePolicy.findMany({ where: { tenantId }, select: { id: true, name: true } });
    const policyMap = new Map(policies.map((p) => [p.id, p.name]));
    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byLeaveType: byPolicy.map((p) => ({ leaveTypeId: p.policyId, leaveTypeName: policyMap.get(p.policyId) || 'Unknown', count: p._count })),
    };
  }

  async getPayrollSummary(tenantId: string) {
    const runs = await prisma.payrollRun.findMany({ where: { tenantId }, orderBy: { periodStart: 'desc' }, take: 12 });
    return runs.map((r) => ({
      id: r.id, periodStart: r.periodStart, periodEnd: r.periodEnd, status: r.status,
      totalGross: r.totalGross, totalDeductions: r.totalDeductions, totalNet: r.totalNet,
    }));
  }

  async getTurnoverReport(tenantId: string, params: any = {}) {
    const months = params.months ? parseInt(params.months) : 12;
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const joined = await prisma.employee.count({ where: { tenantId, deletedAt: null, dateOfJoining: { gte: since } } });
    const left = await prisma.employee.count({ where: { tenantId, deletedAt: null, dateOfLeaving: { gte: since } } });
    const total = await prisma.employee.count({ where: { tenantId, deletedAt: null } });
    const turnoverRate = total > 0 ? Math.round((left / total) * 100) : 0;
    return { periodMonths: months, newHires: joined, departures: left, totalEmployees: total, turnoverRate };
  }

  async getUpcomingBirthdays(tenantId: string, days: number = 30) {
    const employees = await prisma.employee.findMany({ where: { tenantId, deletedAt: null, dateOfBirth: { not: null } }, select: { id: true, firstName: true, lastName: true, dateOfBirth: true, email: true, designation: true } });
    const today = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    return employees
      .filter((e) => {
        if (!e.dateOfBirth) return false;
        const bd = new Date(e.dateOfBirth);
        bd.setFullYear(today.getFullYear());
        return bd >= today && bd <= end;
      })
      .map((e) => ({ id: e.id, firstName: e.firstName, lastName: e.lastName, email: e.email, designation: e.designation, dateOfBirth: e.dateOfBirth }))
      .sort((a, b) => {
        const aBd = new Date(a.dateOfBirth!).setFullYear(today.getFullYear());
        const bBd = new Date(b.dateOfBirth!).setFullYear(today.getFullYear());
        return aBd - bBd;
      });
  }

  async getUpcomingAnniversaries(tenantId: string, days: number = 30) {
    const employees = await prisma.employee.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, firstName: true, lastName: true, dateOfJoining: true, email: true, designation: true } });
    const today = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    return employees
      .filter((e) => {
        const anniv = new Date(e.dateOfJoining);
        anniv.setFullYear(today.getFullYear());
        return anniv >= today && anniv <= end;
      })
      .map((e) => {
        const anniv = new Date(e.dateOfJoining);
        anniv.setFullYear(today.getFullYear());
        const years = today.getFullYear() - e.dateOfJoining.getFullYear();
        return { id: e.id, firstName: e.firstName, lastName: e.lastName, email: e.email, designation: e.designation, dateOfJoining: e.dateOfJoining, anniversaryDate: anniv, yearsOfService: years };
      })
      .sort((a, b) => a.anniversaryDate.getTime() - b.anniversaryDate.getTime());
  }
}

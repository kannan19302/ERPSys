import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateEmployeeInput, UpdateEmployeeInput } from '@unerp/shared';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { buildPaginationValues, buildOrderBy, paginatedResult, resolveOrgId, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class HrService {
  constructor(private readonly eventEmitter?: EventEmitter2) { }

  /**
   * Get all employees with pagination.
   */
  async getEmployees(
    tenantId: string,
    params: PaginationParams & { status?: string; departmentId?: string } = {},
  ): Promise<PaginatedResult<any>> {
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

  /**
   * Get single employee by ID.
   */
  async getEmployeeById(tenantId: string, id: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { department: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  /**
   * Create employee.
   */
  async createEmployee(tenantId: string, orgId: string, dto: CreateEmployeeInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);

    const existing = await prisma.employee.findFirst({
      where: { tenantId, orgId: resolvedOrgId, employeeCode: dto.employeeCode },
    });
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
        dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : new Date(),
        employmentType: dto.employmentType,
        status: dto.status,
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit('hr.employee.onboarded', {
        employeeId: employee.id,
        tenantId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        departmentId: dto.departmentId,
        employmentType: dto.employmentType,
        createdAt: new Date(),
      });
    }

    return employee;
  }

  /**
   * Update employee.
   */
  async updateEmployee(tenantId: string, id: string, dto: UpdateEmployeeInput) {
    const employee = await prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!employee) throw new NotFoundException('Employee not found');

    return prisma.employee.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        designation: dto.designation,
        departmentId: dto.departmentId,
        employmentType: dto.employmentType,
        status: dto.status,
        dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
      },
    });
  }

  /**
   * Delete employee (soft delete).
   */
  async deleteEmployee(tenantId: string, id: string) {
    const employee = await prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!employee) throw new NotFoundException('Employee not found');

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'TERMINATED' },
    });
    return { success: true };
  }

  /**
   * Get departments.
   */
  async getDepartments(tenantId: string) {
    return prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get employee stats / KPIs.
   */
  async getEmployeeStats(tenantId: string) {
    const [total, active, onLeave, terminated] = await Promise.all([
      prisma.employee.count({ where: { tenantId, deletedAt: null } }),
      prisma.employee.count({ where: { tenantId, deletedAt: null, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { tenantId, deletedAt: null, status: 'LEAVE' } }),
      prisma.employee.count({ where: { tenantId, deletedAt: null, status: 'TERMINATED' } }),
    ]);

    return { total, active, onLeave, terminated, activeRate: total > 0 ? Math.round((active / total) * 100) : 0 };
  }

  /**
   * Bulk operations on employees.
   */
  async bulkAction(tenantId: string, action: string, ids: string[], data?: Record<string, unknown>) {
    const results: Array<{ id: string; status: 'success' | 'error'; error?: string }> = [];

    for (const id of ids) {
      try {
        switch (action) {
          case 'delete':
            await this.deleteEmployee(tenantId, id);
            break;
          case 'update-status':
            if (data?.status && typeof data.status === 'string') {
              await prisma.employee.update({ where: { id }, data: { status: data.status as string } });
            } else {
              throw new BadRequestException('Status is required');
            }
            break;
          default:
            throw new BadRequestException(`Unsupported action: ${action}`);
        }
        results.push({ id, status: 'success' });
      } catch (err: any) {
        results.push({ id, status: 'error', error: err.message });
      }
    }

    return {
      total: ids.length,
      succeeded: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'error').length,
      results,
    };
  }
}
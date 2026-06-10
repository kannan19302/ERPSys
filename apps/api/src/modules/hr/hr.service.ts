import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateEmployeeInput } from '@unerp/shared';
import { Employee } from '@prisma/client';

@Injectable()
export class HrService {
  /**
   * Fetch all employees in the tenant.
   */
  async getEmployees(tenantId: string) {
    const employees = (await prisma.employee.findMany({
      where: { tenantId },
      include: {
        department: true,
      },
      orderBy: { employeeCode: 'asc' },
    })) as unknown as Array<Employee & { department: { name: string; code: string } | null }>;

    return employees.map((emp) => ({
      id: emp.id,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      designation: emp.designation,
      employmentType: emp.employmentType,
      status: emp.status,
      dateOfJoining: emp.dateOfJoining,
      departmentName: emp.department?.name || 'Unassigned',
      departmentCode: emp.department?.code || null,
    }));
  }

  /**
   * Register a new employee.
   */
  async createEmployee(tenantId: string, orgId: string, dto: CreateEmployeeInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({
        where: { tenantId },
      });
      if (!org) {
        throw new BadRequestException('No Organization registered in this tenant');
      }
      resolvedOrgId = org.id;
    }

    // Check if employee code already exists in tenant
    const existing = await prisma.employee.findFirst({
      where: { tenantId, employeeCode: dto.employeeCode },
    });
    if (existing) {
      throw new BadRequestException(`Employee with code ${dto.employeeCode} already exists.`);
    }

    return prisma.employee.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        employeeCode: dto.employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone || null,
        designation: dto.designation || null,
        departmentId: dto.departmentId || null,
        employmentType: dto.employmentType,
        status: dto.status,
        dateOfJoining: new Date(),
      },
    });
  }

  /**
   * Update employee designation or status.
   */
  async updateEmployee(tenantId: string, employeeId: string, dto: Partial<CreateEmployeeInput>) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return prisma.employee.update({
      where: { id: employeeId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        designation: dto.designation,
        departmentId: dto.departmentId,
        employmentType: dto.employmentType,
        status: dto.status,
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class OrgHierarchyService {
  // ── Departments ──────────────────────────────────────────

  async getDepartments(tenantId: string) {
    return prisma.department.findMany({
      where: { tenantId },
      include: {
        _count: { select: { children: true, employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(tenantId: string, data: { orgId: string; name: string; code: string; parentId?: string; managerId?: string }) {
    return prisma.department.create({
      data: {
        tenantId,
        orgId: data.orgId,
        name: data.name,
        code: data.code,
        parentId: data.parentId || null,
        managerId: data.managerId || null,
      },
    });
  }

  async updateDepartment(tenantId: string, id: string, data: { name?: string; code?: string; parentId?: string | null; managerId?: string | null }) {
    return prisma.department.update({
      where: { id, tenantId },
      data,
    });
  }

  async deleteDepartment(tenantId: string, id: string) {
    const children = await prisma.department.count({
      where: { parentId: id, tenantId },
    });

    if (children > 0) {
      throw new Error('Cannot delete department with child departments. Reassign or delete children first.');
    }

    return prisma.department.delete({
      where: { id, tenantId },
    });
  }

  // ── Cost Centers ─────────────────────────────────────────

  async getCostCenters(tenantId: string, orgId: string) {
    return prisma.costCenter.findMany({
      where: { tenantId, orgId },
      include: {
        _count: { select: { children: true } },
        parent: { select: { id: true, name: true, code: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async createCostCenter(tenantId: string, data: { orgId: string; code: string; name: string; parentId?: string; budget?: number }) {
    return prisma.costCenter.create({
      data: {
        tenantId,
        orgId: data.orgId,
        code: data.code,
        name: data.name,
        parentId: data.parentId || null,
        budget: data.budget ?? null,
      },
    });
  }

  async updateCostCenter(tenantId: string, id: string, data: { name?: string; code?: string; parentId?: string | null; budget?: number | null; isActive?: boolean }) {
    return prisma.costCenter.update({
      where: { id, tenantId },
      data,
    });
  }

  async deleteCostCenter(tenantId: string, id: string) {
    const children = await prisma.costCenter.count({
      where: { parentId: id, tenantId },
    });

    if (children > 0) {
      throw new Error('Cannot delete cost center with children. Reassign or delete children first.');
    }

    return prisma.costCenter.delete({
      where: { id, tenantId },
    });
  }

  // ── Org Tree ─────────────────────────────────────────────

  async getOrgTree(tenantId: string) {
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    const departments = await prisma.department.findMany({ where: { tenantId } });
    const costCenters = await prisma.costCenter.findMany({ where: { tenantId } });

    const buildTree = (items: any[], parentId: string | null): any[] => {
      return items
        .filter(i => i.parentId === parentId)
        .map(i => ({ ...i, children: buildTree(items, i.id) }));
    };

    return {
      organization: org,
      departments: buildTree(departments, null),
      costCenters: buildTree(costCenters, null),
    };
  }
}

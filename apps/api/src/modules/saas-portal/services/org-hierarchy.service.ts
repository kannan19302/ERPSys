import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

export interface OrgTreeNode {
  id: string;
  parentId: string | null;
  [key: string]: unknown;
  children: OrgTreeNode[];
}

/**
 * Org hierarchy (departments, cost centers, org tree) as consumed from the
 * SaaS Portal home. This is an independent implementation, not a delegate to
 * `modules/admin/org-hierarchy.service.ts` — direct cross-module imports are
 * hard-blocked by `scripts/check-module-boundaries.mjs` / dependency-cruiser
 * and there is no event/port abstraction for this read-heavy admin data yet.
 * Both services read/write the same `Department`/`CostCenter` Prisma models,
 * so state never diverges; only the service-layer code is duplicated.
 */
@Injectable()
export class SaasPortalOrgHierarchyService {
  async getDepartments(tenantId: string) {
    return prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { children: true, employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(
    tenantId: string,
    data: { orgId: string; name: string; code: string; parentId?: string; managerId?: string },
  ) {
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

  async updateDepartment(
    tenantId: string,
    id: string,
    data: { name?: string; code?: string; parentId?: string | null; managerId?: string | null },
  ) {
    const existing = await prisma.department.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Department not found');
    return prisma.department.update({ where: { id, tenantId }, data });
  }

  async deleteDepartment(tenantId: string, id: string) {
    const existing = await prisma.department.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Department not found');
    const children = await prisma.department.count({ where: { parentId: id, tenantId } });
    if (children > 0) {
      throw new Error('Cannot delete department with child departments. Reassign or delete children first.');
    }
    return prisma.department.delete({ where: { id, tenantId } });
  }

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

  async createCostCenter(
    tenantId: string,
    data: { orgId: string; code: string; name: string; parentId?: string; budget?: number },
  ) {
    return prisma.costCenter.create({
      data: {
        tenantId,
        orgId: data.orgId,
        code: data.code,
        name: data.name,
        parentId: data.parentId || null,
      },
    });
  }

  async updateCostCenter(
    tenantId: string,
    id: string,
    data: { name?: string; code?: string; parentId?: string | null; budget?: number | null; isActive?: boolean },
  ) {
    const existing = await prisma.costCenter.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Cost center not found');
    const { budget: _budget, ...rest } = data;
    return prisma.costCenter.update({ where: { id, tenantId }, data: rest });
  }

  async deleteCostCenter(tenantId: string, id: string) {
    const existing = await prisma.costCenter.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Cost center not found');
    const children = await prisma.costCenter.count({ where: { parentId: id, tenantId } });
    if (children > 0) {
      throw new Error('Cannot delete cost center with children. Reassign or delete children first.');
    }
    return prisma.costCenter.delete({ where: { id, tenantId } });
  }

  async getOrgTree(tenantId: string) {
    const [organization, departments, costCenters] = await Promise.all([
      prisma.organization.findFirst({ where: { tenantId } }),
      prisma.department.findMany({ where: { tenantId } }),
      prisma.costCenter.findMany({ where: { tenantId } }),
    ]);

    const buildTree = (items: Record<string, unknown>[], parentId: string | null): OrgTreeNode[] =>
      items
        .filter((i) => (i.parentId as string | null) === parentId)
        .map((i) => ({ ...(i as OrgTreeNode), children: buildTree(items, i.id as string) }));

    return {
      organization,
      departments: buildTree(departments as unknown as Record<string, unknown>[], null),
      costCenters: buildTree(costCenters as unknown as Record<string, unknown>[], null),
    };
  }
}

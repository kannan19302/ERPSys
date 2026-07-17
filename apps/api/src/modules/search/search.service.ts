import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { hasPermission } from '@unerp/auth';

// ─────────────────────────────────────────────────
// Global search — tenant-scoped, RBAC-filtered
// cross-entity lookup powering the command palette.
// Each entity block only runs when the caller holds
// that entity's `.read` permission, so results never
// leak records the user couldn't open anyway.
// ─────────────────────────────────────────────────

export interface SearchHit {
  /** Entity kind, e.g. "customer" */
  entity: string;
  /** Human group label, e.g. "Customers" */
  group: string;
  id: string;
  title: string;
  subtitle?: string;
  /** Web-app route that opens the record */
  href: string;
}

const MAX_PER_ENTITY = 5;

@Injectable()
export class SearchService {
  /** Resolve the caller's flattened permission list (same source as RbacGuard). */
  private async resolvePermissions(userId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const permissions: string[] = [];
    for (const ur of userRoles) {
      try {
        const perms = JSON.parse(ur.role.permissions as string);
        if (Array.isArray(perms)) permissions.push(...perms);
      } catch {
        // Skip malformed role permissions
      }
    }
    return permissions;
  }

  async globalSearch(tenantId: string, userId: string, query: string): Promise<SearchHit[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const permissions = await this.resolvePermissions(userId);
    const can = (code: string) => hasPermission(permissions, code);
    const contains = { contains: q, mode: 'insensitive' as const };

    // Each block is independent; run the permitted ones concurrently.
    const lookups: Array<Promise<SearchHit[]>> = [];

    if (can('crm.contact.read')) {
      lookups.push(
        prisma.customer.findMany({
          where: { tenantId, OR: [{ name: contains }, { email: contains }, { phone: contains }] },
          take: MAX_PER_ENTITY,
          select: { id: true, name: true, email: true },
        }).then((rows) => rows.map((r) => ({
          entity: 'customer', group: 'Customers', id: r.id, title: r.name,
          subtitle: r.email ?? undefined, href: `/crm/customers?highlight=${r.id}`,
        }))),
      );
    }

    if (can('crm.lead.read')) {
      lookups.push(
        prisma.lead.findMany({
          where: { tenantId, OR: [{ firstName: contains }, { lastName: contains }, { company: contains }, { email: contains }] },
          take: MAX_PER_ENTITY,
          select: { id: true, firstName: true, lastName: true, company: true },
        }).then((rows) => rows.map((r) => ({
          entity: 'lead', group: 'Leads', id: r.id, title: `${r.firstName} ${r.lastName}`.trim(),
          subtitle: r.company ?? undefined, href: `/crm/leads?highlight=${r.id}`,
        }))),
      );
    }

    if (can('inventory.product.read')) {
      lookups.push(
        prisma.product.findMany({
          where: { tenantId, OR: [{ name: contains }, { sku: contains }, { barcode: contains }] },
          take: MAX_PER_ENTITY,
          select: { id: true, name: true, sku: true },
        }).then((rows) => rows.map((r) => ({
          entity: 'product', group: 'Products', id: r.id, title: r.name,
          subtitle: r.sku, href: `/inventory/products?highlight=${r.id}`,
        }))),
      );
    }

    if (can('hr.employee.read')) {
      lookups.push(
        prisma.employee.findMany({
          where: { tenantId, OR: [{ firstName: contains }, { lastName: contains }, { email: contains }, { employeeCode: contains }] },
          take: MAX_PER_ENTITY,
          select: { id: true, firstName: true, lastName: true, designation: true },
        }).then((rows) => rows.map((r) => ({
          entity: 'employee', group: 'Employees', id: r.id, title: `${r.firstName} ${r.lastName}`.trim(),
          subtitle: r.designation ?? undefined, href: `/hr/employees?highlight=${r.id}`,
        }))),
      );
    }

    if (can('finance.invoice.read')) {
      lookups.push(
        prisma.invoice.findMany({
          where: { tenantId, invoiceNumber: contains },
          take: MAX_PER_ENTITY,
          select: { id: true, invoiceNumber: true, status: true },
        }).then((rows) => rows.map((r) => ({
          entity: 'invoice', group: 'Invoices', id: r.id, title: r.invoiceNumber,
          subtitle: r.status, href: `/finance/invoices?highlight=${r.id}`,
        }))),
      );
    }

    if (can('sales.order.read')) {
      lookups.push(
        prisma.salesOrder.findMany({
          where: { tenantId, orderNumber: contains },
          take: MAX_PER_ENTITY,
          select: { id: true, orderNumber: true, status: true },
        }).then((rows) => rows.map((r) => ({
          entity: 'sales-order', group: 'Sales Orders', id: r.id, title: r.orderNumber,
          subtitle: r.status, href: `/sales/orders?highlight=${r.id}`,
        }))),
      );
    }

    if (can('procurement.purchase-order.read')) {
      lookups.push(
        prisma.purchaseOrder.findMany({
          where: { tenantId, poNumber: contains },
          take: MAX_PER_ENTITY,
          select: { id: true, poNumber: true, status: true },
        }).then((rows) => rows.map((r) => ({
          entity: 'purchase-order', group: 'Purchase Orders', id: r.id, title: r.poNumber,
          subtitle: r.status, href: `/procurement/purchase-orders?highlight=${r.id}`,
        }))),
      );
    }

    if (can('projects.project.read')) {
      lookups.push(
        prisma.project.findMany({
          where: { tenantId, OR: [{ name: contains }, { code: contains }] },
          take: MAX_PER_ENTITY,
          select: { id: true, name: true, code: true },
        }).then((rows) => rows.map((r) => ({
          entity: 'project', group: 'Projects', id: r.id, title: r.name,
          subtitle: r.code, href: `/projects?highlight=${r.id}`,
        }))),
      );
    }

    const settled = await Promise.allSettled(lookups);
    return settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : []));
  }
}

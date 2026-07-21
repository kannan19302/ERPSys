import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class FinanceDemoDataService {
  /**
   * Get current demo data status for Finance module.
   */
  async getDemoStatus(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const records = await prisma.demoDataRecord.groupBy({
      by: ["entityType"],
      where: { tenantId, module: "finance" },
      _count: { id: true },
    });

    const entityCounts: Record<string, number> = {};
    let totalRecords = 0;
    for (const r of records) {
      entityCounts[r.entityType] = r._count.id;
      totalRecords += r._count.id;
    }

    return {
      loaded: totalRecords > 0,
      totalRecords,
      entityCounts,
      module: "finance",
    };
  }

  /**
   * Load sample demo data exclusively for Finance module.
   */
  async loadFinanceDemoData(tenantId: string, orgId?: string) {
    const status = await this.getDemoStatus(tenantId);
    if (status.loaded) {
      throw new BadRequestException(
        "Finance demo data is already loaded for this workspace.",
      );
    }

    const org = await prisma.organization.findFirst({ where: { tenantId } });
    const effectiveOrgId = orgId || org?.id || "org-system-default";
    const now = new Date();
    const createdRecords: Array<{ entityType: string; entityId: string }> = [];

    await prisma.$transaction(async (tx) => {
      // Find or create a demo customer for binding
      let demoCustomer = await tx.customer.findFirst({ where: { tenantId } });
      if (!demoCustomer) {
        demoCustomer = await tx.customer.create({
          data: {
            tenantId,
            orgId: effectiveOrgId,
            name: "Acme Corporation (Demo)",
            type: "COMPANY",
            email: "demo@acme-corp.com",
          },
        });
        createdRecords.push({
          entityType: "customer",
          entityId: demoCustomer.id,
        });
      }

      // 1. Seed Sample Invoices
      const sampleInvoices = [
        {
          invoiceNumber: "INV-DEMO-001",
          amount: 4500,
          paidAmount: 4500,
          status: "PAID",
          daysAgo: 45,
        },
        {
          invoiceNumber: "INV-DEMO-002",
          amount: 12800,
          paidAmount: 0,
          status: "SENT",
          daysAgo: 15,
        },
        {
          invoiceNumber: "INV-DEMO-003",
          amount: 8400,
          paidAmount: 2400,
          status: "PARTIAL",
          daysAgo: 60,
        },
        {
          invoiceNumber: "INV-DEMO-004",
          amount: 3100,
          paidAmount: 0,
          status: "OVERDUE",
          daysAgo: 75,
        },
        {
          invoiceNumber: "INV-DEMO-005",
          amount: 19500,
          paidAmount: 0,
          status: "DRAFT",
          daysAgo: 2,
        },
      ];

      for (const inv of sampleInvoices) {
        const issueDate = new Date(now.getTime() - inv.daysAgo * 86400000);
        const dueDate = new Date(issueDate.getTime() + 30 * 86400000);

        const createdInv = await tx.invoice.create({
          data: {
            tenantId,
            orgId: effectiveOrgId,
            customerId: demoCustomer.id,
            invoiceNumber: inv.invoiceNumber,
            status: inv.status as any,
            issueDate,
            dueDate,
            subtotal: new Prisma.Decimal(inv.amount * 0.9),
            taxAmount: new Prisma.Decimal(inv.amount * 0.1),
            totalAmount: new Prisma.Decimal(inv.amount),
            paidAmount: new Prisma.Decimal(inv.paidAmount),
            currency: "USD",
            notes: "Seeded demo data invoice",
          },
        });

        createdRecords.push({ entityType: "invoice", entityId: createdInv.id });

        // Seed payment if paid/partial
        if (inv.paidAmount > 0) {
          const createdPayment = await tx.payment.create({
            data: {
              tenantId,
              invoiceId: createdInv.id,
              amount: new Prisma.Decimal(inv.paidAmount),
              paidAt: new Date(issueDate.getTime() + 10 * 86400000),
              method: "CREDIT_CARD",
              reference: `PAY-DEMO-${createdInv.id.slice(0, 6)}`,
            },
          });
          createdRecords.push({
            entityType: "payment",
            entityId: createdPayment.id,
          });
        }
      }

      // 2. Track demo records in demoDataRecord
      for (const rec of createdRecords) {
        await tx.demoDataRecord.create({
          data: {
            tenantId,
            module: "finance",
            entityType: rec.entityType,
            entityId: rec.entityId,
          },
        });
      }
    });

    return {
      success: true,
      message: `Finance demo data populated successfully (${createdRecords.length} records created).`,
      count: createdRecords.length,
    };
  }

  /**
   * Unload / Safely purge sample demo data exclusively for Finance module.
   */
  async unloadFinanceDemoData(tenantId: string) {
    const records = await prisma.demoDataRecord.findMany({
      where: { tenantId, module: "finance" },
    });

    if (records.length === 0) {
      return {
        success: true,
        message: "No Finance demo data to unload.",
        count: 0,
      };
    }

    let removedCount = 0;

    for (const record of records) {
      try {
        if (record.entityType === "invoice") {
          await prisma.payment.deleteMany({
            where: { invoiceId: record.entityId },
          });
          await prisma.invoice.delete({ where: { id: record.entityId } });
          removedCount++;
        } else if (record.entityType === "payment") {
          await prisma.payment
            .delete({ where: { id: record.entityId } })
            .catch(() => null);
          removedCount++;
        } else if (record.entityType === "customer") {
          await prisma.customer
            .delete({ where: { id: record.entityId } })
            .catch(() => null);
          removedCount++;
        }
      } catch {
        // Already deleted or cascaded
      }
    }

    await prisma.demoDataRecord.deleteMany({
      where: { tenantId, module: "finance" },
    });

    return {
      success: true,
      message: `Finance demo data safely unloaded (${removedCount} records removed).`,
      count: removedCount,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class BulkOperationsService {

  /* ── Create & Execute ──────────────────────── */

  async create(
    tenantId: string,
    data: {
      operationType: 'MASS_UPDATE' | 'MASS_DELETE' | 'MASS_TRANSFER';
      entityType: string;
      criteria: Record<string, any>;
      changes: Record<string, any>;
    },
    userId: string,
  ) {
    const operation = await prisma.bulkOperation.create({
      data: {
        tenantId,
        operationType: data.operationType,
        entityType: data.entityType,
        criteria: data.criteria,
        changes: data.changes,
        status: 'PROCESSING',
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
        createdBy: userId,
      },
    });

    // Execute inline
    try {
      const result = await this.execute(tenantId, operation.id, data);
      return result;
    } catch (err) {
      await prisma.bulkOperation.update({
        where: { id: operation.id },
        data: { status: 'FAILED', errorLog: (err as Error).message },
      });
      throw err;
    }
  }

  private async execute(
    tenantId: string,
    operationId: string,
    data: {
      operationType: string;
      entityType: string;
      criteria: Record<string, any>;
      changes: Record<string, any>;
    },
  ) {
    const modelMap: Record<string, any> = {
      Customer: prisma.customer,
      Vendor: prisma.vendor,
      Product: prisma.product,
      Employee: prisma.employee,
      Invoice: prisma.invoice,
    };

    const model = modelMap[data.entityType];
    if (!model) throw new Error(`Unsupported entity type: ${data.entityType}`);

    const where = { tenantId, ...data.criteria };

    return prisma.$transaction(async (tx: any) => {
      const txModel = tx[data.entityType.charAt(0).toLowerCase() + data.entityType.slice(1)];

      // Count total matching records
      const totalRecords = await txModel.count({ where });

      let processedRecords = 0;
      let failedRecords = 0;

      if (data.operationType === 'MASS_UPDATE') {
        const result = await txModel.updateMany({ where, data: data.changes });
        processedRecords = result.count;
      } else if (data.operationType === 'MASS_DELETE') {
        // Soft-delete: set isActive=false or deletedAt
        const result = await txModel.updateMany({
          where,
          data: { isActive: false, deletedAt: new Date() },
        });
        processedRecords = result.count;
      } else if (data.operationType === 'MASS_TRANSFER') {
        // Transfer ownership
        const result = await txModel.updateMany({
          where,
          data: { ownerId: data.changes.ownerId },
        });
        processedRecords = result.count;
      }

      failedRecords = totalRecords - processedRecords;

      const updated = await tx.bulkOperation.update({
        where: { id: operationId },
        data: {
          status: 'COMPLETED',
          totalRecords,
          processedRecords,
          failedRecords: failedRecords > 0 ? failedRecords : 0,
          completedAt: new Date(),
        },
      });

      return updated;
    });
  }

  /* ── List ───────────────────────────────────── */

  async list(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.bulkOperation.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bulkOperation.count({ where: { tenantId } }),
    ]);
    return { data, total, page, limit };
  }

  /* ── Get By ID ─────────────────────────────── */

  async getById(tenantId: string, id: string) {
    const op = await prisma.bulkOperation.findFirst({
      where: { id, tenantId },
    });
    if (!op) throw new Error('Bulk operation not found');
    return op;
  }

  /* ── Entity Counts ─────────────────────────── */

  async getEntityCounts(tenantId: string) {
    const [customers, vendors, products, employees, invoices] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.vendor.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.employee.count({ where: { tenantId } }),
      prisma.invoice.count({ where: { tenantId } }),
    ]);
    return { Customer: customers, Vendor: vendors, Product: products, Employee: employees, Invoice: invoices };
  }
}

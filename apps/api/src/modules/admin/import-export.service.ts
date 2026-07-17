import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

interface ImportRow {
  [key: string]: unknown;
}

interface ValidationResult {
  valid: ImportRow[];
  errors: { row: number; field: string; message: string }[];
}

const MODEL_FIELDS: Record<string, { required: string[]; optional: string[] }> = {
  Customer: {
    required: ['name'],
    optional: ['type', 'email', 'phone', 'taxId', 'paymentTerms', 'status', 'notes'],
  },
  Vendor: {
    required: ['name'],
    optional: ['type', 'email', 'phone', 'taxId', 'paymentTerms', 'status', 'notes'],
  },
  Product: {
    required: ['sku', 'name', 'costPrice', 'sellPrice'],
    optional: ['type', 'description', 'category', 'brand', 'unit', 'barcode', 'isActive'],
  },
  Employee: {
    required: ['employeeCode', 'firstName', 'lastName', 'email', 'dateOfJoining'],
    optional: ['phone', 'designation', 'employmentType', 'status'],
  },
};

@Injectable()
export class ImportExportService {
  async validateImport(
    _tenantId: string,
    targetModel: string,
    rows: ImportRow[],
  ): Promise<ValidationResult> {
    const schema = MODEL_FIELDS[targetModel];
    if (!schema) {
      return { valid: [], errors: [{ row: 0, field: '_model', message: `Unsupported model: ${targetModel}` }] };
    }

    const valid: ImportRow[] = [];
    const errors: { row: number; field: string; message: string }[] = [];

    rows.forEach((row, idx) => {
      let rowValid = true;
      for (const field of schema.required) {
        if (!row[field] && row[field] !== 0) {
          errors.push({ row: idx + 1, field, message: `${field} is required` });
          rowValid = false;
        }
      }
      if (rowValid) valid.push(row);
    });

    return { valid, errors };
  }

  async executeImport(
    tenantId: string,
    orgId: string,
    targetModel: string,
    rows: ImportRow[],
  ): Promise<{ created: number; errors: { row: number; message: string }[] }> {
    let created = 0;
    const errors: { row: number; message: string }[] = [];

    const modelMap: Record<string, string> = {
      Customer: 'customer',
      Vendor: 'vendor',
      Product: 'product',
      Employee: 'employee',
    };

    const prismaModel = modelMap[targetModel];
    if (!prismaModel) {
      return { created: 0, errors: [{ row: 0, message: `Unsupported model: ${targetModel}` }] };
    }

    for (let i = 0; i < rows.length; i++) {
      try {
        const data: any = { ...rows[i], tenantId, orgId };

        // Convert numeric fields
        if (targetModel === 'Product') {
          if (data.costPrice) data.costPrice = parseFloat(data.costPrice);
          if (data.sellPrice) data.sellPrice = parseFloat(data.sellPrice);
        }
        if (data.paymentTerms) data.paymentTerms = parseInt(data.paymentTerms, 10);

        await (prisma as any)[prismaModel].create({ data });
        created++;
      } catch (err: any) {
        errors.push({ row: i + 1, message: err.message || 'Unknown error' });
      }
    }

    return { created, errors };
  }

  async exportData(
    tenantId: string,
    entityType: string,
    format: string,
    filters: { startDate?: string; endDate?: string },
  ): Promise<unknown[]> {
    const modelMap: Record<string, string> = {
      customers: 'customer',
      vendors: 'vendor',
      products: 'product',
      employees: 'employee',
      invoices: 'invoice',
    };

    const prismaModel = modelMap[entityType];
    if (!prismaModel) return [];

    const where: any = { tenantId };
    if (filters.startDate) {
      where.createdAt = { ...(where.createdAt || {}), gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(filters.endDate) };
    }

    const records = await (prisma as any)[prismaModel].findMany({ where, take: 10000 });

    if (format === 'csv') {
      // Return raw records — controller will convert to CSV
      return records;
    }

    return records;
  }

  async getImportHistory(tenantId: string) {
    // Return recent audit logs related to imports
    const logs = await prisma.auditLog.findMany({
      where: { tenantId, action: { in: ['IMPORT', 'BULK_CREATE'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return logs;
  }
}

import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

export interface SemanticField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  aggregatable: boolean;
}

export interface SemanticEntity {
  name: string;
  label: string;
  table: string;
  fields: SemanticField[];
}

@Injectable()
export class ReportingEngineService {

  getSemanticLayer(): SemanticEntity[] {
    return [
      {
        name: 'invoices', label: 'Invoices', table: 'Invoice',
        fields: [
          { name: 'invoiceNumber', label: 'Invoice #', type: 'string', aggregatable: false },
          { name: 'issueDate', label: 'Issue Date', type: 'date', aggregatable: false },
          { name: 'dueDate', label: 'Due Date', type: 'date', aggregatable: false },
          { name: 'totalAmount', label: 'Total Amount', type: 'number', aggregatable: true },
          { name: 'status', label: 'Status', type: 'string', aggregatable: false },
          { name: 'currency', label: 'Currency', type: 'string', aggregatable: false },
        ],
      },
      {
        name: 'salesOrders', label: 'Sales Orders', table: 'SalesOrder',
        fields: [
          { name: 'orderNumber', label: 'Order #', type: 'string', aggregatable: false },
          { name: 'orderDate', label: 'Order Date', type: 'date', aggregatable: false },
          { name: 'totalAmount', label: 'Total Amount', type: 'number', aggregatable: true },
          { name: 'status', label: 'Status', type: 'string', aggregatable: false },
        ],
      },
      {
        name: 'purchaseOrders', label: 'Purchase Orders', table: 'PurchaseOrder',
        fields: [
          { name: 'poNumber', label: 'PO #', type: 'string', aggregatable: false },
          { name: 'orderDate', label: 'Order Date', type: 'date', aggregatable: false },
          { name: 'totalAmount', label: 'Total Amount', type: 'number', aggregatable: true },
          { name: 'status', label: 'Status', type: 'string', aggregatable: false },
        ],
      },
      {
        name: 'products', label: 'Products', table: 'Product',
        fields: [
          { name: 'sku', label: 'SKU', type: 'string', aggregatable: false },
          { name: 'name', label: 'Product Name', type: 'string', aggregatable: false },
          { name: 'sellingPrice', label: 'Selling Price', type: 'number', aggregatable: true },
          { name: 'standardRate', label: 'Standard Rate', type: 'number', aggregatable: true },
        ],
      },
      {
        name: 'employees', label: 'Employees', table: 'Employee',
        fields: [
          { name: 'employeeId', label: 'Employee ID', type: 'string', aggregatable: false },
          { name: 'firstName', label: 'First Name', type: 'string', aggregatable: false },
          { name: 'lastName', label: 'Last Name', type: 'string', aggregatable: false },
          { name: 'status', label: 'Status', type: 'string', aggregatable: false },
          { name: 'hireDate', label: 'Hire Date', type: 'date', aggregatable: false },
        ],
      },
      {
        name: 'leads', label: 'CRM Leads', table: 'Lead',
        fields: [
          { name: 'company', label: 'Company', type: 'string', aggregatable: false },
          { name: 'status', label: 'Status', type: 'string', aggregatable: false },
          { name: 'score', label: 'Lead Score', type: 'number', aggregatable: true },
          { name: 'annualRevenue', label: 'Annual Revenue', type: 'number', aggregatable: true },
        ],
      },
    ];
  }

  async executeQuery(
    tenantId: string,
    entity: string,
    options: {
      filters?: Record<string, unknown>;
      groupBy?: string[];
      orderBy?: string;
      orderDir?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
      aggregations?: Array<{ field: string; fn: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' }>;
    } = {},
  ) {
    const semanticLayer = this.getSemanticLayer();
    const entityDef = semanticLayer.find((e) => e.name === entity);
    if (!entityDef) {
      return { error: `Unknown entity: ${entity}`, data: [] };
    }

    const model = (prisma as any)[entityDef.table.charAt(0).toLowerCase() + entityDef.table.slice(1)];
    if (!model) {
      return { error: `Model not accessible: ${entityDef.table}`, data: [] };
    }

    const where: Record<string, unknown> = { tenantId };
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        const field = entityDef.fields.find((f) => f.name === key);
        if (field) {
          if (field.type === 'date' && typeof value === 'object' && value !== null) {
            where[key] = value;
          } else {
            where[key] = value;
          }
        }
      }
    }

    if (options.groupBy && options.groupBy.length > 0 && options.aggregations) {
      const groupBy = options.groupBy.filter((g) => entityDef.fields.some((f) => f.name === g));
      const _sum: Record<string, boolean> = {};
      const _avg: Record<string, boolean> = {};
      const _count: Record<string, boolean> = {};

      for (const agg of options.aggregations) {
        if (agg.fn === 'SUM') _sum[agg.field] = true;
        else if (agg.fn === 'AVG') _avg[agg.field] = true;
        else if (agg.fn === 'COUNT') _count[agg.field] = true;
      }

      const result = await model.groupBy({
        by: groupBy,
        where,
        _sum: Object.keys(_sum).length > 0 ? _sum : undefined,
        _avg: Object.keys(_avg).length > 0 ? _avg : undefined,
        _count: Object.keys(_count).length > 0 ? _count : undefined,
        take: options.limit || 100,
      });

      return { entity, grouped: true, count: result.length, data: result };
    }

    const data = await model.findMany({
      where,
      orderBy: options.orderBy ? { [options.orderBy]: options.orderDir || 'desc' } : undefined,
      take: options.limit || 100,
      skip: options.offset || 0,
    });

    const total = await model.count({ where });

    return { entity, grouped: false, count: data.length, total, data };
  }

  async getScheduledReports(tenantId: string) {
    return prisma.reportView.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

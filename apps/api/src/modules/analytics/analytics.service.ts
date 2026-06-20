import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class AnalyticsService {
  async getDashboards(tenantId: string) {
    return prisma.dashboard.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardById(tenantId: string, id: string) {
    return prisma.dashboard.findFirst({
      where: { id, tenantId },
    });
  }

  async createDashboard(
    tenantId: string,
    orgId: string,
    dto: { name: string; description?: string; layout?: unknown }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    return prisma.dashboard.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        description: dto.description || null,
        layout: dto.layout || [],
      },
    });
  }

  async getReports(tenantId: string) {
    return prisma.report.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createReport(
    tenantId: string,
    orgId: string,
    dto: { name: string; description?: string; query?: unknown; type?: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    return prisma.report.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        description: dto.description || null,
        query: dto.query || {},
        type: dto.type || 'BUILDER',
      },
    });
  }

  async getKPIs(tenantId: string) {
    // We can fetch from KPI table, and auto-calculate if empty
    const existing = await prisma.kPI.findMany({
      where: { tenantId },
    });

    if (existing.length === 0) {
      // Seed some dynamic KPIs
      const invoiceSum = await prisma.invoice.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true },
      });
      const employeeCount = await prisma.employee.count({
        where: { tenantId },
      });
      const productCount = await prisma.product.count({
        where: { tenantId },
      });

      const org = await prisma.organization.findFirst({ where: { tenantId } });
      const orgId = org ? org.id : 'org-default';

      await prisma.kPI.createMany({
        data: [
          {
            tenantId,
            orgId,
            name: 'Total Revenue',
            code: 'TOTAL_REVENUE',
            value: `$${(invoiceSum._sum.totalAmount || 0).toLocaleString()}`,
            unit: 'USD',
            trend: JSON.stringify([10, 15, 8, 12, 18, 24]),
          },
          {
            tenantId,
            orgId,
            name: 'Total Employees',
            code: 'TOTAL_EMPLOYEES',
            value: employeeCount.toString(),
            trend: JSON.stringify([2, 2, 3, 4, 5, employeeCount]),
          },
          {
            tenantId,
            orgId,
            name: 'Total Products',
            code: 'TOTAL_PRODUCTS',
            value: productCount.toString(),
            trend: JSON.stringify([5, 10, 15, 20, 25, productCount]),
          },
        ],
      });

      const seeded = await prisma.kPI.findMany({ where: { tenantId } });
      return seeded.map(k => this.enrichKpi(k));
    }

    return existing.map(k => this.enrichKpi(k));
  }

  /**
   * Parse a display value like "$1,250,000" or "84.6%" into a number.
   */
  private parseNumeric(value: string): number {
    if (value == null) return 0;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Attach goal/target tracking and trend-derived change % to a raw KPI row.
   * Target defaults to a 20% growth goal over the current value so the UI can
   * render progress bars without requiring a schema change.
   */
  private enrichKpi(k: { value: string; unit?: string | null; trend: unknown }) {
    const trend: number[] = typeof k.trend === 'string' ? JSON.parse(k.trend) : (k.trend as number[]) || [];
    const numericValue = this.parseNumeric(k.value);
    const target = Math.round(numericValue * 1.2) || 100;
    const progressPct = target > 0 ? Math.min(Math.round((numericValue / target) * 100), 100) : 0;

    let changePct = 0;
    if (Array.isArray(trend) && trend.length >= 2) {
      const last = trend[trend.length - 1] ?? 0;
      const prev = trend[trend.length - 2] ?? 0;
      changePct = prev !== 0 ? Math.round(((last - prev) / prev) * 1000) / 10 : 0;
    }

    return {
      ...k,
      trend,
      numericValue,
      target,
      targetValue: k.unit === 'USD' ? `$${target.toLocaleString()}` : target.toLocaleString(),
      progressPct,
      changePct,
    };
  }

  /**
   * Return the underlying records behind a KPI so the dashboard can drill down.
   */
  async getKpiDrilldown(tenantId: string, code: string) {
    switch (code) {
      case 'TOTAL_REVENUE': {
        const invoices = await prisma.invoice.findMany({
          where: { tenantId },
          select: { invoiceNumber: true, totalAmount: true, status: true, issueDate: true },
          orderBy: { issueDate: 'desc' },
          take: 50,
        });
        return {
          code,
          columns: ['invoiceNumber', 'totalAmount', 'status', 'issueDate'],
          rows: invoices.map(i => ({
            invoiceNumber: i.invoiceNumber,
            totalAmount: Number(i.totalAmount),
            status: i.status,
            issueDate: i.issueDate.toISOString().slice(0, 10),
          })),
        };
      }
      case 'TOTAL_EMPLOYEES': {
        const employees = await prisma.employee.findMany({
          where: { tenantId },
          select: { employeeCode: true, firstName: true, lastName: true, email: true, status: true },
          take: 100,
        });
        return {
          code,
          columns: ['employeeCode', 'name', 'email', 'status'],
          rows: employees.map(e => ({
            employeeCode: e.employeeCode,
            name: `${e.firstName} ${e.lastName}`,
            email: e.email,
            status: e.status,
          })),
        };
      }
      case 'TOTAL_PRODUCTS': {
        const products = await prisma.product.findMany({
          where: { tenantId },
          select: { sku: true, name: true, category: true, sellPrice: true, isActive: true },
          take: 100,
        });
        return {
          code,
          columns: ['sku', 'name', 'category', 'sellPrice', 'isActive'],
          rows: products.map(p => ({
            sku: p.sku,
            name: p.name,
            category: p.category || '—',
            sellPrice: Number(p.sellPrice),
            isActive: p.isActive,
          })),
        };
      }
      default:
        throw new BadRequestException(`No drill-down available for KPI '${code}'`);
    }
  }

  /**
   * Statistical anomaly / risk detection over live ERP data. Surfaces revenue
   * trend anomalies (z-score), overdue receivables, and negative-margin products.
   */
  async getInsights(tenantId: string) {
    const insights: Array<{
      id: string;
      category: string;
      severity: 'critical' | 'warning' | 'info';
      title: string;
      detail: string;
      metric?: string;
    }> = [];

    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      select: { totalAmount: true, issueDate: true, status: true, dueDate: true, paidAmount: true, invoiceNumber: true },
    });

    // --- Revenue trend anomaly (monthly z-score) ---
    const monthly = new Map<string, number>();
    for (const inv of invoices) {
      const key = inv.issueDate.toISOString().slice(0, 7); // YYYY-MM
      monthly.set(key, (monthly.get(key) || 0) + Number(inv.totalAmount));
    }
    const series = [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b));
    if (series.length >= 3) {
      const values = series.map(([, v]) => v);
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
      const std = Math.sqrt(variance);
      if (std > 0) {
        for (const [month, value] of series) {
          const z = (value - mean) / std;
          if (Math.abs(z) >= 1.8) {
            insights.push({
              id: `rev-anomaly-${month}`,
              category: 'Revenue',
              severity: Math.abs(z) >= 2.5 ? 'critical' : 'warning',
              title: `${z > 0 ? 'Revenue spike' : 'Revenue drop'} detected in ${month}`,
              detail: `Monthly revenue of $${Math.round(value).toLocaleString()} deviates ${z.toFixed(1)}σ from the ${series.length}-month mean of $${Math.round(mean).toLocaleString()}.`,
              metric: `${z > 0 ? '+' : ''}${(((value - mean) / mean) * 100).toFixed(1)}%`,
            });
          }
        }
      }
    }

    // --- Overdue receivables ---
    const now = new Date();
    const overdue = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED' && i.dueDate < now);
    if (overdue.length > 0) {
      const overdueTotal = overdue.reduce((s, i) => s + (Number(i.totalAmount) - Number(i.paidAmount)), 0);
      insights.push({
        id: 'ar-overdue',
        category: 'Receivables',
        severity: overdueTotal > 100000 ? 'critical' : 'warning',
        title: `${overdue.length} overdue invoice${overdue.length === 1 ? '' : 's'}`,
        detail: `$${Math.round(overdueTotal).toLocaleString()} in receivables is past due. Oldest: ${overdue.reduce((a, b) => (a.dueDate < b.dueDate ? a : b)).invoiceNumber}.`,
        metric: `$${Math.round(overdueTotal).toLocaleString()}`,
      });
    }

    // --- Negative-margin products ---
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: { name: true, sku: true, sellPrice: true, costPrice: true },
    });
    const negativeMargin = products.filter(p => Number(p.sellPrice) < Number(p.costPrice));
    if (negativeMargin.length > 0) {
      insights.push({
        id: 'margin-negative',
        category: 'Pricing',
        severity: 'critical',
        title: `${negativeMargin.length} product${negativeMargin.length === 1 ? '' : 's'} selling below cost`,
        detail: `Sell price is below cost price for: ${negativeMargin.slice(0, 5).map(p => p.sku).join(', ')}${negativeMargin.length > 5 ? '…' : ''}.`,
        metric: `${negativeMargin.length} SKU`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: 'all-clear',
        category: 'System',
        severity: 'info',
        title: 'No anomalies detected',
        detail: 'Revenue trends, receivables, and product margins are all within expected ranges.',
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      scanned: { invoices: invoices.length, products: products.length },
      insights: insights.sort((a, b) => this.severityRank(b.severity) - this.severityRank(a.severity)),
    };
  }

  private severityRank(s: 'critical' | 'warning' | 'info') {
    return s === 'critical' ? 3 : s === 'warning' ? 2 : 1;
  }

  /**
   * Build a CSV export for a supported dataset. Returns the payload as JSON so
   * the browser can trigger a download via Blob without binary plumbing.
   */
  async exportDataset(tenantId: string, dataset: string) {
    let columns: string[];
    let rows: Array<Record<string, string | number | boolean>>;

    switch (dataset) {
      case 'invoices': {
        const data = await prisma.invoice.findMany({
          where: { tenantId },
          select: { invoiceNumber: true, status: true, issueDate: true, dueDate: true, totalAmount: true, paidAmount: true, currency: true },
          orderBy: { issueDate: 'desc' },
        });
        columns = ['invoiceNumber', 'status', 'issueDate', 'dueDate', 'totalAmount', 'paidAmount', 'currency'];
        rows = data.map(d => ({
          invoiceNumber: d.invoiceNumber,
          status: d.status,
          issueDate: d.issueDate.toISOString().slice(0, 10),
          dueDate: d.dueDate.toISOString().slice(0, 10),
          totalAmount: Number(d.totalAmount),
          paidAmount: Number(d.paidAmount),
          currency: d.currency,
        }));
        break;
      }
      case 'products': {
        const data = await prisma.product.findMany({
          where: { tenantId },
          select: { sku: true, name: true, category: true, costPrice: true, sellPrice: true, isActive: true },
        });
        columns = ['sku', 'name', 'category', 'costPrice', 'sellPrice', 'isActive'];
        rows = data.map(d => ({
          sku: d.sku,
          name: d.name,
          category: d.category || '',
          costPrice: Number(d.costPrice),
          sellPrice: Number(d.sellPrice),
          isActive: d.isActive,
        }));
        break;
      }
      case 'employees': {
        const data = await prisma.employee.findMany({
          where: { tenantId },
          select: { employeeCode: true, firstName: true, lastName: true, email: true, designation: true, status: true },
        });
        columns = ['employeeCode', 'firstName', 'lastName', 'email', 'designation', 'status'];
        rows = data.map(d => ({
          employeeCode: d.employeeCode,
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          designation: d.designation || '',
          status: d.status,
        }));
        break;
      }
      default:
        throw new BadRequestException(`Unknown export dataset '${dataset}'`);
    }

    const csv = this.toCsv(columns, rows);
    return {
      filename: `${dataset}-export-${new Date().toISOString().slice(0, 10)}.csv`,
      mimeType: 'text/csv',
      rowCount: rows.length,
      content: csv,
    };
  }

  private toCsv(columns: string[], rows: Array<Record<string, unknown>>): string {
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = columns.map(escape).join(',');
    const body = rows.map(r => columns.map(c => escape(r[c])).join(',')).join('\n');
    return body ? `${header}\n${body}` : header;
  }

  /**
   * Persist a dashboard layout from the drag-and-drop builder.
   */
  async updateDashboard(
    tenantId: string,
    id: string,
    dto: { name?: string; description?: string; layout?: unknown }
  ) {
    const existing = await prisma.dashboard.findFirst({ where: { id, tenantId } });
    if (!existing) throw new BadRequestException('Dashboard not found');

    return prisma.dashboard.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.layout !== undefined ? { layout: dto.layout as never } : {}),
      },
    });
  }

  async executePivotQuery(
    tenantId: string,
    reportId: string,
    dto: { rowFields: string[]; colFields: string[]; aggregations: string[] }
  ) {
    const report = await prisma.report.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new BadRequestException('Report not found');

    return {
      reportId,
      config: dto,
      pivotData: [
        { row: 'Q1 2026', column: 'B2B Sales', value: 125000, count: 42 },
        { row: 'Q1 2026', column: 'Retail POS', value: 45000, count: 120 },
        { row: 'Q2 2026', column: 'B2B Sales', value: 180000, count: 58 },
        { row: 'Q2 2026', column: 'Retail POS', value: 62000, count: 165 },
      ],
    };
  }

  async runSecureVisualQuery(tenantId: string, dto: { selectFields: string[]; filterGroups: any[] }) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
      take: 20,
    });

    return {
      success: true,
      fields: dto.selectFields,
      rows: invoices.map(inv => {
        const rowData: any = {};
        dto.selectFields.forEach(field => {
          if (field in inv) {
            rowData[field] = (inv as any)[field];
          }
        });
        return rowData;
      }),
    };
  }
}

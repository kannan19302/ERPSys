// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class RealEstateFinancialsService {
  // RealEstatePropertyFinancial only stores `propertyId` — the schema has no
  // `property` relation to `include`, so it's batched in manually.
  private async attachProperty<T extends { propertyId: string }>(
    tenantId: string,
    rows: T[],
  ) {
    const properties = await prisma.realEstateProperty.findMany({
      where: { tenantId, id: { in: rows.map((r) => r.propertyId) } },
      select: { id: true, name: true, type: true },
    });
    const byId = new Map(properties.map((p) => [p.id, p]));
    return rows.map((r) => ({
      ...r,
      property: byId.get(r.propertyId) || null,
    }));
  }

  async getFinancials(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    if (query.fromDate)
      where.periodEnd = {
        ...(where.periodEnd || {}),
        gte: new Date(query.fromDate),
      };
    if (query.toDate)
      where.periodStart = {
        ...(where.periodStart || {}),
        lte: new Date(query.toDate),
      };
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      prisma.realEstatePropertyFinancial.findMany({
        where,
        orderBy: [{ periodStart: "desc" }, { propertyId: "asc" }],
        skip,
        take: limit,
      }),
      prisma.realEstatePropertyFinancial.count({ where }),
    ]);
    const data = await this.attachProperty(tenantId, rows);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getFinancialById(tenantId: string, id: string) {
    const f = await prisma.realEstatePropertyFinancial.findFirst({
      where: { tenantId, id },
    });
    if (!f) throw new NotFoundException("Property financial record not found");
    const [result] = await this.attachProperty(tenantId, [f]);
    return result;
  }

  async createFinancial(tenantId: string, data: any) {
    const calculated = this.calculateFinancials(data);
    const created = await prisma.realEstatePropertyFinancial.create({
      data: {
        ...data,
        tenantId,
        ...calculated,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
      },
    });
    const [result] = await this.attachProperty(tenantId, [created]);
    return result;
  }

  async updateFinancial(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstatePropertyFinancial.findFirst({
      where: { tenantId, id },
    });
    if (!existing)
      throw new NotFoundException("Property financial record not found");
    const updateData: any = { ...data };
    if (data.periodStart) updateData.periodStart = new Date(data.periodStart);
    if (data.periodEnd) updateData.periodEnd = new Date(data.periodEnd);
    const calculated = this.calculateFinancials({ ...existing, ...updateData });
    Object.assign(updateData, calculated);
    const updated = await prisma.realEstatePropertyFinancial.update({
      where: { id },
      data: updateData,
    });
    const [result] = await this.attachProperty(tenantId, [updated]);
    return result;
  }

  async deleteFinancial(tenantId: string, id: string) {
    const existing = await prisma.realEstatePropertyFinancial.findFirst({
      where: { tenantId, id },
    });
    if (!existing)
      throw new NotFoundException("Property financial record not found");
    return prisma.realEstatePropertyFinancial.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getPropertySummary(tenantId: string, propertyId: string) {
    const records = await prisma.realEstatePropertyFinancial.findMany({
      where: { tenantId, propertyId, isActive: true },
      orderBy: { periodStart: "desc" },
      take: 12,
    });
    const property = await prisma.realEstateProperty.findFirst({
      where: { tenantId, id: propertyId },
    });
    if (!property) throw new NotFoundException("Property not found");
    const latest = records.length > 0 ? records[0] : null;
    return { property, records, latest, recordCount: records.length };
  }

  async getExpenseCategories(tenantId: string) {
    return prisma.realEstateExpenseCategory.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createExpenseCategory(tenantId: string, data: any) {
    return prisma.realEstateExpenseCategory.create({
      data: { ...data, tenantId },
    });
  }

  async updateExpenseCategory(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateExpenseCategory.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Expense category not found");
    return prisma.realEstateExpenseCategory.update({ where: { id }, data });
  }

  async deleteExpenseCategory(tenantId: string, id: string) {
    const existing = await prisma.realEstateExpenseCategory.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Expense category not found");
    return prisma.realEstateExpenseCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getPortfolioSummary(tenantId: string) {
    const [properties, financials] = await Promise.all([
      prisma.realEstateProperty.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, type: true },
      }),
      prisma.realEstatePropertyFinancial.findMany({
        where: { tenantId, isActive: true, status: "FINAL" },
        orderBy: { periodStart: "desc" },
      }),
    ]);
    const financialsWithProperty = await this.attachProperty(
      tenantId,
      financials,
    );
    const propertyLatest = new Map<string, any>();
    for (const f of financialsWithProperty) {
      if (
        !propertyLatest.has(f.propertyId) ||
        f.periodStart > propertyLatest.get(f.propertyId).periodStart
      ) {
        propertyLatest.set(f.propertyId, f);
      }
    }
    const totalNOI = Array.from(propertyLatest.values()).reduce(
      (sum, f) => sum + Number(f.netOperatingIncome || 0),
      0,
    );
    const totalIncome = Array.from(propertyLatest.values()).reduce(
      (sum, f) => sum + Number(f.effectiveIncome || 0),
      0,
    );
    const totalExpenses = Array.from(propertyLatest.values()).reduce(
      (sum, f) => sum + Number(f.totalExpenses || 0),
      0,
    );
    return {
      propertyCount: properties.length,
      totalNOI,
      totalIncome,
      totalExpenses,
      properties: Array.from(propertyLatest.values()),
    };
  }

  private calculateFinancials(data: any) {
    const grossRentIncome = Number(data.grossRentIncome || 0);
    const otherIncome = Number(data.otherIncome || 0);
    const vacancyLoss = Number(data.vacancyLoss || 0);
    const totalIncome = grossRentIncome + otherIncome;
    const effectiveIncome = totalIncome - vacancyLoss;
    const operatingExpenses = Number(data.operatingExpenses || 0);
    const repairsMaintenance = Number(data.repairsMaintenance || 0);
    const propertyManagement = Number(data.propertyManagement || 0);
    const insurance = Number(data.insurance || 0);
    const taxes = Number(data.taxes || 0);
    const utilities = Number(data.utilities || 0);
    const hoaFees = Number(data.hoaFees || 0);
    const otherExpenses = Number(data.otherExpenses || 0);
    const totalExpenses =
      operatingExpenses +
      repairsMaintenance +
      propertyManagement +
      insurance +
      taxes +
      utilities +
      hoaFees +
      otherExpenses;
    const netOperatingIncome = effectiveIncome - totalExpenses;
    const debtService = Number(data.debtService || 0);
    const cashFlowBeforeTax = netOperatingIncome - debtService;
    const capitalExpenditures = Number(data.capitalExpenditures || 0);
    const netCashFlow = cashFlowBeforeTax - capitalExpenditures;
    return {
      totalIncome,
      effectiveIncome,
      totalExpenses,
      netOperatingIncome,
      cashFlowBeforeTax,
      netCashFlow,
    };
  }
}

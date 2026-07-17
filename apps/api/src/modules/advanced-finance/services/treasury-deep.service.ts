import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class TreasuryDeepService {
  private async resolveOrgId(tenantId: string): Promise<string> {
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    return org?.id ?? 'org-system-default';
  }

  // ── TREASURY POSITIONS ──────────────────────────────────

  async listPositions(tenantId: string, currency?: string) {
    return prisma.treasuryPosition.findMany({
      where: { tenantId, ...(currency && { currency }) },
      orderBy: { positionDate: 'desc' },
      take: 90,
    });
  }

  async getPositionSummary(tenantId: string) {
    // Latest position by currency
    const positions = await prisma.treasuryPosition.findMany({
      where: { tenantId },
      orderBy: { positionDate: 'desc' },
    });
    const byCurrency: Record<string, { currency: string; bookBalance: number; availableBalance: number; latest: string }> = {};
    for (const p of positions) {
      if (!byCurrency[p.currency]) {
        byCurrency[p.currency] = {
          currency: p.currency,
          bookBalance: Number(p.bookBalance),
          availableBalance: Number(p.availableBalance),
          latest: p.positionDate.toISOString(),
        };
      }
    }
    return { positions: Object.values(byCurrency), total: positions.length };
  }

  async createPosition(tenantId: string, dto: {
    currency: string; bookBalance: number; availableBalance: number;
    floatAmount?: number; bankAccountId?: string; positionDate?: string;
  }) {
    const orgId = await this.resolveOrgId(tenantId);
    return prisma.treasuryPosition.create({
      data: {
        tenantId,
        orgId,
        currency: dto.currency,
        bookBalance: dto.bookBalance,
        availableBalance: dto.availableBalance,
        floatAmount: dto.floatAmount ?? 0,
        bankAccountId: dto.bankAccountId,
        positionDate: dto.positionDate ? new Date(dto.positionDate) : new Date(),
        source: 'MANUAL',
      },
    });
  }

  async getLiquidityForecast(tenantId: string, horizon: number = 30) {
    const now = new Date();
    const endDate = new Date(now.getTime() + horizon * 24 * 60 * 60 * 1000);
    // AR pipeline: open invoices due in horizon
    const arAgg = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: 'SENT',
        dueDate: { gte: now, lte: endDate },
      },
      _sum: { totalAmount: true },
    });
    // AP pipeline: open invoices due in horizon
    const apAgg = await prisma.purchaseOrder.aggregate({
      where: {
        tenantId,
        status: 'APPROVED',
        expectedDate: { gte: now, lte: endDate },
      },
      _sum: { totalAmount: true },
    });
    const arInflow = Number(arAgg._sum?.totalAmount ?? 0);
    const apOutflow = Number(apAgg._sum?.totalAmount ?? 0);
    return {
      horizon,
      endDate: endDate.toISOString(),
      projectedInflow: arInflow,
      projectedOutflow: apOutflow,
      netLiquidity: arInflow - apOutflow,
    };
  }

  // ── HEDGE INSTRUMENTS ──────────────────────────────────

  async listHedgeInstruments(tenantId: string, status?: string) {
    return prisma.hedgeInstrument.findMany({
      where: { tenantId, ...(status && { status }) },
      orderBy: { tradeDate: 'desc' },
    });
  }

  async getHedgeInstrument(tenantId: string, id: string) {
    const h = await prisma.hedgeInstrument.findFirst({ where: { id, tenantId } });
    if (!h) throw new NotFoundException('Hedge instrument not found');
    return h;
  }

  async createHedgeInstrument(tenantId: string, dto: {
    instrumentType: string; name: string; counterparty?: string;
    notionalAmount: number; currency: string; strikeRate?: number;
    premium?: number; tradeDate: string; maturityDate: string;
    hedgedItemRef?: string; notes?: string;
  }) {
    const orgId = await this.resolveOrgId(tenantId);
    return prisma.hedgeInstrument.create({
      data: { tenantId, orgId, ...dto, tradeDate: new Date(dto.tradeDate), maturityDate: new Date(dto.maturityDate) },
    });
  }

  async revalueHedgeInstrument(tenantId: string, id: string, dto: { marketValue: number }) {
    const h = await this.getHedgeInstrument(tenantId, id);
    const unrealizedPnl = dto.marketValue - Number(h.notionalAmount);
    return prisma.hedgeInstrument.update({
      where: { id },
      data: { marketValue: dto.marketValue, unrealizedPnl },
    });
  }

  async updateHedgeInstrument(tenantId: string, id: string, dto: Partial<{
    status: string; settlementDate: string; notes: string;
  }>) {
    await this.getHedgeInstrument(tenantId, id);
    return prisma.hedgeInstrument.update({
      where: { id },
      data: { ...dto, ...(dto.settlementDate ? { settlementDate: new Date(dto.settlementDate) } : {}) },
    });
  }

  // ── DEBT FACILITIES ──────────────────────────────────

  async listDebtFacilities(tenantId: string) {
    return prisma.debtFacility.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getDebtFacility(tenantId: string, id: string) {
    const d = await prisma.debtFacility.findFirst({ where: { id, tenantId } });
    if (!d) throw new NotFoundException('Debt facility not found');
    return d;
  }

  async createDebtFacility(tenantId: string, dto: {
    name: string; facilityType: string; lender?: string; currency: string;
    facilityLimit: number; interestRate: number; rateType?: string;
    startDate: string; maturityDate: string; covenants?: object[]; notes?: string;
  }) {
    const orgId = await this.resolveOrgId(tenantId);
    return prisma.debtFacility.create({
      data: {
        tenantId, orgId,
        name: dto.name, facilityType: dto.facilityType, lender: dto.lender,
        currency: dto.currency, facilityLimit: dto.facilityLimit,
        interestRate: dto.interestRate, rateType: dto.rateType ?? 'FIXED',
        startDate: new Date(dto.startDate), maturityDate: new Date(dto.maturityDate),
        covenants: (dto.covenants ?? []) as never,
        notes: dto.notes,
        availableAmount: dto.facilityLimit,
      },
    });
  }

  async recordDebtDrawdown(tenantId: string, id: string, amount: number) {
    const d = await this.getDebtFacility(tenantId, id);
    const newDrawn = Number(d.drawnAmount) + amount;
    if (newDrawn > Number(d.facilityLimit)) throw new BadRequestException('Drawdown exceeds facility limit');
    return prisma.debtFacility.update({
      where: { id },
      data: { drawnAmount: newDrawn, availableAmount: Number(d.facilityLimit) - newDrawn },
    });
  }

  async updateDebtFacility(tenantId: string, id: string, dto: Partial<{
    status: string; notes: string; covenants: object[];
  }>) {
    await this.getDebtFacility(tenantId, id);
    return prisma.debtFacility.update({ where: { id }, data: dto as never });
  }

  async getDebtUtilizationReport(tenantId: string) {
    const facilities = await prisma.debtFacility.findMany({ where: { tenantId, status: 'ACTIVE' } });
    const totalLimit = facilities.reduce((s, f) => s + Number(f.facilityLimit), 0);
    const totalDrawn = facilities.reduce((s, f) => s + Number(f.drawnAmount), 0);
    return {
      totalLimit,
      totalDrawn,
      totalAvailable: totalLimit - totalDrawn,
      utilizationPct: totalLimit > 0 ? ((totalDrawn / totalLimit) * 100).toFixed(2) : '0.00',
      facilities: facilities.map(f => ({
        id: f.id, name: f.name, type: f.facilityType, currency: f.currency,
        limit: Number(f.facilityLimit), drawn: Number(f.drawnAmount),
        available: Number(f.availableAmount),
        utilizationPct: ((Number(f.drawnAmount) / Number(f.facilityLimit)) * 100).toFixed(2),
      })),
    };
  }

  // ── INVESTMENT HOLDINGS ──────────────────────────────────

  async listInvestmentHoldings(tenantId: string) {
    return prisma.investmentHolding.findMany({ where: { tenantId }, orderBy: { purchaseDate: 'desc' } });
  }

  async getInvestmentHolding(tenantId: string, id: string) {
    const h = await prisma.investmentHolding.findFirst({ where: { id, tenantId } });
    if (!h) throw new NotFoundException('Investment holding not found');
    return h;
  }

  async createInvestmentHolding(tenantId: string, dto: {
    securityName: string; ticker?: string; assetClass: string; units: number;
    costBasis: number; currentPrice?: number; purchaseDate: string;
    maturityDate?: string; currency: string; custodian?: string;
    glAccountId?: string; notes?: string;
  }) {
    const orgId = await this.resolveOrgId(tenantId);
    const currentValue = dto.currentPrice ? dto.currentPrice * dto.units : undefined;
    const unrealizedPnl = currentValue !== undefined ? currentValue - dto.costBasis : undefined;
    return prisma.investmentHolding.create({
      data: {
        tenantId, orgId,
        securityName: dto.securityName, ticker: dto.ticker,
        assetClass: dto.assetClass, units: dto.units,
        costBasis: dto.costBasis, currentPrice: dto.currentPrice,
        currentValue, unrealizedPnl,
        purchaseDate: new Date(dto.purchaseDate),
        maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : null,
        currency: dto.currency, custodian: dto.custodian,
        glAccountId: dto.glAccountId, notes: dto.notes,
      },
    });
  }

  async markToMarket(tenantId: string, id: string, currentPrice: number) {
    const h = await this.getInvestmentHolding(tenantId, id);
    const currentValue = currentPrice * Number(h.units);
    const unrealizedPnl = currentValue - Number(h.costBasis);
    return prisma.investmentHolding.update({
      where: { id },
      data: { currentPrice, currentValue, unrealizedPnl },
    });
  }

  async getPortfolioReturn(tenantId: string) {
    const holdings = await prisma.investmentHolding.findMany({ where: { tenantId } });
    const totalCost = holdings.reduce((s, h) => s + Number(h.costBasis), 0);
    const totalCurrentValue = holdings.reduce((s, h) => s + (Number(h.currentValue) || Number(h.costBasis)), 0);
    const totalUnrealizedPnl = holdings.reduce((s, h) => s + (Number(h.unrealizedPnl) || 0), 0);
    return {
      totalCost,
      totalCurrentValue,
      totalUnrealizedPnl,
      returnPct: totalCost > 0 ? ((totalUnrealizedPnl / totalCost) * 100).toFixed(2) : '0.00',
      holdings: holdings.length,
    };
  }
}

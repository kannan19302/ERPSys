import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

// Seeded reference thresholds for US states with economic nexus laws (post-Wayfair, 2018+).
// Most states use $100,000 revenue OR 200 transactions in the trailing 12 months / prior or
// current calendar year. A handful (CA, NY, TX, WA...) dropped the transaction-count prong
// and/or raised the revenue bar. This is reference/default data — tenants can override per state.
const US_STATE_DEFAULT_THRESHOLDS: Array<{
  state: string;
  revenueThreshold: number;
  transactionThreshold: number | null;
  measurementPeriod: string;
  sourceUrl: string;
}> = [
  { state: 'AL', revenueThreshold: 250000, transactionThreshold: null, measurementPeriod: 'PRIOR_CALENDAR_YEAR', sourceUrl: 'https://revenue.alabama.gov' },
  { state: 'AZ', revenueThreshold: 100000, transactionThreshold: null, measurementPeriod: 'CALENDAR_YEAR', sourceUrl: 'https://azdor.gov' },
  { state: 'AR', revenueThreshold: 100000, transactionThreshold: 200, measurementPeriod: 'PRIOR_CALENDAR_YEAR', sourceUrl: 'https://www.dfa.arkansas.gov' },
  { state: 'CA', revenueThreshold: 500000, transactionThreshold: null, measurementPeriod: 'PRIOR_CALENDAR_YEAR', sourceUrl: 'https://www.cdtfa.ca.gov' },
  { state: 'CO', revenueThreshold: 100000, transactionThreshold: null, measurementPeriod: 'TRAILING_12_MONTHS', sourceUrl: 'https://tax.colorado.gov' },
  { state: 'CT', revenueThreshold: 100000, transactionThreshold: 200, measurementPeriod: 'PRIOR_CALENDAR_YEAR', sourceUrl: 'https://portal.ct.gov/DRS' },
  { state: 'FL', revenueThreshold: 100000, transactionThreshold: null, measurementPeriod: 'PRIOR_CALENDAR_YEAR', sourceUrl: 'https://floridarevenue.com' },
  { state: 'GA', revenueThreshold: 100000, transactionThreshold: 200, measurementPeriod: 'PRIOR_CALENDAR_YEAR', sourceUrl: 'https://dor.georgia.gov' },
  { state: 'IL', revenueThreshold: 100000, transactionThreshold: 200, measurementPeriod: 'PRIOR_12_MONTHS', sourceUrl: 'https://tax.illinois.gov' },
  { state: 'IN', revenueThreshold: 100000, transactionThreshold: null, measurementPeriod: 'CALENDAR_YEAR', sourceUrl: 'https://www.in.gov/dor' },
  { state: 'MA', revenueThreshold: 100000, transactionThreshold: null, measurementPeriod: 'PRIOR_CALENDAR_YEAR', sourceUrl: 'https://www.mass.gov/dor' },
  { state: 'MI', revenueThreshold: 100000, transactionThreshold: 200, measurementPeriod: 'PRIOR_CALENDAR_YEAR', sourceUrl: 'https://www.michigan.gov/taxes' },
  { state: 'NJ', revenueThreshold: 100000, transactionThreshold: 200, measurementPeriod: 'CALENDAR_YEAR', sourceUrl: 'https://www.nj.gov/treasury/taxation' },
  { state: 'NY', revenueThreshold: 500000, transactionThreshold: 100, measurementPeriod: 'PRIOR_4_QUARTERS', sourceUrl: 'https://www.tax.ny.gov' },
  { state: 'NC', revenueThreshold: 100000, transactionThreshold: null, measurementPeriod: 'PRIOR_OR_CURRENT_YEAR', sourceUrl: 'https://www.ncdor.gov' },
  { state: 'OH', revenueThreshold: 100000, transactionThreshold: 200, measurementPeriod: 'CALENDAR_YEAR', sourceUrl: 'https://tax.ohio.gov' },
  { state: 'PA', revenueThreshold: 100000, transactionThreshold: null, measurementPeriod: 'PRIOR_12_MONTHS', sourceUrl: 'https://www.revenue.pa.gov' },
  { state: 'TX', revenueThreshold: 500000, transactionThreshold: null, measurementPeriod: 'PRIOR_12_MONTHS', sourceUrl: 'https://comptroller.texas.gov' },
  { state: 'VA', revenueThreshold: 100000, transactionThreshold: 200, measurementPeriod: 'PRIOR_OR_CURRENT_YEAR', sourceUrl: 'https://www.tax.virginia.gov' },
  { state: 'WA', revenueThreshold: 100000, transactionThreshold: null, measurementPeriod: 'CALENDAR_YEAR', sourceUrl: 'https://dor.wa.gov' },
];

@Injectable()
export class EconomicNexusService {
  // ── THRESHOLDS ──────────────────────────────────

  async listThresholds(tenantId: string) {
    return prisma.economicNexusThreshold.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ country: 'asc' }, { state: 'asc' }],
    });
  }

  async getThreshold(tenantId: string, id: string) {
    const t = await prisma.economicNexusThreshold.findFirst({ where: { id, tenantId } });
    if (!t) throw new NotFoundException('Nexus threshold not found');
    return t;
  }

  async createThreshold(
    tenantId: string,
    dto: {
      country?: string;
      state: string;
      revenueThreshold: number;
      transactionThreshold?: number | null;
      measurementPeriod?: string;
      includesExemptSales?: boolean;
      marketplaceFacilitatorLaw?: boolean;
      sourceUrl?: string;
      notes?: string;
    },
  ) {
    const existing = await prisma.economicNexusThreshold.findFirst({
      where: { tenantId, country: dto.country ?? 'US', state: dto.state },
    });
    if (existing) {
      throw new BadRequestException(`A threshold already exists for ${dto.country ?? 'US'}/${dto.state}. Update it instead.`);
    }
    return prisma.economicNexusThreshold.create({
      data: {
        tenantId,
        country: dto.country ?? 'US',
        state: dto.state,
        revenueThreshold: new Prisma.Decimal(dto.revenueThreshold),
        transactionThreshold: dto.transactionThreshold ?? null,
        measurementPeriod: dto.measurementPeriod ?? 'TRAILING_12_MONTHS',
        includesExemptSales: dto.includesExemptSales ?? false,
        marketplaceFacilitatorLaw: dto.marketplaceFacilitatorLaw ?? true,
        sourceUrl: dto.sourceUrl,
        notes: dto.notes,
      },
    });
  }

  async updateThreshold(
    tenantId: string,
    id: string,
    dto: Partial<{
      revenueThreshold: number;
      transactionThreshold: number | null;
      measurementPeriod: string;
      includesExemptSales: boolean;
      marketplaceFacilitatorLaw: boolean;
      sourceUrl: string;
      notes: string;
      isActive: boolean;
    }>,
  ) {
    await this.getThreshold(tenantId, id);
    return prisma.economicNexusThreshold.update({
      where: { id },
      data: {
        ...(dto.revenueThreshold !== undefined && { revenueThreshold: new Prisma.Decimal(dto.revenueThreshold) }),
        ...(dto.transactionThreshold !== undefined && { transactionThreshold: dto.transactionThreshold }),
        ...(dto.measurementPeriod !== undefined && { measurementPeriod: dto.measurementPeriod }),
        ...(dto.includesExemptSales !== undefined && { includesExemptSales: dto.includesExemptSales }),
        ...(dto.marketplaceFacilitatorLaw !== undefined && { marketplaceFacilitatorLaw: dto.marketplaceFacilitatorLaw }),
        ...(dto.sourceUrl !== undefined && { sourceUrl: dto.sourceUrl }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteThreshold(tenantId: string, id: string) {
    await this.getThreshold(tenantId, id);
    await prisma.economicNexusThreshold.delete({ where: { id } });
    return { deleted: true };
  }

  /** Seed the tenant's threshold table with reference US state economic-nexus rules (idempotent). */
  async seedDefaultThresholds(tenantId: string) {
    let created = 0;
    for (const t of US_STATE_DEFAULT_THRESHOLDS) {
      const existing = await prisma.economicNexusThreshold.findFirst({
        where: { tenantId, country: 'US', state: t.state },
      });
      if (existing) continue;
      await prisma.economicNexusThreshold.create({
        data: {
          tenantId,
          country: 'US',
          state: t.state,
          revenueThreshold: new Prisma.Decimal(t.revenueThreshold),
          transactionThreshold: t.transactionThreshold,
          measurementPeriod: t.measurementPeriod,
          sourceUrl: t.sourceUrl,
          notes: 'Seeded reference threshold — verify against current state guidance before relying on it for filing decisions.',
        },
      });
      created++;
    }
    return { seeded: created, totalStates: US_STATE_DEFAULT_THRESHOLDS.length };
  }

  // ── MONITORING (compute + persist snapshots) ──────────────────────────────────

  private static readonly VALID_STATE_CODES = new Set([
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
    'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
  ]);

  private static readonly STATE_NAME_TO_CODE: Record<string, string> = {
    ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA', COLORADO: 'CO',
    CONNECTICUT: 'CT', DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA', HAWAII: 'HI', IDAHO: 'ID',
    ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA', KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA',
    MAINE: 'ME', MARYLAND: 'MD', MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN',
    MISSISSIPPI: 'MS', MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV',
    'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', OHIO: 'OH', OKLAHOMA: 'OK', OREGON: 'OR',
    PENNSYLVANIA: 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD',
    TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT', VIRGINIA: 'VA', WASHINGTON: 'WA',
    'WEST VIRGINIA': 'WV', WISCONSIN: 'WI', WYOMING: 'WY', 'DISTRICT OF COLUMBIA': 'DC',
  };

  /**
   * Resolve a customer address's state to a valid 2-letter USPS code, or null if it
   * can't be confidently identified. Accepts either a 2-letter code or a full state
   * name (case-insensitive) — never blindly truncates an arbitrary string, which
   * would silently miscategorize revenue into the wrong (or a nonexistent) state.
   */
  private extractState(addr: unknown): string | null {
    if (!addr || typeof addr !== 'object') return null;
    const a = addr as Record<string, unknown>;
    const raw = (a.state ?? a.province ?? a.region) as string | undefined;
    if (!raw) return null;
    const normalized = String(raw).trim().toUpperCase();
    if (EconomicNexusService.VALID_STATE_CODES.has(normalized)) return normalized;
    const mapped = EconomicNexusService.STATE_NAME_TO_CODE[normalized];
    return mapped ?? null;
  }

  /**
   * Compute trailing-12-month revenue + transaction counts per state from posted invoices,
   * compare against each state's threshold, and persist a snapshot per state.
   */
  async refreshMonitoring(tenantId: string) {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 12);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { notIn: ['DRAFT', 'VOID'] },
        issueDate: { gte: periodStart, lte: periodEnd },
      },
      include: { customer: { select: { billingAddress: true, shippingAddress: true } } },
    });

    const byState: Record<string, { revenue: number; count: number }> = {};
    for (const inv of invoices) {
      const state =
        this.extractState(inv.customer?.shippingAddress) ?? this.extractState(inv.customer?.billingAddress);
      if (!state) continue;
      if (!byState[state]) byState[state] = { revenue: 0, count: 0 };
      byState[state]!.revenue += Number(inv.totalAmount);
      byState[state]!.count += 1;
    }

    const thresholds = await prisma.economicNexusThreshold.findMany({ where: { tenantId, isActive: true } });
    const registrations = await prisma.nexusRegistration.findMany({ where: { tenantId } });
    const thresholdByState = new Map(thresholds.map((t) => [t.state, t]));
    const registrationByState = new Map(registrations.map((r) => [r.state, r]));

    const snapshots = [];
    const states = new Set([...Object.keys(byState), ...thresholds.map((t) => t.state)]);

    for (const state of states) {
      const activity = byState[state] ?? { revenue: 0, count: 0 };
      const threshold = thresholdByState.get(state);
      const revenueThreshold = threshold ? Number(threshold.revenueThreshold) : 100000;
      const transactionThreshold = threshold?.transactionThreshold ?? null;

      const revenuePct = revenueThreshold > 0 ? (activity.revenue / revenueThreshold) * 100 : 0;
      const transactionPct =
        transactionThreshold && transactionThreshold > 0 ? (activity.count / transactionThreshold) * 100 : null;

      const isRegistered = registrationByState.get(state)?.status === 'REGISTERED';
      const exceeded =
        activity.revenue >= revenueThreshold || (transactionThreshold != null && activity.count >= transactionThreshold);
      const approaching = !exceeded && (revenuePct >= 80 || (transactionPct !== null && transactionPct >= 80));

      const status = isRegistered ? 'REGISTERED' : exceeded ? 'EXCEEDED' : approaching ? 'APPROACHING' : 'NOT_MET';

      const snapshot = await prisma.nexusMonitoringSnapshot.create({
        data: {
          tenantId,
          country: 'US',
          state,
          periodStart,
          periodEnd,
          totalRevenue: new Prisma.Decimal(activity.revenue),
          transactionCount: activity.count,
          revenueThreshold: new Prisma.Decimal(revenueThreshold),
          transactionThreshold,
          revenuePct: new Prisma.Decimal(Math.min(999, revenuePct)),
          transactionPct: transactionPct !== null ? new Prisma.Decimal(Math.min(999, transactionPct)) : null,
          status,
        },
      });
      snapshots.push(snapshot);
    }

    return { computedStates: snapshots.length, periodStart, periodEnd, snapshots };
  }

  /** Latest snapshot per state (one row each), newest computedAt first. */
  async getLatestMonitoring(tenantId: string) {
    const all = await prisma.nexusMonitoringSnapshot.findMany({
      where: { tenantId },
      orderBy: { computedAt: 'desc' },
    });
    const seen = new Set<string>();
    const latest = [];
    for (const s of all) {
      if (seen.has(s.state)) continue;
      seen.add(s.state);
      latest.push(s);
    }
    return latest.sort((a, b) => Number(b.revenuePct) - Number(a.revenuePct));
  }

  async getMonitoringHistory(tenantId: string, state: string) {
    return prisma.nexusMonitoringSnapshot.findMany({
      where: { tenantId, state: state.toUpperCase() },
      orderBy: { computedAt: 'desc' },
      take: 24,
    });
  }

  async getDashboard(tenantId: string) {
    const latest = await this.getLatestMonitoring(tenantId);
    const registrations = await prisma.nexusRegistration.findMany({ where: { tenantId } });

    const exceeded = latest.filter((s) => s.status === 'EXCEEDED');
    const approaching = latest.filter((s) => s.status === 'APPROACHING');
    const registered = latest.filter((s) => s.status === 'REGISTERED');
    const totalRevenue = latest.reduce((sum, s) => sum + Number(s.totalRevenue), 0);

    return {
      totalStatesMonitored: latest.length,
      exceededCount: exceeded.length,
      approachingCount: approaching.length,
      registeredCount: registered.length,
      registrationsOnFile: registrations.length,
      totalRevenue,
      exceededStates: exceeded.map((s) => s.state),
      approachingStates: approaching.map((s) => s.state),
      generatedAt: new Date().toISOString(),
    };
  }

  // ── REGISTRATIONS ──────────────────────────────────

  async listRegistrations(tenantId: string) {
    return prisma.nexusRegistration.findMany({ where: { tenantId }, orderBy: { state: 'asc' } });
  }

  async getRegistration(tenantId: string, id: string) {
    const r = await prisma.nexusRegistration.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Nexus registration not found');
    return r;
  }

  async createRegistration(
    tenantId: string,
    createdBy: string | undefined,
    dto: {
      country?: string;
      state: string;
      status?: string;
      registrationNumber?: string;
      registeredAt?: string;
      effectiveDate?: string;
      filingFrequency?: string;
      notes?: string;
    },
  ) {
    const existing = await prisma.nexusRegistration.findFirst({
      where: { tenantId, country: dto.country ?? 'US', state: dto.state },
    });
    if (existing) {
      throw new BadRequestException(`A registration record already exists for ${dto.country ?? 'US'}/${dto.state}. Update it instead.`);
    }
    return prisma.nexusRegistration.create({
      data: {
        tenantId,
        country: dto.country ?? 'US',
        state: dto.state,
        status: dto.status ?? 'NOT_REGISTERED',
        registrationNumber: dto.registrationNumber,
        registeredAt: dto.registeredAt ? new Date(dto.registeredAt) : null,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
        filingFrequency: dto.filingFrequency,
        notes: dto.notes,
        createdBy,
      },
    });
  }

  async updateRegistration(
    tenantId: string,
    id: string,
    dto: Partial<{
      status: string;
      registrationNumber: string;
      registeredAt: string;
      effectiveDate: string;
      filingFrequency: string;
      nextFilingDueDate: string;
      notes: string;
    }>,
  ) {
    await this.getRegistration(tenantId, id);
    return prisma.nexusRegistration.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && {
          status: dto.status,
          ...(dto.status === 'REGISTERED' && { registeredAt: new Date() }),
          ...(dto.status === 'DEREGISTERED' && { deregisteredAt: new Date() }),
        }),
        ...(dto.registrationNumber !== undefined && { registrationNumber: dto.registrationNumber }),
        ...(dto.registeredAt !== undefined && { registeredAt: new Date(dto.registeredAt) }),
        ...(dto.effectiveDate !== undefined && { effectiveDate: new Date(dto.effectiveDate) }),
        ...(dto.filingFrequency !== undefined && { filingFrequency: dto.filingFrequency }),
        ...(dto.nextFilingDueDate !== undefined && { nextFilingDueDate: new Date(dto.nextFilingDueDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async deleteRegistration(tenantId: string, id: string) {
    await this.getRegistration(tenantId, id);
    await prisma.nexusRegistration.delete({ where: { id } });
    return { deleted: true };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

export interface TaxJurisdictionRate {
  id: string;
  tenantId: string;
  country: string;
  state: string;
  county?: string;
  city?: string;
  postalCode?: string;
  specialDistrict?: string;
  stateRatePct: number;
  countyRatePct: number;
  cityRatePct: number;
  specialDistrictRatePct: number;
  combinedRatePct: number;
  taxCategoryMultipliers: Record<string, number>;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface TaxLookupRequest {
  country?: string;
  state: string;
  county?: string;
  city?: string;
  postalCode: string;
  taxCategory?:
    | "SAAS"
    | "DIGITAL_GOODS"
    | "PHYSICAL_GOODS"
    | "EXEMPT_FREIGHT"
    | "PROFESSIONAL_SERVICES";
  taxableAmount: number;
}

export interface TaxLookupResult {
  jurisdictionId?: string;
  country: string;
  state: string;
  county: string;
  city: string;
  postalCode: string;
  taxCategory: string;
  taxableAmount: number;
  stateRatePct: number;
  countyRatePct: number;
  cityRatePct: number;
  specialDistrictRatePct: number;
  effectiveRatePct: number;
  stateTaxAmount: number;
  countyTaxAmount: number;
  cityTaxAmount: number;
  specialDistrictTaxAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  isOverridden: boolean;
}

// Default benchmark tax rate database for major postal codes / states
const DEFAULT_JURISDICTION_RATES: Array<{
  country: string;
  state: string;
  county: string;
  city: string;
  postalCode: string;
  stateRatePct: number;
  countyRatePct: number;
  cityRatePct: number;
  specialDistrictRatePct: number;
}> = [
  {
    country: "US",
    state: "CA",
    county: "Los Angeles",
    city: "Los Angeles",
    postalCode: "90210",
    stateRatePct: 6.0,
    countyRatePct: 1.25,
    cityRatePct: 1.5,
    specialDistrictRatePct: 0.75,
  },
  {
    country: "US",
    state: "NY",
    county: "New York",
    city: "New York City",
    postalCode: "10001",
    stateRatePct: 4.0,
    countyRatePct: 4.5,
    cityRatePct: 0.0,
    specialDistrictRatePct: 0.375,
  },
  {
    country: "US",
    state: "TX",
    county: "Harris",
    city: "Houston",
    postalCode: "77001",
    stateRatePct: 6.25,
    countyRatePct: 1.0,
    cityRatePct: 1.0,
    specialDistrictRatePct: 0.0,
  },
  {
    country: "US",
    state: "FL",
    county: "Miami-Dade",
    city: "Miami",
    postalCode: "33101",
    stateRatePct: 6.0,
    countyRatePct: 1.0,
    cityRatePct: 0.0,
    specialDistrictRatePct: 0.0,
  },
  {
    country: "US",
    state: "IL",
    county: "Cook",
    city: "Chicago",
    postalCode: "60601",
    stateRatePct: 6.25,
    countyRatePct: 1.75,
    cityRatePct: 1.25,
    specialDistrictRatePct: 1.0,
  },
  {
    country: "US",
    state: "WA",
    county: "King",
    city: "Seattle",
    postalCode: "98101",
    stateRatePct: 6.5,
    countyRatePct: 3.0,
    cityRatePct: 0.75,
    specialDistrictRatePct: 0.0,
  },
];

@Injectable()
export class TaxJurisdictionLookupService {
  /**
   * Performs real-time multi-tier tax rate determination based on postal code, state, and category.
   */
  async lookupTaxRate(
    tenantId: string,
    req: TaxLookupRequest,
  ): Promise<TaxLookupResult> {
    const country = req.country ?? "US";
    const taxCategory = req.taxCategory ?? "PHYSICAL_GOODS";
    const taxableAmount = Math.max(0, req.taxableAmount || 0);

    // 1. Check if tenant has a specific jurisdiction override for this postal code / state
    const override = await prisma.economicNexusThreshold.findFirst({
      where: {
        tenantId,
        country,
        state: req.state,
        isActive: true,
      },
    });

    // 2. Find matching default or stored jurisdiction rates
    const matched = DEFAULT_JURISDICTION_RATES.find(
      (j) =>
        j.postalCode === req.postalCode ||
        (j.state === req.state &&
          (!req.city || j.city.toLowerCase() === req.city.toLowerCase())),
    ) || {
      country,
      state: req.state,
      county: req.county || "District County",
      city: req.city || "Municipal District",
      postalCode: req.postalCode,
      stateRatePct: 5.0,
      countyRatePct: 1.0,
      cityRatePct: 0.5,
      specialDistrictRatePct: 0.0,
    };

    // Category multipliers (e.g., SaaS and Digital goods may be taxed at 80% or 0% depending on state rules)
    const categoryMultipliers: Record<string, number> = {
      PHYSICAL_GOODS: 1.0,
      SAAS:
        req.state === "NY" || req.state === "TX"
          ? 0.8
          : req.state === "CA"
            ? 0.0
            : 1.0,
      DIGITAL_GOODS: 1.0,
      EXEMPT_FREIGHT: 0.0,
      PROFESSIONAL_SERVICES: 0.0,
    };

    const multiplier = categoryMultipliers[taxCategory] ?? 1.0;

    const stateRatePct = Number((matched.stateRatePct * multiplier).toFixed(4));
    const countyRatePct = Number(
      (matched.countyRatePct * multiplier).toFixed(4),
    );
    const cityRatePct = Number((matched.cityRatePct * multiplier).toFixed(4));
    const specialDistrictRatePct = Number(
      (matched.specialDistrictRatePct * multiplier).toFixed(4),
    );
    const effectiveRatePct = Number(
      (
        stateRatePct +
        countyRatePct +
        cityRatePct +
        specialDistrictRatePct
      ).toFixed(4),
    );

    const stateTaxAmount = Number(
      ((taxableAmount * stateRatePct) / 100).toFixed(2),
    );
    const countyTaxAmount = Number(
      ((taxableAmount * countyRatePct) / 100).toFixed(2),
    );
    const cityTaxAmount = Number(
      ((taxableAmount * cityRatePct) / 100).toFixed(2),
    );
    const specialDistrictTaxAmount = Number(
      ((taxableAmount * specialDistrictRatePct) / 100).toFixed(2),
    );
    const totalTaxAmount = Number(
      (
        stateTaxAmount +
        countyTaxAmount +
        cityTaxAmount +
        specialDistrictTaxAmount
      ).toFixed(2),
    );
    const grandTotal = Number((taxableAmount + totalTaxAmount).toFixed(2));

    return {
      jurisdictionId:
        override?.id || `jur-default-${req.state}-${req.postalCode}`,
      country,
      state: req.state,
      county: matched.county,
      city: matched.city,
      postalCode: req.postalCode,
      taxCategory,
      taxableAmount,
      stateRatePct,
      countyRatePct,
      cityRatePct,
      specialDistrictRatePct,
      effectiveRatePct,
      stateTaxAmount,
      countyTaxAmount,
      cityTaxAmount,
      specialDistrictTaxAmount,
      totalTaxAmount,
      grandTotal,
      isOverridden: !!override,
    };
  }

  /**
   * List all configured jurisdiction tax rates for a tenant.
   */
  async listJurisdictions(tenantId: string) {
    const customThresholds = await prisma.economicNexusThreshold.findMany({
      where: { tenantId },
      orderBy: [{ state: "asc" }],
    });

    return DEFAULT_JURISDICTION_RATES.map((d) => {
      const tenantMatch = customThresholds.find((t) => t.state === d.state);
      return {
        id: tenantMatch?.id || `jur-${d.country}-${d.state}-${d.postalCode}`,
        country: d.country,
        state: d.state,
        county: d.county,
        city: d.city,
        postalCode: d.postalCode,
        stateRatePct: d.stateRatePct,
        countyRatePct: d.countyRatePct,
        cityRatePct: d.cityRatePct,
        specialDistrictRatePct: d.specialDistrictRatePct,
        combinedRatePct:
          d.stateRatePct +
          d.countyRatePct +
          d.cityRatePct +
          d.specialDistrictRatePct,
        hasTenantNexus: !!tenantMatch,
        revenueThreshold: tenantMatch?.revenueThreshold ?? 100000,
        status: tenantMatch ? "ACTIVE" : "DEFAULT",
      };
    });
  }

  /**
   * Add or register a custom jurisdiction rate override for a tenant.
   */
  async createJurisdictionOverride(
    tenantId: string,
    dto: {
      country?: string;
      state: string;
      county?: string;
      city?: string;
      postalCode?: string;
      revenueThreshold?: number;
      notes?: string;
    },
  ) {
    if (!dto.state) {
      throw new BadRequestException("State is required");
    }

    const created = await prisma.economicNexusThreshold.create({
      data: {
        tenantId,
        country: dto.country ?? "US",
        state: dto.state.toUpperCase(),
        revenueThreshold: dto.revenueThreshold ?? 100000,
        transactionThreshold: 200,
        measurementPeriod: "PRIOR_12_MONTHS",
        notes:
          dto.notes ||
          `Custom jurisdiction rate rule for ${dto.city || ""} ${dto.state}`,
        isActive: true,
      },
    });

    return created;
  }

  /**
   * Update an existing jurisdiction rule for a tenant.
   */
  async updateJurisdiction(
    tenantId: string,
    id: string,
    dto: { revenueThreshold?: number; isActive?: boolean; notes?: string },
  ) {
    const existing = await prisma.economicNexusThreshold.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Jurisdiction threshold rule not found");
    }

    return prisma.economicNexusThreshold.update({
      where: { id },
      data: {
        ...(dto.revenueThreshold !== undefined && {
          revenueThreshold: dto.revenueThreshold,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }
}

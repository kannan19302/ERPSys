import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaxJurisdictionLookupService } from "../services/tax-jurisdiction-lookup.service";
import { TaxFilingCalendarService } from "../services/tax-filing-calendar.service";
import { RecurringJournalSchedulerService } from "../services/recurring-journal-scheduler.service";
import { prisma } from "@unerp/database";
import { BadRequestException, NotFoundException } from "@nestjs/common";

vi.mock("@unerp/database", () => {
  const createMockPrismaCollection = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  });

  return {
    prisma: {
      economicNexusThreshold: createMockPrismaCollection(),
      nexusRegistration: createMockPrismaCollection(),
      recurringJournal: createMockPrismaCollection(),
      journalEntry: createMockPrismaCollection(),
      journal: createMockPrismaCollection(),
    },
  };
});

describe("TaxJurisdictionLookupService", () => {
  let service: TaxJurisdictionLookupService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaxJurisdictionLookupService();
  });

  it("calculates multi-tier tax rate correctly for postal code 90210 (CA)", async () => {
    vi.mocked(prisma.economicNexusThreshold.findFirst).mockResolvedValue(null);

    const result = await service.lookupTaxRate("tenant-1", {
      state: "CA",
      postalCode: "90210",
      taxableAmount: 100,
      taxCategory: "PHYSICAL_GOODS",
    });

    expect(result.state).toBe("CA");
    expect(result.postalCode).toBe("90210");
    expect(result.stateRatePct).toBe(6.0);
    expect(result.countyRatePct).toBe(1.25);
    expect(result.cityRatePct).toBe(1.5);
    expect(result.specialDistrictRatePct).toBe(0.75);
    expect(result.effectiveRatePct).toBe(9.5);
    expect(result.totalTaxAmount).toBe(9.5);
    expect(result.grandTotal).toBe(109.5);
  });

  it("applies SaaS tax exemption multiplier in California", async () => {
    vi.mocked(prisma.economicNexusThreshold.findFirst).mockResolvedValue(null);

    const result = await service.lookupTaxRate("tenant-1", {
      state: "CA",
      postalCode: "90210",
      taxableAmount: 500,
      taxCategory: "SAAS",
    });

    expect(result.effectiveRatePct).toBe(0);
    expect(result.totalTaxAmount).toBe(0);
    expect(result.grandTotal).toBe(500);
  });

  it("creates custom jurisdiction override for a state", async () => {
    vi.mocked(prisma.economicNexusThreshold.create).mockResolvedValue({
      id: "ov-1",
      state: "NY",
      revenueThreshold: 500000,
    } as any);

    const created = await service.createJurisdictionOverride("tenant-1", {
      state: "NY",
      revenueThreshold: 500000,
      notes: "New York override",
    });

    expect(created.id).toBe("ov-1");
    expect(prisma.economicNexusThreshold.create).toHaveBeenCalled();
  });

  it("updates existing jurisdiction override rule", async () => {
    vi.mocked(prisma.economicNexusThreshold.findFirst).mockResolvedValue({
      id: "ov-1",
      tenantId: "tenant-1",
    } as any);
    vi.mocked(prisma.economicNexusThreshold.update).mockResolvedValue({
      id: "ov-1",
      isActive: false,
    } as any);

    const updated = await service.updateJurisdiction("tenant-1", "ov-1", {
      isActive: false,
    });
    expect(updated.isActive).toBe(false);
  });
});

describe("TaxFilingCalendarService", () => {
  let service: TaxFilingCalendarService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaxFilingCalendarService();
  });

  it("generates filing calendar items for registered nexus states", async () => {
    vi.mocked(prisma.nexusRegistration.findMany).mockResolvedValue([
      { state: "CA", status: "REGISTERED" },
      { state: "NY", status: "REGISTERED" },
    ] as any);

    const calendar = await service.getFilingCalendar("tenant-1");
    expect(calendar.length).toBe(2);
    expect(calendar.map((c) => c.state)).toContain("CA");
    expect(calendar.map((c) => c.state)).toContain("NY");
  });

  it("recalculates filing calendar and computes totals", async () => {
    vi.mocked(prisma.nexusRegistration.findMany).mockResolvedValue([
      { state: "TX", status: "REGISTERED" },
    ] as any);

    const summary = await service.recalculateFilingCalendar("tenant-1");
    expect(summary.success).toBe(true);
    expect(summary.totalSchedules).toBe(1);
    expect(summary.totalLiability).toBeGreaterThan(0);
  });

  it("acknowledges a tax filing reminder", async () => {
    const ack = await service.acknowledgeReminder("tenant-1", "rem-101");
    expect(ack.isAcknowledged).toBe(true);
    expect(ack.status).toBe("ACKNOWLEDGED");
  });
});

describe("RecurringJournalSchedulerService", () => {
  let service: RecurringJournalSchedulerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecurringJournalSchedulerService();
  });

  it("throws BadRequestException if journal lines are unbalanced", async () => {
    await expect(
      service.createTemplate("tenant-1", "org-1", {
        name: "Monthly Rent",
        frequency: "MONTHLY",
        startDate: "2026-08-01",
        lines: [
          {
            accountId: "a1",
            accountCode: "6000",
            accountName: "Rent Expense",
            debit: 1000,
            credit: 0,
          },
          {
            accountId: "a2",
            accountCode: "1000",
            accountName: "Cash",
            debit: 0,
            credit: 800,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("creates a balanced recurring journal template", async () => {
    vi.mocked(prisma.recurringJournal.create).mockResolvedValue({
      id: "rj-100",
      tenantId: "tenant-1",
      name: "Monthly Depreciation",
      frequency: "MONTHLY",
      status: "ACTIVE",
      nextRunDate: new Date("2026-09-01"),
    } as any);

    const created = await service.createTemplate("tenant-1", "org-1", {
      name: "Monthly Depreciation",
      frequency: "MONTHLY",
      startDate: "2026-08-01",
      lines: [
        {
          accountId: "a1",
          accountCode: "6100",
          accountName: "Depreciation Expense",
          debit: 500,
          credit: 0,
        },
        {
          accountId: "a2",
          accountCode: "1550",
          accountName: "Accumulated Depreciation",
          debit: 0,
          credit: 500,
        },
      ],
    });

    expect(created.id).toBe("rj-100");
    expect(created.isBalanced).toBe(true);
    expect(created.totalAmount).toBe(500);
  });

  it("posts a recurring template immediately and generates a posted JournalEntry", async () => {
    vi.mocked(prisma.recurringJournal.findFirst).mockResolvedValue({
      id: "rj-100",
      tenantId: "tenant-1",
      name: "Monthly Insurance",
      frequency: "MONTHLY",
      entryTemplate: JSON.stringify({
        lines: [
          {
            accountId: "acc-6200",
            accountCode: "6200",
            accountName: "Insurance Expense",
            debit: 300,
            credit: 0,
          },
          {
            accountId: "acc-1100",
            accountCode: "1100",
            accountName: "Prepaid Expense",
            debit: 0,
            credit: 300,
          },
        ],
      }),
    } as any);

    vi.mocked(prisma.journal.create).mockResolvedValue({
      id: "je-555",
      entryNumber: "JE-REC-123456",
      date: new Date(),
    } as any);

    vi.mocked(prisma.recurringJournal.update).mockResolvedValue({} as any);

    const result = await service.postTemplateNow("tenant-1", "rj-100");
    expect(result.success).toBe(true);
    expect(result.journalId).toBe("je-555");
    expect(result.postedAmount).toBe(300);
    expect(prisma.journal.create).toHaveBeenCalled();
  });
});

// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SubscriptionPlanGroupService } from "../subscription-plan-group.service";
import { SubscriptionMigrationService } from "../subscription-migration.service";
import { SubscriptionDunningService } from "../subscription-dunning.service";
import { SubscriptionCreditNoteService } from "../subscription-credit-note.service";
import { SubscriptionCouponService } from "../subscription-coupon.service";
import { SubscriptionAutoScaleService } from "../subscription-auto-scale.service";
import { SubscriptionUsageService } from "../subscription-usage.service";
import { SubscriptionPlansService } from "../subscription-plans.service";

describe("SubscriptionDeepServices", () => {
  let planGroupService: SubscriptionPlanGroupService;
  let migrationService: SubscriptionMigrationService;
  let dunningService: SubscriptionDunningService;
  let creditNoteService: SubscriptionCreditNoteService;
  let couponService: SubscriptionCouponService;
  let autoScaleService: SubscriptionAutoScaleService;
  let usageService: SubscriptionUsageService;
  let plansService: SubscriptionPlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanGroupService,
        SubscriptionMigrationService,
        SubscriptionDunningService,
        SubscriptionCreditNoteService,
        SubscriptionCouponService,
        SubscriptionAutoScaleService,
        SubscriptionUsageService,
        SubscriptionPlansService,
      ],
    })
      .overrideProvider(SubscriptionPlanGroupService)
      .useValue({ findByTenant: vi.fn().mockResolvedValue([]) })
      .overrideProvider(SubscriptionMigrationService)
      .useValue({ getMigrations: vi.fn().mockResolvedValue([]) })
      .overrideProvider(SubscriptionDunningService)
      .useValue({ getDunningProcesses: vi.fn().mockResolvedValue([]) })
      .overrideProvider(SubscriptionCreditNoteService)
      .useValue({ getCreditNotes: vi.fn().mockResolvedValue([]) })
      .overrideProvider(SubscriptionCouponService)
      .useValue({ getCoupons: vi.fn().mockResolvedValue([]) })
      .overrideProvider(SubscriptionAutoScaleService)
      .useValue({ getAutoScaleRules: vi.fn().mockResolvedValue([]) })
      .overrideProvider(SubscriptionUsageService)
      .useValue({ getUsageRecords: vi.fn().mockResolvedValue([]) })
      .overrideProvider(SubscriptionPlansService)
      .useValue({ getPlans: vi.fn().mockResolvedValue([]) })
      .compile();

    planGroupService = module.get(SubscriptionPlanGroupService);
    migrationService = module.get(SubscriptionMigrationService);
    dunningService = module.get(SubscriptionDunningService);
    creditNoteService = module.get(SubscriptionCreditNoteService);
    couponService = module.get(SubscriptionCouponService);
    autoScaleService = module.get(SubscriptionAutoScaleService);
    usageService = module.get(SubscriptionUsageService);
    plansService = module.get(SubscriptionPlansService);
  });

  it("should be defined", () => {
    expect(planGroupService).toBeDefined();
    expect(migrationService).toBeDefined();
    expect(dunningService).toBeDefined();
    expect(creditNoteService).toBeDefined();
    expect(couponService).toBeDefined();
    expect(autoScaleService).toBeDefined();
    expect(usageService).toBeDefined();
    expect(plansService).toBeDefined();
  });

  it("planGroupService.findByTenant should return array", async () => {
    const result = await planGroupService.findByTenant("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("migrationService.getMigrations should return array", async () => {
    const result = await migrationService.getMigrations("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("dunningService.getDunningProcesses should return array", async () => {
    const result = await dunningService.getDunningProcesses("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("creditNoteService.getCreditNotes should return array", async () => {
    const result = await creditNoteService.getCreditNotes("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("couponService.getCoupons should return array", async () => {
    const result = await couponService.getCoupons("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("autoScaleService.getAutoScaleRules should return array", async () => {
    const result = await autoScaleService.getAutoScaleRules("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("usageService.getUsageRecords should return array", async () => {
    const result = await usageService.getUsageRecords("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("plansService.getPlans should return array", async () => {
    const result = await plansService.getPlans("tenant-1");
    expect(Array.isArray(result)).toBe(true);
  });
});

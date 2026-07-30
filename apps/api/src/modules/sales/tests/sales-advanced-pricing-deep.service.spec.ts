// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SalesAdvancedPricingDeepService } from "../sales-advanced-pricing-deep.service";

describe("SalesAdvancedPricingDeepService", () => {
  let service: SalesAdvancedPricingDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesAdvancedPricingDeepService],
    }).compile();

    service = module.get<SalesAdvancedPricingDeepService>(
      SalesAdvancedPricingDeepService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("calculateVolumeDiscount", () => {
    it("should calculate 25% discount for 1000+ units", async () => {
      const res = await service.calculateVolumeDiscount("tenant-1", {
        productId: "p1",
        quantity: 1000,
        basePrice: 100,
      });
      expect(res.appliedDiscountPct).toBe(25);
      expect(res.unitPrice).toBe(75);
      expect(res.totalPrice).toBe(75000);
    });

    it("should calculate 10% discount for 50 units", async () => {
      const res = await service.calculateVolumeDiscount("tenant-1", {
        productId: "p1",
        quantity: 50,
        basePrice: 100,
      });
      expect(res.appliedDiscountPct).toBe(10);
      expect(res.unitPrice).toBe(90);
    });
  });

  describe("getCurrencyMatrices", () => {
    it("should return currency exchange rates", async () => {
      const res = await service.getCurrencyMatrices("tenant-1");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].currency).toBe("USD");
    });
  });
});

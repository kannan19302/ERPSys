import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(value: unknown) {
        return Number(value);
      }
    },
    JsonNull: "JsonNull",
  },
}));

vi.mock("@unerp/database", () => ({
  prisma: {
    salesPromotion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    salesCoupon: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organization: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { SalesPromotionsService } from "../sales-promotions.service";

describe("SalesPromotionsService", () => {
  let service: SalesPromotionsService;

  beforeEach(() => {
    service = new SalesPromotionsService();
    vi.clearAllMocks();
  });

  describe("getPromotions", () => {
    it("should return promotions for tenant", async () => {
      const mockPromotions = [
        {
          id: "promo-1",
          name: "Summer Sale",
          type: "PERCENTAGE",
          value: 10,
          isActive: true,
          _count: { coupons: 5 },
        },
      ];
      vi.mocked(prisma.salesPromotion.findMany).mockResolvedValue(
        mockPromotions as never,
      );

      const result = await service.getPromotions("tenant-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Summer Sale");
      expect(result[0]?._count.coupons).toBe(5);
    });
  });

  describe("getPromotionById", () => {
    it("should return a promotion by id", async () => {
      const mockPromotion = { id: "promo-1", name: "Summer Sale", coupons: [] };
      vi.mocked(prisma.salesPromotion.findFirst).mockResolvedValue(
        mockPromotion as never,
      );

      const result = await service.getPromotionById("tenant-1", "promo-1");

      expect(result).toBeDefined();
      expect(result.name).toBe("Summer Sale");
    });

    it("should throw NotFoundException when promotion not found", async () => {
      vi.mocked(prisma.salesPromotion.findFirst).mockResolvedValue(null);

      await expect(
        service.getPromotionById("tenant-1", "nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createPromotion", () => {
    it("should create a promotion", async () => {
      const mockPromotion = { id: "promo-1", name: "Flash Sale" };
      vi.mocked(prisma.salesPromotion.create).mockResolvedValue(
        mockPromotion as never,
      );

      const dto = {
        name: "Flash Sale",
        type: "PERCENTAGE",
        value: 20,
        startDate: new Date().toISOString(),
      };

      const result = await service.createPromotion("tenant-1", "org-1", dto);

      expect(result).toBeDefined();
      expect(result.name).toBe("Flash Sale");
    });
  });

  describe("updatePromotion", () => {
    it("should update a promotion", async () => {
      vi.mocked(prisma.salesPromotion.findFirst).mockResolvedValue({
        id: "promo-1",
      } as never);
      vi.mocked(prisma.salesPromotion.update).mockResolvedValue({
        id: "promo-1",
        name: "Updated Sale",
      } as never);

      const result = await service.updatePromotion("tenant-1", "promo-1", {
        name: "Updated Sale",
      });

      expect(result.name).toBe("Updated Sale");
    });

    it("should throw NotFoundException when promotion not found", async () => {
      vi.mocked(prisma.salesPromotion.findFirst).mockResolvedValue(null);

      await expect(
        service.updatePromotion("tenant-1", "nonexistent", { name: "X" }),
      ).rejects.toThrow("Promotion not found");
    });
  });

  describe("deletePromotion", () => {
    it("should soft-delete a promotion", async () => {
      vi.mocked(prisma.salesPromotion.findFirst).mockResolvedValue({
        id: "promo-1",
      } as never);
      vi.mocked(prisma.salesPromotion.update).mockResolvedValue({
        id: "promo-1",
        isActive: false,
      } as never);

      await service.deletePromotion("tenant-1", "promo-1");

      expect(prisma.salesPromotion.update).toHaveBeenCalledWith({
        where: { id: "promo-1" },
        data: { isActive: false },
      });
    });
  });

  describe("getCoupons", () => {
    it("should return coupons for tenant", async () => {
      const mockCoupons = [
        {
          id: "c-1",
          code: "SAVE10",
          promotion: { id: "promo-1", name: "Sale", type: "PERCENTAGE" },
        },
      ];
      vi.mocked(prisma.salesCoupon.findMany).mockResolvedValue(
        mockCoupons as never,
      );

      const result = await service.getCoupons("tenant-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe("SAVE10");
    });
  });

  describe("createCoupon", () => {
    it("should create a coupon", async () => {
      vi.mocked(prisma.salesPromotion.findFirst).mockResolvedValue({
        id: "promo-1",
      } as never);
      vi.mocked(prisma.salesCoupon.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.salesCoupon.create).mockResolvedValue({
        id: "c-1",
        code: "SAVE10",
      } as never);

      const result = await service.createCoupon("tenant-1", {
        promotionId: "promo-1",
        code: "SAVE10",
      });

      expect(result.code).toBe("SAVE10");
    });

    it("should throw when coupon code already exists", async () => {
      vi.mocked(prisma.salesPromotion.findFirst).mockResolvedValue({
        id: "promo-1",
      } as never);
      vi.mocked(prisma.salesCoupon.findUnique).mockResolvedValue({
        id: "c-1",
      } as never);

      await expect(
        service.createCoupon("tenant-1", {
          promotionId: "promo-1",
          code: "DUPE",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteCoupon", () => {
    it("should delete a coupon", async () => {
      vi.mocked(prisma.salesCoupon.findFirst).mockResolvedValue({
        id: "c-1",
      } as never);
      vi.mocked(prisma.salesCoupon.delete).mockResolvedValue({
        id: "c-1",
      } as never);

      await service.deleteCoupon("tenant-1", "c-1");

      expect(prisma.salesCoupon.delete).toHaveBeenCalledWith({
        where: { id: "c-1" },
      });
    });

    it("should throw NotFoundException when coupon not found", async () => {
      vi.mocked(prisma.salesCoupon.findFirst).mockResolvedValue(null);

      await expect(
        service.deleteCoupon("tenant-1", "nonexistent"),
      ).rejects.toThrow("Coupon not found");
    });
  });
});

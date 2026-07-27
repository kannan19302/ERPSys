import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { RfqAuctionsService } from "../rfq-auctions.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    rFQ: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    rFQAuctionBid: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    supplierQuotation: { create: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

describe("RfqAuctionsService", () => {
  let service: RfqAuctionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RfqAuctionsService],
    }).compile();
    service = module.get<RfqAuctionsService>(RfqAuctionsService);
    vi.clearAllMocks();
  });

  it("should list auctions", async () => {
    (prisma.rFQ.findMany as any).mockResolvedValue([
      {
        id: "1",
        isAuction: true,
        vendor: { name: "Vendor A" },
        _count: { auctionBids: 2, supplierQuotations: 0 },
      },
    ]);
    (prisma.rFQ.count as any).mockResolvedValue(1);
    const result = await service.listAuctions("tenant-1", {});
    expect(result.meta.total).toBe(1);
  });

  it("should create auction", async () => {
    (prisma.rFQ.count as any).mockResolvedValue(0);
    (prisma.rFQ.create as any).mockResolvedValue({
      id: "new-auction",
      rfqNumber: "AUC-0001",
    });

    const result = await service.createAuction(
      "tenant-1",
      "org-1",
      {
        vendorId: "vendor-1",
        items: [{ description: "Item A", quantity: 10 }],
        auctionEndsAt: new Date(Date.now() + 86400000).toISOString(),
      },
      "user-1",
    );
    expect(result.id).toBe("new-auction");
  });

  it("should place bid", async () => {
    (prisma.rFQ.findFirst as any).mockResolvedValue({
      id: "auction-1",
      isAuction: true,
      status: "SENT",
    });
    (prisma.rFQAuctionBid.create as any).mockResolvedValue({
      id: "bid-1",
      bidAmount: 1000,
    });

    const result = await service.placeBid(
      "tenant-1",
      "auction-1",
      "vendor-1",
      1000,
    );
    expect(result.id).toBe("bid-1");
  });

  it("should reject bid on closed auction", async () => {
    (prisma.rFQ.findFirst as any).mockResolvedValue({
      id: "auction-1",
      isAuction: true,
      status: "COMPLETED",
    });
    await expect(
      service.placeBid("tenant-1", "auction-1", "vendor-1", 1000),
    ).rejects.toThrow(BadRequestException);
  });

  it("should select winning bid", async () => {
    (prisma.rFQ.findFirst as any).mockResolvedValue({
      id: "auction-1",
      isAuction: true,
      orgId: "org-1",
      rfqNumber: "AUC-0001",
    });
    (prisma.rFQAuctionBid.findFirst as any).mockResolvedValue({
      id: "bid-1",
      rfqId: "auction-1",
      vendorId: "vendor-1",
      bidAmount: 1000,
    });
    (prisma.rFQAuctionBid.updateMany as any).mockResolvedValue({});
    (prisma.rFQAuctionBid.update as any).mockResolvedValue({});
    (prisma.supplierQuotation.create as any).mockResolvedValue({ id: "qtn-1" });

    const result = await service.selectWinningBid(
      "tenant-1",
      "auction-1",
      "bid-1",
    );
    expect(result.bid).toBeDefined();
  });
});

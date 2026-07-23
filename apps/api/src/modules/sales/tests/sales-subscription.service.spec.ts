import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal { constructor(value: unknown) { return Number(value); } },
    JsonNull: "JsonNull",
  },
}));

vi.mock("@unerp/database", () => ({
  prisma: {
    subscription: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    subscriptionUsage: { findMany: vi.fn(), create: vi.fn() },
    subscriptionInvoice: { findMany: vi.fn(), create: vi.fn(), aggregate: vi.fn(), count: vi.fn() },
    invoice: { findFirst: vi.fn(), create: vi.fn() },
    organization: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { SalesSubscriptionService } from "../sales-subscription.service";

describe("SalesSubscriptionService", () => {
  let service: SalesSubscriptionService;

  beforeEach(() => { service = new SalesSubscriptionService(); vi.clearAllMocks(); });

  it("should list subscriptions", async () => {
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([{ id: "s1", name: "Pro Plan" }] as never);
    const result = await service.getSubscriptions("tenant-1");
    expect(result).toHaveLength(1);
  });

  it("should get subscription by id", async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({ id: "s1", name: "Pro Plan", lines: [], invoices: [], usage: [] } as never);
    const result = await service.getSubscriptionById("tenant-1", "s1");
    expect(result.name).toBe("Pro Plan");
  });

  it("should throw on not found", async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
    await expect(service.getSubscriptionById("tenant-1", "x")).rejects.toThrow(NotFoundException);
  });

  it("should create subscription", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.subscription.create).mockResolvedValue({ id: "s1", name: "New Sub" } as never);
    const dto = { name: "New Sub", customerId: "c1", unitAmount: 100, startDate: new Date().toISOString() };
    const result = await service.createSubscription("tenant-1", "org-1", dto);
    expect(result.name).toBe("New Sub");
  });

  it("should cancel subscription", async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({ id: "s1", status: "ACTIVE" } as never);
    vi.mocked(prisma.subscription.update).mockResolvedValue({ id: "s1", status: "CANCELED" } as never);
    const result = await service.cancelSubscription("tenant-1", "s1", false);
    expect(prisma.subscription.update).toHaveBeenCalled();
  });

  it("should pause and resume subscription", async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({ id: "s1", status: "ACTIVE" } as never);
    await service.pauseSubscription("tenant-1", "s1");
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({ id: "s1", status: "PAUSED" } as never);
    await service.resumeSubscription("tenant-1", "s1");
  });

  it("should record usage", async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({ id: "s1" } as never);
    vi.mocked(prisma.subscriptionUsage.create).mockResolvedValue({ id: "u1" } as never);
    const result = await service.recordUsage("tenant-1", "s1", { metricName: "api_calls", quantity: 100, unitAmount: 0.01 });
    expect(result).toBeDefined();
  });

  it("should generate recurring invoice", async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({ id: "s1", status: "ACTIVE", unitAmount: 100, quantity: 1, orgId: "org-1", name: "Pro", currency: "USD", customerId: "c1", currentPeriodStart: new Date(), currentPeriodEnd: new Date(), invoices: [], lines: [] } as never);
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.invoice.create).mockResolvedValue({ id: "inv-1" } as never);
    const result = await service.generateRecurringInvoice("tenant-1", "s1");
    expect(result).toBeDefined();
  });

  it("should run dunning process", async () => {
    vi.mocked(prisma.subscriptionInvoice.findMany).mockResolvedValue([{ invoiceId: "inv-1", invoice: { dueDate: new Date(Date.now() - 86400000 * 10) }, subscription: { name: "Pro" } }] as never);
    const result = await service.dunningProcess("tenant-1");
    expect(result.totalProcessed).toBe(1);
  });

  it("should return analytics", async () => {
    vi.mocked(prisma.subscription.count).mockResolvedValueOnce(10).mockResolvedValueOnce(2).mockResolvedValueOnce(12);
    vi.mocked(prisma.subscriptionInvoice.aggregate).mockResolvedValue({ _sum: { amount: 120000 } } as never);
    const result = await service.getSubscriptionAnalytics("tenant-1");
    expect(result.activeSubscriptions).toBe(10);
  });
});

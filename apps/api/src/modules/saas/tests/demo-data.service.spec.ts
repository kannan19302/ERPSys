import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DemoDataService } from "../demo-data.service";

// These tests came across with the service. They previously lived in the IdP's
// onboarding spec and were orphaned when the platform split deleted
// demo-data.service.ts without moving it; the spec kept importing a file that
// no longer existed, so the whole suite failed to collect.
const mocks = vi.hoisted(() => ({
  tenantFindUnique: vi.fn(),
  tenantUpdate: vi.fn(),
  orgFindFirst: vi.fn(),
  customerCreate: vi.fn(),
  vendorCreate: vi.fn(),
  productCreate: vi.fn(),
  executeRaw: vi.fn().mockResolvedValue(1),
}));

vi.mock("@unerp/database", () => {
  const prisma = {
    tenant: { findUnique: mocks.tenantFindUnique, update: mocks.tenantUpdate },
    organization: { findFirst: mocks.orgFindFirst },
    customer: { create: mocks.customerCreate },
    vendor: { create: mocks.vendorCreate },
    product: { create: mocks.productCreate },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) =>
      cb({
        $executeRaw: mocks.executeRaw,
        customer: { create: mocks.customerCreate },
        vendor: { create: mocks.vendorCreate },
        product: { create: mocks.productCreate },
        tenant: { update: mocks.tenantUpdate },
      }),
    ),
  };
  return { prisma, idpPrisma: prisma };
});

describe("DemoDataService", () => {
  let service: DemoDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.executeRaw.mockResolvedValue(1);
    service = new DemoDataService();
  });

  it("seeds sandbox records matching the tenant's industry", async () => {
    mocks.tenantFindUnique.mockResolvedValue({
      id: "t1",
      demoDataLoaded: false,
      settings: { industry: "healthcare" },
    });
    mocks.orgFindFirst.mockResolvedValue({ id: "o1" });

    const res = await service.seedDemoData("t1");

    expect(res.success).toBe(true);
    // Two customers and two vendors are seeded regardless of industry; the
    // product catalogue is what varies.
    expect(mocks.customerCreate).toHaveBeenCalledTimes(2);
    expect(mocks.vendorCreate).toHaveBeenCalledTimes(2);
    expect(mocks.productCreate).toHaveBeenCalled();
    const seededSkus = mocks.productCreate.mock.calls.map(
      (c: any) => c[0].data.sku,
    );
    expect(seededSkus.every((sku: string) => sku.startsWith("HC-"))).toBe(true);
    // The flag is set inside the same transaction as the inserts, so it cannot
    // read true for a seed that failed part-way.
    expect(mocks.tenantUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "t1" },
        data: expect.objectContaining({ demoDataLoaded: true }),
      }),
    );
  });

  it("sets the RLS tenant GUC before inserting", async () => {
    mocks.tenantFindUnique.mockResolvedValue({
      id: "t1",
      demoDataLoaded: false,
      settings: {},
    });
    mocks.orgFindFirst.mockResolvedValue({ id: "o1" });

    await service.seedDemoData("t1");

    // Seeding runs unattended, so nothing else sets app.current_tenant_id for
    // this transaction; without it every insert would be refused by RLS.
    expect(mocks.executeRaw).toHaveBeenCalled();
  });

  it("refuses to seed twice", async () => {
    mocks.tenantFindUnique.mockResolvedValue({
      id: "t1",
      demoDataLoaded: true,
      settings: {},
    });

    await expect(service.seedDemoData("t1")).rejects.toThrow(
      BadRequestException,
    );
    expect(mocks.customerCreate).not.toHaveBeenCalled();
  });

  it("rejects an unknown tenant", async () => {
    mocks.tenantFindUnique.mockResolvedValue(null);

    await expect(service.seedDemoData("nope")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("refuses to seed when the tenant has no organization to bind to", async () => {
    mocks.tenantFindUnique.mockResolvedValue({
      id: "t1",
      demoDataLoaded: false,
      settings: {},
    });
    mocks.orgFindFirst.mockResolvedValue(null);

    await expect(service.seedDemoData("t1")).rejects.toThrow(
      BadRequestException,
    );
  });
});

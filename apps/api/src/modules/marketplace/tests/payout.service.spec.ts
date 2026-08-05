import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@unerp/database";
import { PayoutService, ManualPayoutProvider } from "../payout.service";

/**
 * The payout ledger — § 8, Phase 5.
 *
 * These figures become a bank transfer to a real company, so the tests are
 * about exactness and about refusing to overstate what happened.
 */
describe("PayoutService", () => {
  const service = new PayoutService();
  const vendorId = `payout-spec-${Date.now()}`;

  afterAll(async () => {
    await prisma.marketplaceEarning.deleteMany({ where: { vendorId } });
    await prisma.marketplacePayoutBatch.deleteMany({ where: { vendorId } });
  });

  it("computes commission and net exactly, not in floating point", async () => {
    // 0.1 + 0.2 famously is not 0.3 in binary floating point. A ledger built on
    // that drifts by pennies nobody can account for.
    const earning = await service.accrue({
      vendorId,
      appSlug: "spec-app",
      payingTenantId: "tenant-x",
      grossAmount: "99.99",
      commissionRate: "0.30",
    });
    expect(earning.commissionAmount.toString()).toBe("29.997");
    expect(earning.netAmount.toString()).toBe("69.993");
    // gross must equal commission + net, exactly
    expect(earning.commissionAmount.plus(earning.netAmount).toString()).toBe(
      earning.grossAmount.toString(),
    );
  });

  it("freezes the commission rate on the earning", async () => {
    // Changing the platform's rate later must not restate what a publisher has
    // already earned, so the rate lives on the row rather than being looked up.
    const earning = await service.accrue({
      vendorId,
      appSlug: "spec-app",
      payingTenantId: "tenant-x",
      grossAmount: "100.00",
      commissionRate: "0.15",
    });
    expect(earning.commissionRate.toString()).toBe("0.15");
    expect(earning.netAmount.toString()).toBe("85");
  });

  it("refuses a non-positive or out-of-range input", async () => {
    await expect(
      service.accrue({
        vendorId,
        appSlug: "a",
        payingTenantId: "t",
        grossAmount: "0",
      }),
    ).rejects.toThrow(/positive gross/);
    await expect(
      service.accrue({
        vendorId,
        appSlug: "a",
        payingTenantId: "t",
        grossAmount: "10",
        commissionRate: "1.5",
      }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it("batches payable earnings and totals them exactly", async () => {
    const { batch, earningCount } = await service.createBatch({
      vendorId,
      periodStart: new Date(Date.now() - 86_400_000),
      periodEnd: new Date(Date.now() + 86_400_000),
    });
    expect(earningCount).toBe(2);
    // 69.993 + 85 = 154.993
    expect(batch.totalAmount.toString()).toBe("154.993");
    expect(batch.status).toBe("DRAFT");
  });

  it("will not create an empty batch", async () => {
    await expect(
      service.createBatch({
        vendorId,
        periodStart: new Date(Date.now() - 86_400_000),
        periodEnd: new Date(Date.now() + 86_400_000),
      }),
    ).rejects.toThrow(/No payable earnings/);
  });

  it("will not sum across currencies", async () => {
    const v = `${vendorId}-multi`;
    await service.accrue({
      vendorId: v,
      appSlug: "a",
      payingTenantId: "t",
      grossAmount: "10",
      currency: "USD",
    });
    await service.accrue({
      vendorId: v,
      appSlug: "a",
      payingTenantId: "t",
      grossAmount: "10",
      currency: "EUR",
    });
    await expect(
      service.createBatch({
        vendorId: v,
        periodStart: new Date(Date.now() - 86_400_000),
        periodEnd: new Date(Date.now() + 86_400_000),
      }),
    ).rejects.toThrow(/multiple currencies/);
    await prisma.marketplaceEarning.deleteMany({ where: { vendorId: v } });
  });

  it("refuses to mark a batch paid when no provider moved money", async () => {
    // A stub returning a fake reference would be worse than no provider: the
    // publisher would be told they were paid.
    const batch = await prisma.marketplacePayoutBatch.findFirst({
      where: { vendorId, status: "DRAFT" },
    });
    await service.approve(batch!.id, "operator-1");
    service.useProvider(new ManualPayoutProvider());
    await expect(service.pay(batch!.id)).rejects.toThrow(
      /No payment provider is configured/,
    );

    const after = await prisma.marketplacePayoutBatch.findUnique({
      where: { id: batch!.id },
    });
    expect(after!.status).toBe("FAILED");
    expect(after!.paidAt).toBeNull();
  });

  it("requires a provider reference to settle — the evidence money moved", async () => {
    const batch = await prisma.marketplacePayoutBatch.findFirst({
      where: { vendorId },
    });
    await expect(service.settle(batch!.id, "manual", "  ")).rejects.toThrow(
      /requires a provider reference/,
    );
  });

  it("settles a batch and marks its earnings paid", async () => {
    const batch = await prisma.marketplacePayoutBatch.findFirst({
      where: { vendorId },
    });
    const settled = await service.settle(
      batch!.id,
      "bank-transfer",
      "REF-12345",
    );
    expect(settled.status).toBe("PAID");
    expect(settled.providerRef).toBe("REF-12345");

    const earnings = await prisma.marketplaceEarning.findMany({
      where: { payoutBatchId: batch!.id },
    });
    expect(earnings.every((e) => e.status === "PAID")).toBe(true);
  });

  it("produces a statement that reconciles", async () => {
    const s = await service.statement(vendorId);
    // gross = commission + net, across the whole ledger
    const gross = Number(s.grossEarned);
    const commission = Number(s.commissionWithheld);
    const net = Number(s.netEarned);
    expect(gross).toBeCloseTo(commission + net, 4);
    expect(Number(s.paid)).toBeCloseTo(net, 4);
    expect(Number(s.awaitingPayout)).toBe(0);
  });
});

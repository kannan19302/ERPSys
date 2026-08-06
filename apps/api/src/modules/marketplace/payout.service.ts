import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@unerp/database";

/**
 * Marketplace earnings ledger and publisher payouts — § 8, Phase 5.
 *
 * This exists because the figure it replaces was invented.
 * `getRevenueAnalytics` computed `totalRevenue = apps.length * 1000` and then
 * `developerPayouts: totalRevenue * 0.7` from it, in binary floating point.
 * Publishers are real companies expecting real money; the numbers behind a
 * payout have to come from recorded events.
 *
 * Two properties this deliberately has:
 *
 *   - **Every amount is Decimal end to end.** Gross, commission and net are
 *     computed with `Prisma.Decimal` and stored as `Decimal(19,4)`. A payout is
 *     the last place a half-cent should appear, and it is the sum of thousands
 *     of rows.
 *   - **The commission RATE is stored on each earning**, not looked up when a
 *     statement is rendered. Changing the platform's rate must not silently
 *     restate what a publisher already earned.
 *
 * The transfer itself is behind `PayoutProvider`. A batch can be computed,
 * approved, audited and reported with no provider wired at all — which is the
 * line between the ledger (owned here) and the movement of money (owned by a
 * payment provider, and requiring credentials this platform does not assume).
 */

/** Where the money actually goes. Implemented per provider. */
export interface PayoutProvider {
  readonly name: string;
  /** Transfer `amount` to the vendor. Returns the provider's own reference. */
  transfer(params: {
    vendorId: string;
    amount: string;
    currency: string;
    batchId: string;
  }): Promise<{ reference: string }>;
}

/**
 * The default. It records that a batch is ready and refuses to claim money
 * moved, because nothing moved it.
 *
 * A stub that returned a fake reference would be worse than no provider: the
 * batch would read as PAID, a publisher would be told they were paid, and the
 * discrepancy would surface as an accounting problem rather than a wiring one.
 */
export class ManualPayoutProvider implements PayoutProvider {
  readonly name = "manual";
  async transfer(): Promise<{ reference: string }> {
    throw new BadRequestException(
      "No payment provider is configured. The batch is computed and approved; " +
        "settle it out of band and record the reference with `settle()`, or wire a " +
        "PayoutProvider. Refusing to mark a batch PAID when nothing was transferred.",
    );
  }
}

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);
  private provider: PayoutProvider = new ManualPayoutProvider();

  /** Platform default commission. Applied at accrual and then frozen per row. */
  static readonly DEFAULT_COMMISSION_RATE = "0.30";

  useProvider(provider: PayoutProvider): void {
    this.provider = provider;
  }

  /**
   * Record what a publisher earned from one charge.
   *
   * Commission is computed with Decimal arithmetic and rounded once, at the
   * point of record — not accumulated as a float and rounded at the end, which
   * is how a ledger and a bank statement come to disagree by pennies that
   * nobody can account for.
   */
  async accrue(params: {
    vendorId: string;
    appSlug: string;
    payingTenantId: string;
    grossAmount: string;
    currency?: string;
    commissionRate?: string;
  }) {
    const gross = new Prisma.Decimal(params.grossAmount);
    if (gross.lessThanOrEqualTo(0)) {
      throw new BadRequestException(
        "An earning must have a positive gross amount.",
      );
    }
    const rate = new Prisma.Decimal(
      params.commissionRate ?? PayoutService.DEFAULT_COMMISSION_RATE,
    );
    if (rate.lessThan(0) || rate.greaterThan(1)) {
      throw new BadRequestException("Commission rate must be between 0 and 1.");
    }

    const commission = gross.mul(rate).toDecimalPlaces(4);
    const net = gross.minus(commission);

    return prisma.marketplaceEarning.create({
      data: {
        vendorId: params.vendorId,
        appSlug: params.appSlug,
        payingTenantId: params.payingTenantId,
        grossAmount: gross,
        commissionAmount: commission,
        netAmount: net,
        commissionRate: rate,
        currency: params.currency ?? "USD",
        status: "PAYABLE",
      },
    });
  }

  /**
   * Build a payout batch from everything payable in a period.
   *
   * Claiming the earnings into the batch and computing the total happen in one
   * transaction, so two concurrent runs cannot both pay the same earning — the
   * failure mode that turns a payout bug into paying twice.
   */
  async createBatch(params: {
    vendorId: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    if (params.periodEnd <= params.periodStart) {
      throw new BadRequestException("Payout period must end after it starts.");
    }

    return prisma.$transaction(async (tx) => {
      const earnings = await tx.marketplaceEarning.findMany({
        where: {
          vendorId: params.vendorId,
          status: "PAYABLE",
          payoutBatchId: null,
          earnedAt: { gte: params.periodStart, lte: params.periodEnd },
        },
      });

      if (earnings.length === 0) {
        throw new BadRequestException(
          "No payable earnings in that period; refusing to create an empty batch.",
        );
      }

      const currencies = new Set(earnings.map((e) => e.currency));
      if (currencies.size > 1) {
        // Summing across currencies would produce a number that is not money.
        throw new BadRequestException(
          `Earnings span multiple currencies (${[...currencies].join(", ")}); ` +
            "a batch must settle a single currency.",
        );
      }

      const total = earnings.reduce(
        (sum, e) => sum.plus(new Prisma.Decimal(e.netAmount)),
        new Prisma.Decimal(0),
      );

      const batch = await tx.marketplacePayoutBatch.create({
        data: {
          vendorId: params.vendorId,
          periodStart: params.periodStart,
          periodEnd: params.periodEnd,
          totalAmount: total,
          currency: earnings[0]!.currency,
          status: "DRAFT",
        },
      });

      await tx.marketplaceEarning.updateMany({
        where: { id: { in: earnings.map((e) => e.id) } },
        data: { payoutBatchId: batch.id },
      });

      return { batch, earningCount: earnings.length };
    });
  }

  /** Platform operator approval. Separate from creation, and from payment. */
  async approve(batchId: string, approvedByUserId: string) {
    const batch = await this.require(batchId);
    if (batch.status !== "DRAFT") {
      throw new BadRequestException(`Batch is ${batch.status}, not DRAFT.`);
    }
    return prisma.marketplacePayoutBatch.update({
      where: { id: batchId },
      data: { status: "APPROVED", approvedByUserId, approvedAt: new Date() },
    });
  }

  /** Attempt the transfer through the configured provider. */
  async pay(batchId: string) {
    const batch = await this.require(batchId);
    if (batch.status !== "APPROVED") {
      throw new ForbiddenException(
        `Batch is ${batch.status}; only an APPROVED batch may be paid.`,
      );
    }

    try {
      const { reference } = await this.provider.transfer({
        vendorId: batch.vendorId,
        amount: batch.totalAmount.toString(),
        currency: batch.currency,
        batchId: batch.id,
      });
      return this.settle(batchId, this.provider.name, reference);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown";
      await prisma.marketplacePayoutBatch.update({
        where: { id: batchId },
        data: { status: "FAILED", failureReason: reason },
      });
      throw error;
    }
  }

  /**
   * Record that a batch was settled, with the reference proving it.
   *
   * Separate from `pay()` so an out-of-band transfer can be recorded honestly
   * — the ledger reflects what happened, whoever moved the money.
   */
  async settle(batchId: string, provider: string, providerRef: string) {
    if (!providerRef?.trim()) {
      throw new BadRequestException(
        "A settled batch requires a provider reference; that reference is the evidence the money moved.",
      );
    }
    return prisma.$transaction(async (tx) => {
      const batch = await tx.marketplacePayoutBatch.update({
        where: { id: batchId },
        data: { status: "PAID", provider, providerRef, paidAt: new Date() },
      });
      await tx.marketplaceEarning.updateMany({
        where: { payoutBatchId: batchId },
        data: { status: "PAID" },
      });
      this.logger.log(
        JSON.stringify({
          event: "marketplace_payout_settled",
          batchId,
          vendorId: batch.vendorId,
          amount: batch.totalAmount.toString(),
          currency: batch.currency,
          provider,
        }),
      );
      return batch;
    });
  }

  /** A publisher's statement: what they earned, what is owed, what was paid. */
  async statement(vendorId: string) {
    const [earnings, batches] = await Promise.all([
      prisma.marketplaceEarning.findMany({ where: { vendorId } }),
      prisma.marketplacePayoutBatch.findMany({
        where: { vendorId },
        orderBy: { periodEnd: "desc" },
      }),
    ]);

    const sum = (rows: Array<{ netAmount: Prisma.Decimal }>) =>
      rows
        .reduce(
          (acc, r) => acc.plus(new Prisma.Decimal(r.netAmount)),
          new Prisma.Decimal(0),
        )
        .toFixed(4);

    return {
      vendorId,
      grossEarned: earnings
        .reduce(
          (acc, e) => acc.plus(new Prisma.Decimal(e.grossAmount)),
          new Prisma.Decimal(0),
        )
        .toFixed(4),
      commissionWithheld: earnings
        .reduce(
          (acc, e) => acc.plus(new Prisma.Decimal(e.commissionAmount)),
          new Prisma.Decimal(0),
        )
        .toFixed(4),
      netEarned: sum(earnings),
      awaitingPayout: sum(earnings.filter((e) => e.status === "PAYABLE")),
      paid: sum(earnings.filter((e) => e.status === "PAID")),
      batches: batches.map((b) => ({
        id: b.id,
        period: { start: b.periodStart, end: b.periodEnd },
        amount: b.totalAmount.toString(),
        currency: b.currency,
        status: b.status,
        providerRef: b.providerRef,
      })),
    };
  }

  private async require(batchId: string) {
    const batch = await prisma.marketplacePayoutBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch)
      throw new NotFoundException(`Payout batch ${batchId} not found.`);
    return batch;
  }
}

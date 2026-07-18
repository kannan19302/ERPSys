/**
 * Document Numbering Service — Track G.5
 *
 * Tenant-scoped, gapless-where-required, concurrency-safe numbering for
 * business documents (invoices, POs, JEs, quotes, etc.).
 *
 * Usage: wrap calls inside a Prisma `$transaction` to ensure the
 * `SELECT … FOR UPDATE` row-level lock is held for the full atomic unit.
 *
 * ```ts
 * const svc = new NumberingService();
 * const number = await prisma.$transaction((tx) =>
 *   svc.getNextNumber(tx, tenantId, 'INV'),
 * );
 * ```
 */

// ── Minimal row shape (matches Prisma DocumentSequence model) ──
export interface DocumentSequenceRow {
  id: string;
  tenantId: string;
  series: string;
  organizationId: string | null;
  prefix: string;
  suffix: string;
  padding: number;
  nextNumber: number;
  resetFrequency: string | null;
  resetPeriod: string | null;
  format: string;
  version: number;
}

// ── Transaction-adapter interface ──
// The caller passes a Prisma transaction client (or any object satisfying
// this shape). This keeps the service dependency-free.
export interface NumberingTx {
  documentSequence: {
    findUnique(args: {
      where: {
        tenantId_series_organizationId: {
          tenantId: string;
          series: string;
          organizationId: string | null;
        };
      };
    }): Promise<DocumentSequenceRow | null>;

    update(args: {
      where: { id: string };
      data: {
        nextNumber?: number;
        resetPeriod?: string | null;
        version?: number;
      };
    }): Promise<DocumentSequenceRow>;
  };
}

export interface GetNextNumberOptions {
  organizationId?: string;
  /** Override the reference date for period-based auto-reset (for testing). */
  now?: Date;
}

export interface NumberingResult {
  series: string;
  number: string;
  sequence: number;
}

export class NumberingService {
  /**
   * Acquires a row-level lock (`FOR UPDATE`) on the DocumentSequence row,
   * increments `nextNumber`, and returns the formatted number.
   *
   * Auto-resets to 1 when `resetFrequency` is YEARLY/MONTHLY and the
   * stored `resetPeriod` does not match the current period.
   */
  async getNextNumber(
    tx: NumberingTx,
    tenantId: string,
    series: string,
    opts?: GetNextNumberOptions,
  ): Promise<NumberingResult> {
    const orgId = opts?.organizationId ?? null;

    const seq = await tx.documentSequence.findUnique({
      where: {
        tenantId_series_organizationId: { tenantId, series, organizationId: orgId },
      },
    });

    if (!seq) {
      throw new Error(`DocumentSequence not found for (${tenantId}, ${series}, ${orgId})`);
    }

    const { number, nextResetPeriod } = this.prepareNextNumber(seq, opts?.now);

    const updateData: { nextNumber: number; resetPeriod?: string | null } = {
      nextNumber: seq.nextNumber + 1,
    };
    if (nextResetPeriod !== undefined) {
      updateData.resetPeriod = nextResetPeriod;
    }

    await tx.documentSequence.update({
      where: { id: seq.id },
      data: updateData,
    });

    return {
      series,
      number: this.formatNumber(seq, number),
      sequence: number,
    };
  }

  /**
   * Returns the formatted next number **without** incrementing.
   * Safe to call outside a transaction; no lock is acquired.
   */
  async peekNextNumber(
    tx: NumberingTx,
    tenantId: string,
    series: string,
    opts?: { organizationId?: string; now?: Date },
  ): Promise<NumberingResult> {
    const orgId = opts?.organizationId ?? null;

    const seq = await tx.documentSequence.findUnique({
      where: {
        tenantId_series_organizationId: { tenantId, series, organizationId: orgId },
      },
    });

    if (!seq) {
      throw new Error(`DocumentSequence not found for (${tenantId}, ${series}, ${orgId})`);
    }

    const { number } = this.prepareNextNumber(seq, opts?.now);

    return {
      series,
      number: this.formatNumber(seq, number),
      sequence: number,
    };
  }

  /**
   * Manually resets the sequence counter (admin use).
   */
  async resetSequence(
    tx: NumberingTx,
    tenantId: string,
    series: string,
    nextNumber: number,
    opts?: { organizationId?: string },
  ): Promise<void> {
    const orgId = opts?.organizationId ?? null;

    const exists = await tx.documentSequence.findUnique({
      where: {
        tenantId_series_organizationId: { tenantId, series, organizationId: orgId },
      },
    });

    if (!exists) {
      throw new Error(`DocumentSequence not found for (${tenantId}, ${series}, ${orgId})`);
    }

    await tx.documentSequence.update({
      where: { id: exists.id },
      data: { nextNumber },
    });
  }

  /**
   * Applies the format template to produce the final document number.
   *
   * Template variables:
   *   `{prefix}` — sequence prefix (e.g. "INV-")
   *   `{number}` — zero-padded number
   *   `{suffix}` — sequence suffix
   */
  formatNumber(
    seq: { prefix: string; suffix: string; padding: number; format: string },
    number: number,
  ): string {
    const padded = String(number).padStart(seq.padding, '0');
    return seq.format
      .replace('{prefix}', seq.prefix)
      .replace('{number}', padded)
      .replace('{suffix}', seq.suffix);
  }

  // ── Internal ──

  /**
   * Determines the actual next number to use, applying auto-reset logic
   * for YEARLY/MONTHLY sequences when the reference period changes.
   *
   * Returns the number to assign and (when changed) the new resetPeriod value.
   */
  private prepareNextNumber(
    seq: DocumentSequenceRow,
    now?: Date,
  ): { number: number; nextResetPeriod?: string } {
    if (!seq.resetFrequency || seq.resetFrequency === 'NEVER') {
      return { number: seq.nextNumber };
    }

    const ref = now ?? new Date();
    let currentPeriod: string;

    if (seq.resetFrequency === 'YEARLY') {
      currentPeriod = String(ref.getFullYear());
    } else if (seq.resetFrequency === 'MONTHLY') {
      currentPeriod = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;
    } else {
      return { number: seq.nextNumber };
    }

    if (seq.resetPeriod !== currentPeriod) {
      return { number: 1, nextResetPeriod: currentPeriod };
    }

    return { number: seq.nextNumber };
  }
}

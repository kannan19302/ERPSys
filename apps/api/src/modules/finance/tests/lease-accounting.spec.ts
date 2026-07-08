import { describe, it, expect } from 'vitest';
import { computeAmortizationSchedule } from '../lease-accounting.service';

describe('Lease amortization', () => {
  it('computes schedule with correct number of months and principal sum', () => {
    const pv = 12000;
    const annualRate = 0.06; // 6% annual
    const start = new Date(2026, 0, 1); // Jan 1, 2026
    const months = 12;

    const rows = computeAmortizationSchedule(pv, annualRate, start, months);
    expect(rows.length).toBe(months);

    // sum of principal repayments should be approximately the PV (allow small rounding error)
    const totalPrincipal = rows.reduce((s, r) => s + r.principalRepayment, 0);
    expect(totalPrincipal).toBeGreaterThan(pv - 0.5);
    expect(totalPrincipal).toBeLessThan(pv + 0.5);
  });
});

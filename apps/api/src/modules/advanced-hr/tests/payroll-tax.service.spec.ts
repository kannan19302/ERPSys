import { describe, it, expect } from 'vitest';
import { PayrollTaxService } from '../payroll-tax.service';

describe('PayrollTaxService', () => {
  const service = new PayrollTaxService();

  describe('getSupportedJurisdictions', () => {
    it('returns US_FEDERAL and IN_CENTRAL', () => {
      const jurisdictions = service.getSupportedJurisdictions();
      expect(jurisdictions.length).toBeGreaterThanOrEqual(2);
      expect(jurisdictions.map(j => j.code)).toContain('US_FEDERAL');
      expect(jurisdictions.map(j => j.code)).toContain('IN_CENTRAL');
    });
  });

  describe('calculateIncomeTax — US Federal', () => {
    it('calculates 10% bracket for low income', () => {
      const tax = service.calculateIncomeTax(10000, 'US_FEDERAL');
      expect(tax).toBe(1000);
    });

    it('calculates correctly in the 12% bracket', () => {
      const tax = service.calculateIncomeTax(30000, 'US_FEDERAL');
      // 10% on first 11600 = 1160, 12% on (30000-11600)=18400 = 2208, total = 3368
      expect(tax).toBe(3368);
    });

    it('returns 0 for 0 income', () => {
      expect(service.calculateIncomeTax(0, 'US_FEDERAL')).toBe(0);
    });

    it('throws for unknown jurisdiction', () => {
      expect(() => service.calculateIncomeTax(50000, 'MARS')).toThrow('Unsupported jurisdiction');
    });
  });

  describe('calculateIncomeTax — India', () => {
    it('returns 0 for income under 300000', () => {
      expect(service.calculateIncomeTax(250000, 'IN_CENTRAL')).toBe(0);
    });

    it('calculates 5% bracket for 500000', () => {
      const tax = service.calculateIncomeTax(500000, 'IN_CENTRAL');
      // 5% on (500000-300000)=200000 = 10000
      expect(tax).toBe(10000);
    });
  });

  describe('calculatePayrollTaxes', () => {
    it('produces correct net pay breakdown for US', () => {
      const result = service.calculatePayrollTaxes(5000, 0, 'US_FEDERAL');

      expect(result.grossPay).toBe(5000);
      expect(result.netPay).toBeLessThan(5000);
      expect(result.totalEmployeeDeductions).toBeGreaterThan(0);
      expect(result.employeeDeductions.length).toBe(3);
      expect(result.employerContributions.length).toBe(3);
      expect(result.totalCostToCompany).toBeGreaterThan(5000);

      // Social security = 5000 * 6.2% = 310
      const ss = result.employeeDeductions.find(d => d.name === 'Social Security');
      expect(ss?.amount).toBe(310);

      // Medicare = 5000 * 1.45% = 72.5
      const mc = result.employeeDeductions.find(d => d.name === 'Medicare');
      expect(mc?.amount).toBe(72.5);
    });

    it('caps social security at wage ceiling', () => {
      const result = service.calculatePayrollTaxes(10000, 165000, 'US_FEDERAL');
      // Only 168600-165000 = 3600 subject to SS
      const ss = result.employeeDeductions.find(d => d.name === 'Social Security');
      expect(ss?.amount).toBe(Math.round(3600 * 0.062 * 100) / 100);
    });
  });
});

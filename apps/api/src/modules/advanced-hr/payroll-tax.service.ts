import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  fixedAmount: number;
}

interface JurisdictionConfig {
  code: string;
  name: string;
  incomeTaxBrackets: TaxBracket[];
  socialSecurityRate: number;
  socialSecurityCap: number;
  medicareLikeRate: number;
  employerContributions: Array<{ name: string; rate: number; cap?: number }>;
}

const JURISDICTIONS: Record<string, JurisdictionConfig> = {
  US_FEDERAL: {
    code: 'US_FEDERAL',
    name: 'United States — Federal',
    incomeTaxBrackets: [
      { min: 0, max: 11600, rate: 0.10, fixedAmount: 0 },
      { min: 11600, max: 47150, rate: 0.12, fixedAmount: 1160 },
      { min: 47150, max: 100525, rate: 0.22, fixedAmount: 5426 },
      { min: 100525, max: 191950, rate: 0.24, fixedAmount: 17168.5 },
      { min: 191950, max: 243725, rate: 0.32, fixedAmount: 39110.5 },
      { min: 243725, max: 609350, rate: 0.35, fixedAmount: 55678.5 },
      { min: 609350, max: Infinity, rate: 0.37, fixedAmount: 183647.25 },
    ],
    socialSecurityRate: 0.062,
    socialSecurityCap: 168600,
    medicareLikeRate: 0.0145,
    employerContributions: [
      { name: 'FICA - Social Security (Employer)', rate: 0.062, cap: 168600 },
      { name: 'FICA - Medicare (Employer)', rate: 0.0145 },
      { name: 'FUTA', rate: 0.006, cap: 7000 },
    ],
  },
  IN_CENTRAL: {
    code: 'IN_CENTRAL',
    name: 'India — Central (New Regime)',
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0, fixedAmount: 0 },
      { min: 300000, max: 700000, rate: 0.05, fixedAmount: 0 },
      { min: 700000, max: 1000000, rate: 0.10, fixedAmount: 20000 },
      { min: 1000000, max: 1200000, rate: 0.15, fixedAmount: 50000 },
      { min: 1200000, max: 1500000, rate: 0.20, fixedAmount: 80000 },
      { min: 1500000, max: Infinity, rate: 0.30, fixedAmount: 140000 },
    ],
    socialSecurityRate: 0.12, // PF employee
    socialSecurityCap: 180000, // PF wage ceiling
    medicareLikeRate: 0.0075, // ESI employee
    employerContributions: [
      { name: 'EPF (Employer)', rate: 0.12, cap: 180000 },
      { name: 'ESI (Employer)', rate: 0.0325 },
    ],
  },
};

@Injectable()
export class PayrollTaxService {
  getSupportedJurisdictions() {
    return Object.values(JURISDICTIONS).map((j) => ({
      code: j.code,
      name: j.name,
    }));
  }

  calculateIncomeTax(annualIncome: number, jurisdictionCode: string): number {
    const jurisdiction = JURISDICTIONS[jurisdictionCode];
    if (!jurisdiction) throw new BadRequestException(`Unsupported jurisdiction: ${jurisdictionCode}`);

    const brackets = jurisdiction.incomeTaxBrackets;
    let tax = 0;

    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i]!;
      if (annualIncome <= bracket.min) break;

      if (annualIncome > bracket.max) {
        if (i === brackets.length - 1) {
          tax = bracket.fixedAmount + (annualIncome - bracket.min) * bracket.rate;
        }
        continue;
      }

      tax = bracket.fixedAmount + (annualIncome - bracket.min) * bracket.rate;
      break;
    }

    return Math.round(tax * 100) / 100;
  }

  calculatePayrollTaxes(
    grossPay: number,
    annualGrossToDate: number,
    jurisdictionCode: string,
  ) {
    const jurisdiction = JURISDICTIONS[jurisdictionCode];
    if (!jurisdiction) throw new BadRequestException(`Unsupported jurisdiction: ${jurisdictionCode}`);

    const annualizedGross = annualGrossToDate + grossPay;

    // Income tax (pro-rated monthly)
    const annualTax = this.calculateIncomeTax(annualizedGross, jurisdictionCode);
    const annualTaxPrior = this.calculateIncomeTax(annualGrossToDate, jurisdictionCode);
    const periodIncomeTax = Math.max(0, annualTax - annualTaxPrior);

    // Social security (employee)
    const ssWages = Math.min(grossPay, Math.max(0, jurisdiction.socialSecurityCap - annualGrossToDate));
    const socialSecurity = ssWages * jurisdiction.socialSecurityRate;

    // Medicare-like (employee)
    const medicare = grossPay * jurisdiction.medicareLikeRate;

    const employeeDeductions = [
      { name: 'Income Tax', amount: Math.round(periodIncomeTax * 100) / 100 },
      { name: 'Social Security', amount: Math.round(socialSecurity * 100) / 100 },
      { name: 'Medicare', amount: Math.round(medicare * 100) / 100 },
    ];

    // Employer contributions
    const employerContributions = jurisdiction.employerContributions.map((c) => {
      const wages = c.cap ? Math.min(grossPay, Math.max(0, c.cap - annualGrossToDate)) : grossPay;
      return {
        name: c.name,
        amount: Math.round(wages * c.rate * 100) / 100,
      };
    });

    const totalEmployeeDeductions = employeeDeductions.reduce((s, d) => s + d.amount, 0);
    const totalEmployerCost = employerContributions.reduce((s, c) => s + c.amount, 0);
    const netPay = Math.round((grossPay - totalEmployeeDeductions) * 100) / 100;

    return {
      grossPay,
      jurisdiction: jurisdictionCode,
      employeeDeductions,
      totalEmployeeDeductions: Math.round(totalEmployeeDeductions * 100) / 100,
      netPay,
      employerContributions,
      totalEmployerCost: Math.round(totalEmployerCost * 100) / 100,
      totalCostToCompany: Math.round((grossPay + totalEmployerCost) * 100) / 100,
    };
  }

  async processPayrollWithTax(
    tenantId: string,
    payrollRunId: string,
    jurisdictionCode: string,
  ) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: payrollRunId, tenantId },
      include: { slips: true },
    });
    if (!run) throw new BadRequestException('Payroll run not found');

    const results = [];

    for (const slip of run.slips) {
      const grossPay = Number(slip.grossSalary);
      const ytdGross = 0; // In production, sum prior slips for the fiscal year

      const taxCalc = this.calculatePayrollTaxes(grossPay, ytdGross, jurisdictionCode);

      await prisma.payrollSlip.update({
        where: { id: slip.id },
        data: {
          deductions: new Prisma.Decimal(taxCalc.totalEmployeeDeductions),
          netSalary: new Prisma.Decimal(taxCalc.netPay),
        },
      });

      results.push({
        employeeId: slip.employeeId,
        grossPay,
        deductions: taxCalc.employeeDeductions,
        netPay: taxCalc.netPay,
        employerCost: taxCalc.totalEmployerCost,
      });
    }

    return {
      payrollRunId,
      jurisdiction: jurisdictionCode,
      slipsProcessed: results.length,
      totalGross: results.reduce((s, r) => s + r.grossPay, 0),
      totalNet: results.reduce((s, r) => s + r.netPay, 0),
      totalEmployerCost: results.reduce((s, r) => s + r.employerCost, 0),
      results,
    };
  }
}

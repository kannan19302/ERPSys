import { z } from "zod";

export const propertyFinancialSchema = z.object({
  propertyId: z.string().min(1),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  grossRentIncome: z.number().min(0).default(0),
  otherIncome: z.number().min(0).default(0),
  totalIncome: z.number().min(0).default(0),
  vacancyLoss: z.number().min(0).default(0),
  effectiveIncome: z.number().min(0).default(0),
  operatingExpenses: z.number().min(0).default(0),
  repairsMaintenance: z.number().min(0).default(0),
  propertyManagement: z.number().min(0).default(0),
  insurance: z.number().min(0).default(0),
  taxes: z.number().min(0).default(0),
  utilities: z.number().min(0).default(0),
  hoaFees: z.number().min(0).default(0),
  otherExpenses: z.number().min(0).default(0),
  totalExpenses: z.number().min(0).default(0),
  netOperatingIncome: z.number().min(0).default(0),
  debtService: z.number().min(0).default(0),
  cashFlowBeforeTax: z.number().min(0).default(0),
  capitalExpenditures: z.number().min(0).default(0),
  netCashFlow: z.number().min(0).default(0),
  capRate: z.number().optional().nullable(),
  cashOnCashReturn: z.number().optional().nullable(),
  occupancyRate: z.number().optional().nullable(),
  status: z.string().default("DRAFT"),
  currency: z.string().default("USD"),
  notes: z.string().optional().nullable(),
});

export const propertyFinancialUpdateSchema = propertyFinancialSchema.partial();

export const expenseCategorySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z
    .enum(["OPERATING", "CAPITAL", "ADMINISTRATIVE", "OTHER"])
    .default("OPERATING"),
  isTaxDeductible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const expenseCategoryUpdateSchema = expenseCategorySchema.partial();

export type PropertyFinancialDto = z.infer<typeof propertyFinancialSchema>;
export type ExpenseCategoryDto = z.infer<typeof expenseCategorySchema>;

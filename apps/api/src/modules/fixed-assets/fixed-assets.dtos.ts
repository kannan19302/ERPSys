import { z } from "zod";

export const createFixedAssetCategorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  depreciationMethod: z.enum(["SLM", "WDV"]),
  expectedLifeMonths: z.number().int().positive(),
  depreciationRate: z.number().min(0).max(100).optional(),
  assetAccountId: z.string().optional(),
  depreciationAccountId: z.string().optional(),
  expenseAccountId: z.string().optional(),
});

export const createFixedAssetSchema = z.object({
  assetCode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().optional(),
  purchaseDate: z.string().min(1),
  purchaseValue: z.number().nonnegative(),
  salvageValue: z.number().nonnegative(),
  usefulLifeYears: z.number().int().positive(),
  depreciationMethod: z.string().min(1),
  depreciationRate: z.number().min(0).max(100).optional(),
  accountId: z.string().min(1),
  accumDepAccountId: z.string().min(1),
  locationId: z.string().optional(),
  custodianId: z.string().optional(),
});

export const updateFixedAssetSchema = createFixedAssetSchema
  .partial()
  .omit({ assetCode: true });
export const transferFixedAssetSchema = z.object({
  transferDate: z.string().min(1),
  toLocationId: z.string().optional(),
  toCustodianId: z.string().optional(),
  reason: z.string().max(2000).optional(),
});

export const logFixedAssetMaintenanceSchema = z.object({
  maintenanceDate: z.string().min(1),
  type: z.enum(["PREVENTIVE", "CORRECTIVE", "CALIBRATION"]),
  description: z.string().min(1).max(2000),
  cost: z.number().nonnegative(),
  performedBy: z.string().min(1),
  nextMaintenanceDate: z.string().optional(),
});

export const disposeFixedAssetSchema = z.object({
  disposalDate: z.string().min(1),
  disposalType: z.enum(["SALE", "SCRAP", "DONATION", "THEFT"]),
  salePrice: z.number().nonnegative().optional(),
  reason: z.string().max(2000).optional(),
  approvedBy: z.string().min(1),
});

export const createDepreciationScheduleSchema = z.object({
  assetId: z.string().min(1),
  period: z.string().min(1),
  startingBookValue: z.number(),
  depreciationAmount: z.number(),
  endingBookValue: z.number(),
  accumulatedDepreciation: z.number(),
});

export const postDepreciationSchema = z.object({
  periodName: z
    .string()
    .min(4)
    .max(10)
    .regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM"),
});

export interface CreateFixedAssetCategoryInput {
  name: string;
  description?: string;
  depreciationMethod: "SLM" | "WDV";
  expectedLifeMonths: number;
  depreciationRate?: number;
  assetAccountId?: string;
  depreciationAccountId?: string;
  expenseAccountId?: string;
}
export interface CreateFixedAssetInput {
  assetCode: string;
  name: string;
  description?: string;
  categoryId?: string;
  purchaseDate: string;
  purchaseValue: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: string;
  depreciationRate?: number;
  accountId: string;
  accumDepAccountId: string;
  locationId?: string;
  custodianId?: string;
}
export interface UpdateFixedAssetInput {
  name?: string;
  description?: string;
  categoryId?: string | null;
  purchaseDate?: string;
  purchaseValue?: number;
  salvageValue?: number;
  usefulLifeYears?: number;
  depreciationMethod?: string;
  depreciationRate?: number;
  accountId?: string;
  accumDepAccountId?: string;
  locationId?: string | null;
  custodianId?: string | null;
  status?: string;
}
export interface TransferFixedAssetInput {
  transferDate: string;
  toLocationId?: string;
  toCustodianId?: string;
  reason?: string;
}
export interface LogFixedAssetMaintenanceInput {
  maintenanceDate: string;
  type: "PREVENTIVE" | "CORRECTIVE" | "CALIBRATION";
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate?: string;
}
export interface DisposeFixedAssetInput {
  disposalDate: string;
  disposalType: "SALE" | "SCRAP" | "DONATION" | "THEFT";
  salePrice?: number;
  reason?: string;
  approvedBy: string;
}
export interface PostDepreciationInput {
  periodName: string;
}

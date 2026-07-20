import { z } from 'zod';

export const createFixedAssetCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(200),
  description: z.string().max(2000).optional(),
  depreciationMethod: z.enum(['SLM', 'WDV']),
  expectedLifeMonths: z.number().int().positive(),
  depreciationRate: z.number().min(0).max(100).optional(),
  assetAccountId: z.string().optional(),
  depreciationAccountId: z.string().optional(),
  expenseAccountId: z.string().optional(),
});

export const createFixedAssetSchema = z.object({
  assetCode: z.string().min(1, 'Asset code is required').max(50),
  name: z.string().min(1, 'Asset name is required').max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().optional(),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  purchaseValue: z.number().nonnegative(),
  salvageValue: z.number().nonnegative(),
  usefulLifeYears: z.number().int().positive(),
  depreciationMethod: z.string().min(1),
  depreciationRate: z.number().min(0).max(100).optional(),
  accountId: z.string().min(1, 'Asset account is required'),
  accumDepAccountId: z.string().min(1, 'Accumulated depreciation account is required'),
  locationId: z.string().optional(),
  custodianId: z.string().optional(),
});

export const updateFixedAssetSchema = createFixedAssetSchema.partial().omit({ assetCode: true });
export const transferFixedAssetSchema = z.object({
  transferDate: z.string().min(1, 'Transfer date is required'),
  toLocationId: z.string().optional(),
  toCustodianId: z.string().optional(),
  reason: z.string().max(2000).optional(),
});
export const logFixedAssetMaintenanceSchema = z.object({
  maintenanceDate: z.string().min(1, 'Maintenance date is required'),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION']),
  description: z.string().min(1, 'Description is required').max(2000),
  cost: z.number().nonnegative(),
  performedBy: z.string().min(1, 'Performer name is required'),
  nextMaintenanceDate: z.string().optional(),
});

export interface CreateFixedAssetCategoryInput {
  name: string;
  description?: string;
  depreciationMethod: 'SLM' | 'WDV';
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
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION';
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate?: string;
}

// @ts-nocheck
import { z } from "zod";

export const createLocaleSchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(1).max(100),
  direction: z.enum(["ltr", "rtl"]).default("ltr"),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const updateLocaleSchema = createLocaleSchema
  .partial()
  .omit({ code: true });

export const createTranslationKeySchema = z.object({
  key: z.string().min(1),
  module: z.string().min(1),
  description: z.string().optional(),
  isDynamic: z.boolean().default(false),
});

export const upsertTranslationSchema = z.object({
  localeId: z.string().min(1),
  keyId: z.string().min(1),
  value: z.string().min(1),
  isOverride: z.boolean().default(false),
});

export const importTranslationsSchema = z.object({
  localeCode: z.string().min(1),
  entries: z.array(z.object({ key: z.string(), value: z.string() })),
});

export const createFormattingRuleSchema = z.object({
  localeId: z.string().min(1),
  dateFormat: z.string().default("YYYY-MM-DD"),
  timeFormat: z.string().default("HH:mm"),
  numberFormat: z.string().default("#,##0.00"),
  currencyCode: z.string().default("USD"),
  currencySymbol: z.string().default("$"),
  firstDayOfWeek: z.number().int().min(0).max(6).default(0),
  timezone: z.string().default("UTC"),
});

export interface CreateLocaleInput {
  code: string;
  name: string;
  direction?: string;
  isDefault?: boolean;
  sortOrder?: number;
}
export interface UpdateLocaleInput {
  name?: string;
  direction?: string;
  isDefault?: boolean;
  sortOrder?: number;
}
export interface CreateTranslationKeyInput {
  key: string;
  module: string;
  description?: string;
  isDynamic?: boolean;
}
export interface UpsertTranslationInput {
  localeId: string;
  keyId: string;
  value: string;
  isOverride?: boolean;
}
export interface ImportTranslationsInput {
  localeCode: string;
  entries: { key: string; value: string }[];
}
export interface CreateFormattingRuleInput {
  localeId: string;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
  currencyCode?: string;
  currencySymbol?: string;
  firstDayOfWeek?: number;
  timezone?: string;
}

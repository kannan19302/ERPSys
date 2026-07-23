import { z } from 'zod';

export const CreateEcommerceStoreSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  currency: z.string().default('USD'),
  language: z.string().default('en'),
  taxCalculation: z.enum(['INCLUSIVE', 'EXCLUSIVE']).default('EXCLUSIVE'),
  defaultWeightUnit: z.string().default('kg'),
  maxCartItems: z.number().int().default(100),
  minOrderAmount: z.number().optional(),
  maxOrderAmount: z.number().optional(),
});
export type CreateEcommerceStoreDto = z.infer<typeof CreateEcommerceStoreSchema>;

export const UpdateEcommerceStoreSchema = CreateEcommerceStoreSchema.partial().extend({
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});
export type UpdateEcommerceStoreDto = z.infer<typeof UpdateEcommerceStoreSchema>;

export const CreateEcommerceCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
});
export type CreateEcommerceCategoryDto = z.infer<typeof CreateEcommerceCategorySchema>;

export const UpdateEcommerceCategorySchema = CreateEcommerceCategorySchema.partial().extend({ isActive: z.boolean().optional() });

export const CreateEcommerceProductListingSchema = z.object({
  productId: z.string(),
  categoryId: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  media: z.array(z.object({ url: z.string(), type: z.string(), sortOrder: z.number().int().optional() })).default([]),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  variants: z.array(z.object({
    sku: z.string(),
    title: z.string(),
    attributes: z.record(z.any()).default({}),
    price: z.number(),
    compareAtPrice: z.number().optional(),
    costPrice: z.number().optional(),
    weight: z.number().optional(),
    quantity: z.number().int().default(0),
  })).optional(),
});
export type CreateEcommerceProductListingDto = z.infer<typeof CreateEcommerceProductListingSchema>;

export const UpdateEcommerceProductListingSchema = CreateEcommerceProductListingSchema.partial().omit({ variants: true }).extend({ isActive: z.boolean().optional() });

export const CreateEcommerceCouponSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING']),
  value: z.number(),
  minOrderAmount: z.number().optional(),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().int().optional(),
  perCustomerLimit: z.number().int().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});
export type CreateEcommerceCouponDto = z.infer<typeof CreateEcommerceCouponSchema>;

export const CreateEcommerceShippingZoneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  countries: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  zipCodes: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});
export type CreateEcommerceShippingZoneDto = z.infer<typeof CreateEcommerceShippingZoneSchema>;

export const CreateEcommerceShippingRateSchema = z.object({
  zoneId: z.string(),
  name: z.string().min(1),
  type: z.enum(['FLAT', 'FREE', 'WEIGHT_BASED', 'PRICE_BASED']),
  baseRate: z.number(),
  perUnitRate: z.number().optional(),
  minWeight: z.number().optional(),
  maxWeight: z.number().optional(),
  minOrderAmount: z.number().optional(),
  maxOrderAmount: z.number().optional(),
  estimatedDaysMin: z.number().int().optional(),
  estimatedDaysMax: z.number().int().optional(),
  sortOrder: z.number().int().default(0),
});
export type CreateEcommerceShippingRateDto = z.infer<typeof CreateEcommerceShippingRateSchema>;

export const CreateEcommerceTaxClassSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});
export type CreateEcommerceTaxClassDto = z.infer<typeof CreateEcommerceTaxClassSchema>;

export const CreateEcommerceTaxRateSchema = z.object({
  classId: z.string(),
  name: z.string(),
  rate: z.number(),
  country: z.string().optional(),
  region: z.string().optional(),
  zipCode: z.string().optional(),
  priority: z.number().int().default(10),
  compound: z.boolean().default(false),
});
export type CreateEcommerceTaxRateDto = z.infer<typeof CreateEcommerceTaxRateSchema>;

export const CreateEcommerceStoreSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});
export type CreateEcommerceStoreSettingDto = z.infer<typeof CreateEcommerceStoreSettingSchema>;

export const CreateEcommerceStoreThemeSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().default(false),
  config: z.record(z.any()).default({}),
});
export type CreateEcommerceStoreThemeDto = z.infer<typeof CreateEcommerceStoreThemeSchema>;

export const CreateEcommerceReviewSchema = z.object({
  listingId: z.string(),
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  media: z.array(z.object({ url: z.string(), type: z.enum(['IMAGE', 'VIDEO']).default('IMAGE') })).optional(),
});
export type CreateEcommerceReviewDto = z.infer<typeof CreateEcommerceReviewSchema>;

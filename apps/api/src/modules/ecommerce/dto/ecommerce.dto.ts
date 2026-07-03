import { z } from 'zod';

/**
 * Zod schemas for the E-Commerce Storefront module (module #33).
 * See .ai/ECOMMERCE_MODULE_REQUIREMENTS.md and .ai/DATA_MODEL.md Section 3.4.
 * Follows this repo's canonical validation pattern (`@ZodBody` + `z.infer<>`),
 * same as `apps/api/src/modules/sales/dto/sales-extra.dto.ts`.
 */

// ─── Admin: StorefrontConfig ───────────────────────────

export const upsertStorefrontConfigSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(200),
  storeSlug: z
    .string()
    .min(1, 'Store slug is required')
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  isEnabled: z.boolean().default(false),
  currency: z.string().min(1).max(10).default('USD'),
  contactEmail: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().max(20).optional(),
});
export type UpsertStorefrontConfigDto = z.infer<typeof upsertStorefrontConfigSchema>;

// ─── Admin: StorefrontCategory ─────────────────────────

export const createStorefrontCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(150)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateStorefrontCategoryDto = z.infer<typeof createStorefrontCategorySchema>;

export const updateStorefrontCategorySchema = createStorefrontCategorySchema.partial();
export type UpdateStorefrontCategoryDto = z.infer<typeof updateStorefrontCategorySchema>;

// ─── Admin: ProductListing ─────────────────────────────

export const createProductListingSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  categoryId: z.string().optional(),
  isPublished: z.boolean().default(false),
  displayName: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  priceOverride: z.number().positive().optional(),
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateProductListingDto = z.infer<typeof createProductListingSchema>;

export const updateProductListingSchema = z.object({
  categoryId: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  displayName: z.string().max(200).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  priceOverride: z.number().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type UpdateProductListingDto = z.infer<typeof updateProductListingSchema>;

// ─── Public: Cart ───────────────────────────────────────

export const createCartSchema = z.object({
  currency: z.string().min(1).max(10).optional(),
});
export type CreateCartDto = z.infer<typeof createCartSchema>;

export const addCartItemSchema = z.object({
  productListingId: z.string().min(1, 'Product listing is required'),
  quantity: z.number().int().positive().default(1),
});
export type AddCartItemDto = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1 — use DELETE to remove the item'),
});
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;

// ─── Public: Checkout ───────────────────────────────────

// Field names intentionally match `addressSchema` in
// `packages/shared/src/validators/index.ts` (street/city/state/zip/country,
// ISO 3166-1 alpha-2 country) — the same shape `CreateSalesOrderInput.shippingAddress`
// expects, so no translation layer is needed when handing this straight to
// `SalesService.createConfirmedOnlineOrder`.
export const checkoutAddressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State/province is required').max(100),
  zip: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(2, 'Country must be an ISO 3166-1 alpha-2 code').max(2),
});

export const checkoutSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
  customerName: z.string().min(1, 'Name is required').max(200),
  customerEmail: z.string().email('A valid email is required'),
  customerPhone: z.string().max(40).optional(),
  shippingAddress: checkoutAddressSchema,
  notes: z.string().max(2000).optional(),
  // Test-only lever exercised by qa-tester / Flow C's decline path
  // (.ai/ECOMMERCE_MODULE_REQUIREMENTS.md Flow C) — never wired to any real
  // gateway, only ever consumed by MockPaymentGatewayService.
  simulateDecline: z.boolean().optional(),
});
export type CheckoutDto = z.infer<typeof checkoutSchema>;

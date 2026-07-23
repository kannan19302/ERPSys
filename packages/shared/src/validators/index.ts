import { z } from "zod";

// ─────────────────────────────────────────────────
// Shared Validators (Zod Schemas)
// Used by both frontend (forms) and backend (DTOs)
// ─────────────────────────────────────────────────

// ── Common Schemas ──

export const cuidSchema = z.string().min(1, "ID is required");

/**
 * @deprecated Track G.9 — use `listQuerySchema` from `@unerp/shared`
 * (contracts) for new endpoints: it is the frozen platform list contract
 * (`page`/`limit`/`sortBy`/`sortOrder`). This legacy shape (`sort`, `search`)
 * remains for existing consumers only.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  search: z.string().max(200).optional(),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

// Canonical response contract now lives in contracts/pagination (Track G.9);
// re-exported via the package barrel. The old local definition was removed to
// avoid two competing schemas for the same wire shape.

export const dateRangeSchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .refine(
    (data) =>
      !data.from || !data.to || new Date(data.from) <= new Date(data.to),
    {
      message: "'from' date must be before 'to' date",
    },
  );
export type DateRangeInput = z.infer<typeof dateRangeSchema>;

export const addressSchema = z.object({
  street: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip: z.string().min(1).max(20),
  country: z.string().min(2).max(2), // ISO 3166-1 alpha-2
});

// ── Bulk Operations Schema ──

export const bulkActionSchema = z.object({
  action: z.enum(["delete", "update-status", "send", "void", "archive"]),
  ids: z
    .array(z.string())
    .min(1, "At least one ID is required")
    .max(100, "Maximum 100 items per batch"),
  data: z.record(z.unknown()).optional(),
});
export type BulkActionInput = z.infer<typeof bulkActionSchema>;

export const bulkActionResultSchema = z.object({
  total: z.number(),
  succeeded: z.number(),
  failed: z.number(),
  results: z.array(
    z.object({
      id: z.string(),
      status: z.enum(["success", "error"]),
      error: z.string().optional(),
    }),
  ),
});
export type BulkActionResult = z.infer<typeof bulkActionResultSchema>;

// ── Export Schema ──

export const exportSchema = z.object({
  format: z.enum(["csv", "xlsx", "pdf"]).default("csv"),
  filters: z.record(z.unknown()).optional(),
  columns: z.array(z.string()).optional(),
});
export type ExportInput = z.infer<typeof exportSchema>;

// ── Auth Schemas ──

/**
 * Shared strong-password policy. Used by register and reset so the rules can
 * never drift apart, and re-exported for the client-side strength meter.
 */
export const strongPassword = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
  captchaToken: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const mfaLoginSchema = z.object({
  challengeToken: z.string().min(1, "Challenge token is required"),
  code: z
    .string()
    .min(6, "Enter your 6-digit code or a recovery code")
    .max(20, "Invalid code"),
});
export type MfaLoginInput = z.infer<typeof mfaLoginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(32, "Invalid verification token"),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: strongPassword,
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    organizationName: z
      .string()
      .min(1, "Organization name is required")
      .max(200),
    businessType: z.string().optional(),
    country: z.string().optional(),
    language: z.string().optional(),
    estimatedUsers: z.number().optional(),
    logoUrl: z.string().optional(),
    industry: z.string().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    tenantId: z.string().uuid().optional(),
    // Enforced server-side, not just a disabled submit button — a bare API
    // call must be rejected too, not only the UI form.
    termsAccepted: z.literal(true, {
      errorMap: () => ({
        message: "You must agree to the Terms of Service and Privacy Policy",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// ── Email OTP Schemas ──

export const sendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "OTP must be exactly 6 digits"),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// ── Onboarding Status Schema ──

export const onboardingChecklistResponseSchema = z.object({
  profile: z.boolean(),
  logo: z.boolean(),
  invite: z.boolean(),
  app: z.boolean(),
  plan: z.boolean(),
  dashboard: z.boolean(),
  checklistOrder: z.array(z.string()),
  priorityAppSlugs: z.array(z.string()),
});
export type OnboardingChecklistResponse = z.infer<typeof onboardingChecklistResponseSchema>;

// ── Organization Schemas ──

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  legalName: z.string().max(200).optional(),
  taxId: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  fiscalYearStart: z.number().int().min(1).max(12).default(1),
  address: z.any().optional(),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = createOrganizationSchema.partial();
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

// ── Customer Schemas ──

export const createCustomerSchema = z.object({
  type: z.enum(["COMPANY", "INDIVIDUAL"]).default("COMPANY"),
  name: z.string().min(1, "Customer name is required").max(200),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  creditLimit: z.number().positive().optional(),
  paymentTerms: z.number().int().min(0).max(365).default(30),
  notes: z.string().max(2000).optional(),
  customerType: z
    .enum(["ONE_TIME", "RECURRING", "GUEST", "PARTNER"])
    .default("RECURRING"),
  creditHold: z.boolean().default(false).optional(),
  creditHoldReason: z.string().max(500).optional(),
  riskRating: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW").optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// ── Product Schemas ──

export const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(2000).optional(),
  type: z
    .enum(["GOODS", "SERVICE", "DIGITAL", "SUBSCRIPTION"])
    .default("GOODS"),
  category: z.string().max(100).optional(),
  unit: z.string().max(20).default("EACH"),
  costPrice: z.number().nonnegative("Cost price must be non-negative"),
  sellPrice: z.number().nonnegative("Sell price must be non-negative"),
  taxCategory: z.string().max(50).optional(),
  requiresApproval: z.boolean().default(false),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema
  .partial()
  .omit({ sku: true });
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ── Warehouse Schemas ──

export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required").max(200),
  code: z.string().min(1, "Warehouse code is required").max(50),
  address: addressSchema.optional(),
  isActive: z.boolean().default(true),
});
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

export const updateWarehouseSchema = createWarehouseSchema.partial();
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

// ── User Schemas ──

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  roleIds: z.array(z.string()).min(1, "At least one role is required"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LOCKED"]).optional(),
  roleIds: z.array(z.string()).min(1).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  preferences: z.any().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ── People / directory profile schemas (Teams-style profile card) ──

export const updatePeopleProfileSchema = z.object({
  pronouns: z.string().max(40).optional(),
  jobTitle: z.string().max(120).optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  timezone: z.string().max(80).optional(),
  workingHoursStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)")
    .optional(),
  workingHoursEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)")
    .optional(),
  workingDays: z
    .array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]))
    .optional(),
  workingLocation: z.string().max(160).optional(),
  overview: z.string().max(2000).optional(),
});
export type UpdatePeopleProfileInput = z.infer<
  typeof updatePeopleProfileSchema
>;

export const uploadPronunciationSchema = z.object({
  audioDataUrl: z
    .string()
    .startsWith("data:audio/", "Expected an audio data URL"),
});
export type UploadPronunciationInput = z.infer<
  typeof uploadPronunciationSchema
>;

// ── Role Schemas ──

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = createRoleSchema.partial();
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// ── Vendor Schemas ──

export const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required").max(200),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  paymentTerms: z.number().int().min(0).max(365).default(30),
  notes: z.string().max(2000).optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  address: z.any().optional(),
  onboardingStatus: z
    .enum(["PENDING", "IN_PROGRESS", "QUALIFIED"])
    .default("PENDING")
    .optional(),
  checklistTaxVerified: z.boolean().default(false).optional(),
  checklistBankVerified: z.boolean().default(false).optional(),
  checklistNdaSigned: z.boolean().default(false).optional(),
  averageLeadTimeDays: z.number().nonnegative().default(0).optional(),
  qualityScore: z.number().min(0).max(100).default(100).optional(),
});
export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = createVendorSchema.partial();
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

// ── Finance Schemas ──

export const createInvoiceLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required").max(50),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(createInvoiceLineSchema)
    .min(1, "At least one line item is required"),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
  dueDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(createInvoiceLineSchema).optional(),
});
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().positive("Payment amount must be greater than zero"),
  method: z
    .enum(["CASH", "CARD", "BANK_TRANSFER", "CHEQUE"])
    .default("BANK_TRANSFER"),
  reference: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ── Procurement Schemas ──

export const createPurchaseOrderLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createPurchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  poNumber: z.string().min(1, "PO number is required").max(50),
  expectedDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  shippingAddress: addressSchema.optional(),
  lineItems: z
    .array(createPurchaseOrderLineSchema)
    .min(1, "At least one line item is required"),
});
export type CreatePurchaseOrderInput = z.infer<
  typeof createPurchaseOrderSchema
>;

export const updatePurchaseOrderSchema = z.object({
  expectedDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(createPurchaseOrderLineSchema).optional(),
});
export type UpdatePurchaseOrderInput = z.infer<
  typeof updatePurchaseOrderSchema
>;

export const createRFQSchema = z.object({
  rfqNumber: z.string().min(1, "RFQ number is required").max(50),
  expectedDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().positive("Quantity must be greater than zero"),
      }),
    )
    .min(1, "At least one line item is required"),
});
export type CreateRFQInput = z.infer<typeof createRFQSchema>;

export const createSupplierQuotationSchema = z.object({
  rfqId: z.string().optional(),
  vendorId: z.string().min(1, "Vendor is required"),
  quotationNumber: z.string().min(1, "Quotation number is required").max(50),
  validUntil: z.string().min(1, "Valid until date is required"),
  currency: z.string().length(3).default("USD"),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        taxRate: z.number().min(0).max(100).default(0),
      }),
    )
    .min(1),
});
export type CreateSupplierQuotationInput = z.infer<
  typeof createSupplierQuotationSchema
>;

export const createPurchaseReceiptSchema = z.object({
  purchaseOrderId: z.string().min(1, "Purchase order is required"),
  receiptNumber: z.string().min(1, "Receipt number is required").max(50),
  warehouseId: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        receivedQty: z.number().positive(),
        acceptedQty: z.number().positive(),
        rejectedQty: z.number().min(0).default(0),
      }),
    )
    .min(1),
});
export type CreatePurchaseReceiptInput = z.infer<
  typeof createPurchaseReceiptSchema
>;

export const createPurchaseReturnSchema = z.object({
  purchaseOrderId: z.string().min(1, "Purchase order is required"),
  returnNumber: z.string().min(1, "Return number is required").max(50),
  purchaseReceiptId: z.string().optional(),
  reason: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative().default(0),
        taxRate: z.number().min(0).max(100).default(0),
        reason: z.string().max(500).optional(),
      }),
    )
    .min(1),
});
export type CreatePurchaseReturnInput = z.infer<
  typeof createPurchaseReturnSchema
>;

export const updatePurchaseReturnSchema = createPurchaseReturnSchema
  .partial()
  .omit({ returnNumber: true });
export type UpdatePurchaseReturnInput = z.infer<
  typeof updatePurchaseReturnSchema
>;

export const createPurchaseRequisitionSchema = z.object({
  requisitionNumber: z
    .string()
    .min(1, "Requisition number is required")
    .max(50),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  departmentId: z.string().optional(),
  requiredDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().positive(),
        estimatedPrice: z.number().nonnegative(),
      }),
    )
    .min(1, "At least one line item is required"),
});
export type CreatePurchaseRequisitionInput = z.infer<
  typeof createPurchaseRequisitionSchema
>;

export const createBlanketPurchaseAgreementSchema = z.object({
  agreementNumber: z.string().min(1, "Agreement number is required").max(50),
  vendorId: z.string().min(1, "Vendor is required"),
  title: z.string().min(1, "Title is required").max(200),
  startDate: z.string(),
  endDate: z.string(),
  agreementLimit: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .min(1, "At least one line item is required"),
});
export type CreateBlanketPurchaseAgreementInput = z.infer<
  typeof createBlanketPurchaseAgreementSchema
>;

export const submitPublicBidSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  quotationNumber: z.string().min(1, "Quotation number is required").max(50),
  validUntil: z.string().min(1, "Valid until date is required"),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        taxRate: z.number().min(0).max(100).default(0),
      }),
    )
    .min(1),
});
export type SubmitPublicBidInput = z.infer<typeof submitPublicBidSchema>;

// ── Sales Schemas ──

export const createQuotationLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createQuotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  quotationNumber: z.string().min(1, "Quotation number is required").max(50),
  validUntil: z.string().min(1, "Valid until date is required"),
  notes: z.string().max(2000).optional(),
  termsConditions: z.string().max(5000).optional(),
  lineItems: z
    .array(createQuotationLineSchema)
    .min(1, "At least one line item is required"),
});
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export const createSalesOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderNumber: z.string().min(1, "Order number is required").max(50),
  quotationId: z.string().optional(),
  deliveryDate: z.string().optional(),
  salesChannel: z.enum(["B2B", "B2C", "D2C"]).default("B2B"),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CARD", "CHEQUE"]).optional(),
  paymentStatus: z.string().optional(),
  notes: z.string().max(2000).optional(),
  shippingAddress: addressSchema.optional(),
  lineItems: z
    .array(createQuotationLineSchema)
    .min(1, "At least one line item is required"),
});
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;

export const updateSalesOrderStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "CONFIRMED",
    "PROCESSING",
    "PARTIALLY_DELIVERED",
    "DELIVERED",
    "CANCELLED",
  ]),
});
export type UpdateSalesOrderStatusInput = z.infer<
  typeof updateSalesOrderStatusSchema
>;

export const createDeliveryNoteSchema = z.object({
  salesOrderId: z.string().min(1, "Sales order is required"),
  deliveryNumber: z.string().min(1, "Delivery number is required").max(50),
  warehouseId: z.string().optional(),
  carrierName: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        deliveredQty: z.number().positive(),
      }),
    )
    .min(1),
});
export type CreateDeliveryNoteInput = z.infer<typeof createDeliveryNoteSchema>;

export const createSalesReturnSchema = z.object({
  salesOrderId: z.string().min(1, "Sales order is required"),
  returnNumber: z.string().min(1, "Return number is required").max(50),
  deliveryNoteId: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative().optional().default(0),
        taxRate: z.number().min(0).max(100).optional().default(0),
        reason: z.string().max(500).optional(),
      }),
    )
    .min(1),
});
export type CreateSalesReturnInput = z.infer<typeof createSalesReturnSchema>;

// ── CRM Schemas ──

export const createLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  salutation: z.string().max(10).optional(),
  company: z.string().max(200).optional(),
  title: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  mobile: z.string().max(20).optional(),
  website: z.string().url().optional(),
  sourceId: z.string().optional(),
  campaignId: z.string().optional(),
  industry: z.string().max(100).optional(),
  employeeCount: z.number().int().positive().optional(),
  annualRevenue: z.number().positive().optional(),
  country: z.string().max(2).optional(),
  region: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  assignedToId: z.string().optional(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial();
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const updateLeadStatusSchema = z.object({
  status: z.enum([
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "DISQUALIFIED",
    "CONVERTED",
  ]),
});
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

export const convertLeadSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(200),
  opportunityName: z.string().min(1, "Opportunity name is required").max(200),
  opportunityAmount: z.number().positive().optional(),
});
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;

export const createOpportunitySchema = z.object({
  name: z.string().min(1, "Opportunity name is required").max(200),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  pipelineId: z.string().optional(),
  stage: z.string().default("PROSPECTING"),
  amount: z.number().positive().optional(),
  probability: z.number().int().min(0).max(100).default(0),
  expectedCloseDate: z.string().optional(),
  competitor: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  assignedToId: z.string().optional(),
});
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

export const updateOpportunitySchema = createOpportunitySchema.partial();
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;

export const updateOpportunityStageSchema = z.object({
  stage: z.string().min(1, "Stage is required"),
});
export type UpdateOpportunityStageInput = z.infer<
  typeof updateOpportunityStageSchema
>;

export const createActivitySchema = z.object({
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "TASK"]),
  subject: z.string().min(1, "Subject is required").max(200),
  description: z.string().max(2000).optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
  customerId: z.string().optional(),
  contactId: z.string().optional(),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});
export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  category: z
    .enum(["GENERAL", "QUOTATION", "INVOICE", "FOLLOWUP"])
    .default("GENERAL"),
  subject: z.string().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Body is required"),
  variables: z.array(z.string()).default([]),
});
export type CreateEmailTemplateInput = z.infer<
  typeof createEmailTemplateSchema
>;

export const updateEmailTemplateSchema = createEmailTemplateSchema.partial();
export type UpdateEmailTemplateInput = z.infer<
  typeof updateEmailTemplateSchema
>;

export const createSalesPipelineSchema = z.object({
  name: z.string().min(1).max(100),
  stages: z
    .array(z.string())
    .default([
      "PROSPECTING",
      "QUALIFICATION",
      "PROPOSAL",
      "NEGOTIATION",
      "CLOSED_WON",
      "CLOSED_LOST",
    ]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().optional(),
});
export type CreateSalesPipelineInput = z.infer<
  typeof createSalesPipelineSchema
>;

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  type: z
    .enum(["EMAIL", "SOCIAL", "EVENT", "WEBINAR", "OTHER"])
    .default("EMAIL"),
  status: z
    .enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"])
    .default("PLANNED"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  actualCost: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateAdminSettingsSchema = z.object({
  theme: z.string().optional(),
  companyName: z.string().optional(),
  language: z.string().optional(),
  primaryColor: z.string().optional(),
  modules: z.any().optional(),
  taxId: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  address: z.any().optional(),
  logoUrl: z.string().optional(),
});
export type UpdateAdminSettingsInput = z.infer<
  typeof updateAdminSettingsSchema
>;

// ── Contact Schema ──

export const createContactSchema = z.object({
  customerId: z.string().optional(),
  salutation: z.string().max(10).optional(),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  mobile: z.string().max(20).optional(),
  title: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  secondaryEmail: z.string().email().optional(),
  preferredContactMethod: z.string().optional(),
  engagementScore: z.number().int().optional(),
  socialProfiles: z.any().optional(),
  lifecycleStatus: z.string().optional(),
  buyingRole: z
    .enum([
      "BUYER",
      "DECISION_MAKER",
      "INFLUENCER",
      "GATEKEEPER",
      "TECHNICAL",
      "BILLING",
    ])
    .default("INFLUENCER")
    .optional(),
  lastContactedAt: z.string().datetime().optional().nullable(),
  interactionVelocity: z.number().int().default(0).optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial();
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

// ── Project Schemas ──

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  code: z.string().min(1, "Project code is required").max(50),
  description: z.string().max(2000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().positive().optional(),
  portfolioId: z.string().optional(),
  customerId: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema
  .partial()
  .omit({ code: true });
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createTaskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  name: z.string().min(1, "Task name is required").max(200),
  description: z.string().max(2000).optional(),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    .default("BACKLOG"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema
  .partial()
  .omit({ projectId: true });
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ── Manufacturing Schemas ──

export const createBOMSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "BOM name is required").max(200),
  code: z.string().min(1, "BOM code is required").max(50),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Component product is required"),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
});
export type CreateBOMInput = z.infer<typeof createBOMSchema>;

export const createWorkOrderSchema = z.object({
  bomId: z.string().min(1, "BOM is required"),
  workOrderNumber: z.string().min(1, "Work order number is required").max(50),
  quantity: z.number().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

// ── Supply Chain Schemas ──

export const updateShipmentStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "RETURNED",
    "CANCELLED",
  ]),
});
export type UpdateShipmentStatusInput = z.infer<
  typeof updateShipmentStatusSchema
>;

export const createShipmentSchema = z.object({
  shipmentNumber: z.string().min(1, "Shipment number is required").max(50),
  type: z.enum(["INBOUND", "OUTBOUND", "TRANSFER"]).default("OUTBOUND"),
  carrierName: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  originAddress: addressSchema.optional(),
  destAddress: addressSchema.optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.string().default("KG"),
  shippingCost: z.number().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
  estimatedDelivery: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

// ── Status Update Schemas (generic) ──

export const statusUpdateSchema = <T extends [string, ...string[]]>(
  statuses: T,
) =>
  z.object({
    status: z.enum(statuses),
  });

// Note: InvoiceStatus, PurchaseOrderStatus, SalesOrderStatus,
// EmployeeStatus, and ProjectStatus are defined in constants/index.ts
// as const arrays for broader usage. The Zod enum schemas are
// available here as helpers when Zod inference is needed.

export const invoiceStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "PAID",
  "PARTIALLY_PAID",
  "OVERDUE",
  "CANCELLED",
  "VOID",
]);
export type InvoiceStatusZod = z.infer<typeof invoiceStatusSchema>;

export const purchaseOrderStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);
export type PurchaseOrderStatusZod = z.infer<typeof purchaseOrderStatusSchema>;

export const salesOrderStatusSchema = z.enum([
  "DRAFT",
  "CONFIRMED",
  "PROCESSING",
  "PARTIALLY_DELIVERED",
  "DELIVERED",
  "CANCELLED",
]);
export type SalesOrderStatusZod = z.infer<typeof salesOrderStatusSchema>;

export const projectStatusSchema = z.enum([
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);
export type ProjectStatusZod = z.infer<typeof projectStatusSchema>;

export const employeeStatusSchema = z.enum([
  "ACTIVE",
  "INVITED",
  "TERMINATED",
  "LEAVE",
]);
export type EmployeeStatusZod = z.infer<typeof employeeStatusSchema>;

// ── CRM Note / Note Schemas ──

export const vendorNoteSchema = z.object({
  type: z.string().optional(),
  content: z.string().min(1, "Content is required"),
});
export type VendorNoteInput = z.infer<typeof vendorNoteSchema>;

export const customerNoteSchema = z.object({
  type: z.string().optional(),
  content: z.string().min(1, "Content is required"),
});
export type CustomerNoteInput = z.infer<typeof customerNoteSchema>;

export const vendorBulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  status: z.string().min(1, "Status is required"),
});

export const customerBulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  status: z.string().min(1, "Status is required"),
});

// ── CRM Tags ──

export const createCustomerTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(100),
  color: z.string().max(20).optional(),
});
export type CreateCustomerTagInput = z.infer<typeof createCustomerTagSchema>;

// ── Builder Module Schemas ──
export * from './builder.js';
export * from './builder-expansion.js';
export * from './ai.js';
export * from './communication-expansion.js';
export * from './drive.js';

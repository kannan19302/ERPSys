import { z } from 'zod';

// ─────────────────────────────────────────────────
// Shared Validators (Zod Schemas)
// Used by both frontend (forms) and backend (DTOs)
// ─────────────────────────────────────────────────

// ── Common Schemas ──

export const cuidSchema = z.string().min(1, 'ID is required');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  search: z.string().max(200).optional(),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

export const dateRangeSchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .refine((data) => !data.from || !data.to || new Date(data.from) <= new Date(data.to), {
    message: "'from' date must be before 'to' date",
  });
export type DateRangeInput = z.infer<typeof dateRangeSchema>;

export const addressSchema = z.object({
  street: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip: z.string().min(1).max(20),
  country: z.string().min(2).max(2), // ISO 3166-1 alpha-2
});

// ── Auth Schemas ──

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    organizationName: z.string().min(1, 'Organization name is required').max(200),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// ── Organization Schemas ──

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  legalName: z.string().max(200).optional(),
  taxId: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  address: addressSchema.optional(),
  currency: z.string().length(3).default('USD'),
  timezone: z.string().default('UTC'),
  fiscalYearStart: z.number().int().min(1).max(12).default(1),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

// ── Customer Schemas ──

export const createCustomerSchema = z.object({
  type: z.enum(['COMPANY', 'INDIVIDUAL']).default('COMPANY'),
  name: z.string().min(1, 'Customer name is required').max(200),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  creditLimit: z.number().positive().optional(),
  paymentTerms: z.number().int().min(0).max(365).default(30),
  notes: z.string().max(2000).optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// ── Product Schemas ──

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['GOODS', 'SERVICE', 'DIGITAL', 'SUBSCRIPTION']).default('GOODS'),
  category: z.string().max(100).optional(),
  unit: z.string().max(20).default('EACH'),
  costPrice: z.number().nonnegative('Cost price must be non-negative'),
  sellPrice: z.number().nonnegative('Sell price must be non-negative'),
  taxCategory: z.string().max(50).optional(),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().omit({ sku: true });
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ── User Schemas ──

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
  roleIds: z.array(z.string()).min(1).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ── HR Schemas ──

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  designation: z.string().max(100).optional(),
  departmentId: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).default('FULL_TIME'),
  status: z.enum(['ACTIVE', 'TERMINATED', 'LEAVE']).default('ACTIVE'),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// ── Vendor Schemas ──

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(200),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  paymentTerms: z.number().int().min(0).max(365).default(30),
  notes: z.string().max(2000).optional(),
});
export type CreateVendorInput = z.infer<typeof createVendorSchema>;

// ── Finance Schemas ──

export const createInvoiceLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(50),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(createInvoiceLineSchema).min(1, 'At least one line item is required'),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE']).default('BANK_TRANSFER'),
  reference: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

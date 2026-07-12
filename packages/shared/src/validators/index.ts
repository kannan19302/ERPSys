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

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

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

// ── Bulk Operations Schema ──

export const bulkActionSchema = z.object({
  action: z.enum(['delete', 'update-status', 'send', 'void', 'archive']),
  ids: z.array(z.string()).min(1, 'At least one ID is required').max(100, 'Maximum 100 items per batch'),
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
      status: z.enum(['success', 'error']),
      error: z.string().optional(),
    })
  ),
});
export type BulkActionResult = z.infer<typeof bulkActionResultSchema>;

// ── Export Schema ──

export const exportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
  filters: z.record(z.unknown()).optional(),
  columns: z.array(z.string()).optional(),
});
export type ExportInput = z.infer<typeof exportSchema>;

// ── Auth Schemas ──

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

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
  fiscalYearStart: z.number().int().min(1).max(12).default(1),
  address: z.any().optional(),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = createOrganizationSchema.partial();
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

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
  customerType: z.enum(['ONE_TIME', 'RECURRING', 'GUEST', 'PARTNER']).default('RECURRING'),
  creditHold: z.boolean().default(false).optional(),
  creditHoldReason: z.string().max(500).optional(),
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW').optional(),
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
  requiresApproval: z.boolean().default(false),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().omit({ sku: true });
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ── Warehouse Schemas ──

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(200),
  code: z.string().min(1, 'Warehouse code is required').max(50),
  address: addressSchema.optional(),
  isActive: z.boolean().default(true),
});
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

export const updateWarehouseSchema = createWarehouseSchema.partial();
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

// ── Department Schemas ──

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(200),
  code: z.string().min(1, 'Department code is required').max(20),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = createDepartmentSchema.partial();
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

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

// ── Role Schemas ──

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = createRoleSchema.partial();
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// ── HR Schemas ──

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  designation: z.string().max(100).optional(),
  departmentId: z.string().optional(),
  dateOfJoining: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).default('FULL_TIME'),
  status: z.enum(['ACTIVE', 'INVITED', 'TERMINATED', 'LEAVE']).default('ACTIVE'),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ employeeCode: true });
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

// ── Vendor Schemas ──

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(200),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  paymentTerms: z.number().int().min(0).max(365).default(30),
  notes: z.string().max(2000).optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  address: z.any().optional(),
  onboardingStatus: z.enum(['PENDING', 'IN_PROGRESS', 'QUALIFIED']).default('PENDING').optional(),
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

export const updateInvoiceSchema = z.object({
  dueDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(createInvoiceLineSchema).optional(),
});
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE']).default('BANK_TRANSFER'),
  reference: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ── Procurement Schemas ──

export const createPurchaseOrderLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createPurchaseOrderSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  poNumber: z.string().min(1, 'PO number is required').max(50),
  expectedDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  shippingAddress: addressSchema.optional(),
  lineItems: z.array(createPurchaseOrderLineSchema).min(1, 'At least one line item is required'),
});
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const updatePurchaseOrderSchema = z.object({
  expectedDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(createPurchaseOrderLineSchema).optional(),
});
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;

export const createRFQSchema = z.object({
  rfqNumber: z.string().min(1, 'RFQ number is required').max(50),
  expectedDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().positive('Quantity must be greater than zero'),
    })
  ).min(1, 'At least one line item is required'),
});
export type CreateRFQInput = z.infer<typeof createRFQSchema>;

export const createSupplierQuotationSchema = z.object({
  rfqId: z.string().optional(),
  vendorId: z.string().min(1, 'Vendor is required'),
  quotationNumber: z.string().min(1, 'Quotation number is required').max(50),
  validUntil: z.string().min(1, 'Valid until date is required'),
  currency: z.string().length(3).default('USD'),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().min(0).max(100).default(0),
    })
  ).min(1),
});
export type CreateSupplierQuotationInput = z.infer<typeof createSupplierQuotationSchema>;

export const createPurchaseReceiptSchema = z.object({
  purchaseOrderId: z.string().min(1, 'Purchase order is required'),
  receiptNumber: z.string().min(1, 'Receipt number is required').max(50),
  warehouseId: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      receivedQty: z.number().positive(),
      acceptedQty: z.number().positive(),
      rejectedQty: z.number().min(0).default(0),
    })
  ).min(1),
});
export type CreatePurchaseReceiptInput = z.infer<typeof createPurchaseReceiptSchema>;

export const createPurchaseReturnSchema = z.object({
  purchaseOrderId: z.string().min(1, 'Purchase order is required'),
  returnNumber: z.string().min(1, 'Return number is required').max(50),
  purchaseReceiptId: z.string().optional(),
  reason: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative().default(0),
      taxRate: z.number().min(0).max(100).default(0),
      reason: z.string().max(500).optional(),
    })
  ).min(1),
});
export type CreatePurchaseReturnInput = z.infer<typeof createPurchaseReturnSchema>;

export const updatePurchaseReturnSchema = createPurchaseReturnSchema.partial().omit({ returnNumber: true });
export type UpdatePurchaseReturnInput = z.infer<typeof updatePurchaseReturnSchema>;

export const createPurchaseRequisitionSchema = z.object({
  requisitionNumber: z.string().min(1, 'Requisition number is required').max(50),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  departmentId: z.string().optional(),
  requiredDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().positive(),
      estimatedPrice: z.number().nonnegative(),
    })
  ).min(1, 'At least one line item is required'),
});
export type CreatePurchaseRequisitionInput = z.infer<typeof createPurchaseRequisitionSchema>;

export const createBlanketPurchaseAgreementSchema = z.object({
  agreementNumber: z.string().min(1, 'Agreement number is required').max(50),
  vendorId: z.string().min(1, 'Vendor is required'),
  title: z.string().min(1, 'Title is required').max(200),
  startDate: z.string(),
  endDate: z.string(),
  agreementLimit: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
    })
  ).min(1, 'At least one line item is required'),
});
export type CreateBlanketPurchaseAgreementInput = z.infer<typeof createBlanketPurchaseAgreementSchema>;

export const submitPublicBidSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  quotationNumber: z.string().min(1, 'Quotation number is required').max(50),
  validUntil: z.string().min(1, 'Valid until date is required'),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().min(0).max(100).default(0),
    })
  ).min(1),
});
export type SubmitPublicBidInput = z.infer<typeof submitPublicBidSchema>;

// ── Sales Schemas ──

export const createQuotationLineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createQuotationSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  quotationNumber: z.string().min(1, 'Quotation number is required').max(50),
  validUntil: z.string().min(1, 'Valid until date is required'),
  notes: z.string().max(2000).optional(),
  termsConditions: z.string().max(5000).optional(),
  lineItems: z.array(createQuotationLineSchema).min(1, 'At least one line item is required'),
});
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export const createSalesOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  orderNumber: z.string().min(1, 'Order number is required').max(50),
  quotationId: z.string().optional(),
  deliveryDate: z.string().optional(),
  salesChannel: z.enum(['B2B', 'B2C', 'D2C']).default('B2B'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CARD', 'CHEQUE']).optional(),
  paymentStatus: z.string().optional(),
  notes: z.string().max(2000).optional(),
  shippingAddress: addressSchema.optional(),
  lineItems: z.array(createQuotationLineSchema).min(1, 'At least one line item is required'),
});
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;

export const updateSalesOrderStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'PROCESSING', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED']),
});
export type UpdateSalesOrderStatusInput = z.infer<typeof updateSalesOrderStatusSchema>;

export const createDeliveryNoteSchema = z.object({
  salesOrderId: z.string().min(1, 'Sales order is required'),
  deliveryNumber: z.string().min(1, 'Delivery number is required').max(50),
  warehouseId: z.string().optional(),
  carrierName: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      deliveredQty: z.number().positive(),
    })
  ).min(1),
});
export type CreateDeliveryNoteInput = z.infer<typeof createDeliveryNoteSchema>;

export const createSalesReturnSchema = z.object({
  salesOrderId: z.string().min(1, 'Sales order is required'),
  returnNumber: z.string().min(1, 'Return number is required').max(50),
  deliveryNoteId: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative().optional().default(0),
      taxRate: z.number().min(0).max(100).optional().default(0),
      reason: z.string().max(500).optional(),
    })
  ).min(1),
});
export type CreateSalesReturnInput = z.infer<typeof createSalesReturnSchema>;

// ── CRM Schemas ──

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
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
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED']),
});
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

export const convertLeadSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200),
  opportunityName: z.string().min(1, 'Opportunity name is required').max(200),
  opportunityAmount: z.number().positive().optional(),
});
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;

export const createOpportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required').max(200),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  pipelineId: z.string().optional(),
  stage: z.string().default('PROSPECTING'),
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
  stage: z.string().min(1, 'Stage is required'),
});
export type UpdateOpportunityStageInput = z.infer<typeof updateOpportunityStageSchema>;

export const createActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK']),
  subject: z.string().min(1, 'Subject is required').max(200),
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
  name: z.string().min(1, 'Template name is required').max(100),
  category: z.enum(['GENERAL', 'QUOTATION', 'INVOICE', 'FOLLOWUP']).default('GENERAL'),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required'),
  variables: z.array(z.string()).default([]),
});
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;

export const updateEmailTemplateSchema = createEmailTemplateSchema.partial();
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;

export const createSalesPipelineSchema = z.object({
  name: z.string().min(1).max(100),
  stages: z.array(z.string()).default(['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().optional(),
});
export type CreateSalesPipelineInput = z.infer<typeof createSalesPipelineSchema>;

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['EMAIL', 'SOCIAL', 'EVENT', 'WEBINAR', 'OTHER']).default('EMAIL'),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
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
});
export type UpdateAdminSettingsInput = z.infer<typeof updateAdminSettingsSchema>;

// ── Contact Schema ──

export const createContactSchema = z.object({
  customerId: z.string().optional(),
  salutation: z.string().max(10).optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
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
  buyingRole: z.enum(['BUYER', 'DECISION_MAKER', 'INFLUENCER', 'GATEKEEPER', 'TECHNICAL', 'BILLING']).default('INFLUENCER').optional(),
  lastContactedAt: z.string().datetime().optional().nullable(),
  interactionVelocity: z.number().int().default(0).optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial();
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

// ── Project Schemas ──

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  code: z.string().min(1, 'Project code is required').max(50),
  description: z.string().max(2000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().positive().optional(),
  portfolioId: z.string().optional(),
  customerId: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial().omit({ code: true });
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  name: z.string().min(1, 'Task name is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('BACKLOG'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ── Manufacturing Schemas ──

export const createBOMSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'BOM name is required').max(200),
  code: z.string().min(1, 'BOM code is required').max(50),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Component product is required'),
      quantity: z.number().positive(),
    })
  ).min(1),
});
export type CreateBOMInput = z.infer<typeof createBOMSchema>;

export const createWorkOrderSchema = z.object({
  bomId: z.string().min(1, 'BOM is required'),
  workOrderNumber: z.string().min(1, 'Work order number is required').max(50),
  quantity: z.number().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

// ── Supply Chain Schemas ──

export const updateShipmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED']),
});
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;

export const createShipmentSchema = z.object({
  shipmentNumber: z.string().min(1, 'Shipment number is required').max(50),
  type: z.enum(['INBOUND', 'OUTBOUND', 'TRANSFER']).default('OUTBOUND'),
  carrierName: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  originAddress: addressSchema.optional(),
  destAddress: addressSchema.optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.string().default('KG'),
  shippingCost: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('USD'),
  estimatedDelivery: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

// ── Status Update Schemas (generic) ──

export const statusUpdateSchema = <T extends [string, ...string[]]>(statuses: T) =>
  z.object({
    status: z.enum(statuses),
  });

// Note: InvoiceStatus, PurchaseOrderStatus, SalesOrderStatus, 
// EmployeeStatus, and ProjectStatus are defined in constants/index.ts
// as const arrays for broader usage. The Zod enum schemas are 
// available here as helpers when Zod inference is needed.

export const invoiceStatusSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED', 'VOID']);
export type InvoiceStatusZod = z.infer<typeof invoiceStatusSchema>;

export const purchaseOrderStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']);
export type PurchaseOrderStatusZod = z.infer<typeof purchaseOrderStatusSchema>;

export const salesOrderStatusSchema = z.enum(['DRAFT', 'CONFIRMED', 'PROCESSING', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED']);
export type SalesOrderStatusZod = z.infer<typeof salesOrderStatusSchema>;

export const projectStatusSchema = z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']);
export type ProjectStatusZod = z.infer<typeof projectStatusSchema>;

export const employeeStatusSchema = z.enum(['ACTIVE', 'INVITED', 'TERMINATED', 'LEAVE']);
export type EmployeeStatusZod = z.infer<typeof employeeStatusSchema>;

// Builder Studio Schemas

const builderSlugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'Use lowercase letters, numbers, and hyphens');

const builderModuleSlugSchema = z
  .string()
  .min(1, 'Module is required')
  .max(80)
  .regex(/^[a-z0-9][a-z0-9_-]*$/, 'Use lowercase letters, numbers, underscores, and hyphens');

const builderJsonObjectSchema = z.record(z.unknown());

export const builderFieldSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(80),
  label: z.string().min(1).max(120).optional(),
  type: z.string().min(1).max(40),
  options: z.union([z.string(), z.array(z.unknown()), z.null()]).optional(),
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  inListView: z.boolean().optional(),
  readRoles: z.string().max(500).optional().nullable(),
  writeRoles: z.string().max(500).optional().nullable(),
  formula: z.string().max(1000).optional().nullable(),
  placeholder: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  columnSpan: z.number().int().min(1).max(12).optional(),
  height: z.number().int().min(1).max(1200).optional(),
  weight: z.number().positive().max(12).optional(),
  dataSource: z.string().max(300).optional(),
  dataFilter: z.string().max(1000).optional(),
  visibilityRule: z.string().max(1000).optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  regexPattern: z.string().max(500).optional(),
  cssClass: z.string().max(120).optional(),
});
export type BuilderFieldInput = z.infer<typeof builderFieldSchema>;

export const createBuilderFormSchema = z.object({
  name: z.string().min(1).max(160),
  slug: builderSlugSchema,
  description: z.string().max(1000).optional(),
  icon: z.string().max(80).optional(),
  module: z.string().max(80).optional(),
  fields: z.array(builderFieldSchema).optional(),
  settings: builderJsonObjectSchema.optional(),
});
export type CreateBuilderFormInput = z.infer<typeof createBuilderFormSchema>;

export const updateBuilderFormSchema = createBuilderFormSchema
  .omit({ slug: true })
  .partial()
  .extend({ status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional() });
export type UpdateBuilderFormInput = z.infer<typeof updateBuilderFormSchema>;

export const createSchemaRegistrySchema = z.object({
  module: builderModuleSlugSchema,
  name: z.string().min(1).max(160),
  slug: builderSlugSchema,
  description: z.string().max(1000).optional(),
  fields: z.array(builderFieldSchema).optional(),
  settings: builderJsonObjectSchema.optional(),
});
export type CreateSchemaRegistryInput = z.infer<typeof createSchemaRegistrySchema>;

export const updateSchemaRegistrySchema = createSchemaRegistrySchema
  .omit({ module: true, slug: true })
  .partial()
  .extend({ status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional() });
export type UpdateSchemaRegistryInput = z.infer<typeof updateSchemaRegistrySchema>;

export const createPageRegistrySchema = z.object({
  schemaId: z.string().min(1).optional(),
  module: builderModuleSlugSchema,
  slug: builderSlugSchema,
  title: z.string().min(1).max(160),
  type: z.enum(['FORM', 'LIST', 'DASHBOARD', 'REPORT']).default('FORM').optional(),
  layout: z.union([z.array(builderFieldSchema), z.object({ fields: z.array(builderFieldSchema), settings: builderJsonObjectSchema.optional() })]).optional(),
});
export type CreatePageRegistryInput = z.infer<typeof createPageRegistrySchema>;

export const updatePageRegistrySchema = createPageRegistrySchema
  .partial()
  .extend({ status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional() });
export type UpdatePageRegistryInput = z.infer<typeof updatePageRegistrySchema>;

export const restorePageRegistryHistorySchema = z.object({
  historyIndex: z.number().int().min(0),
});
export type RestorePageRegistryHistoryInput = z.infer<typeof restorePageRegistryHistorySchema>;

export const customRecordDataSchema = z.record(z.unknown());
export type CustomRecordDataInput = z.infer<typeof customRecordDataSchema>;

export const createDataImportSchema = z.object({
  name: z.string().min(1).max(160),
  targetModel: z.enum(['customer', 'vendor', 'product', 'employee', 'warehouse']),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  totalRows: z.number().int().min(0),
  columnMapping: z.record(z.string().max(80)).optional(),
});
export type CreateDataImportInput = z.infer<typeof createDataImportSchema>;

export const executeDataImportSchema = z.object({
  rows: z.array(z.record(z.unknown())).max(1000),
});
export type ExecuteDataImportInput = z.infer<typeof executeDataImportSchema>;

export const builderAnalyticsEventSchema = z.object({
  event: z.string().min(1).max(120),
  entityType: z.string().max(80).optional(),
  entityId: z.string().max(120).optional(),
  metadata: builderJsonObjectSchema.optional(),
});
export type BuilderAnalyticsEventInput = z.infer<typeof builderAnalyticsEventSchema>;

export const builderAiGenerateSchema = z.object({
  prompt: z.string().min(3).max(2000),
});
export type BuilderAiGenerateInput = z.infer<typeof builderAiGenerateSchema>;

// Additional Builder DTOs
export const createBuilderWorkflowSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().optional(),
  docType: z.string().optional(),
  trigger: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  settings: z.record(z.unknown()).optional(),
});
export const updateBuilderWorkflowSchema = createBuilderWorkflowSchema.partial().extend({ status: z.string().optional() });

export const createBuilderDashboardSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().optional(),
  icon: z.string().optional(),
  widgets: z.array(z.any()).optional(),
  layout: z.record(z.unknown()).optional(),
  refreshRate: z.number().int().min(0).optional(),
});
export const updateBuilderDashboardSchema = createBuilderDashboardSchema.partial().extend({ status: z.string().optional() });

export const createBuilderModuleSchema = z.object({
  name: z.string().min(1).max(160),
  slug: builderSlugSchema,
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  scope: z.string().optional(),
  version: z.string().optional(),
  entities: z.array(z.any()).optional(),
  relationships: z.array(z.any()).optional(),
  permissions: z.record(z.unknown()).optional(),
  pages: z.array(z.any()).optional(),
  components: z.array(z.any()).optional(),
  dataModels: z.array(z.any()).optional(),
  testResults: z.record(z.unknown()).optional(),
});
export const updateBuilderModuleSchema = createBuilderModuleSchema.omit({ slug: true }).partial().extend({ status: z.string().optional(), scope: z.string().optional() });

export const addAppComponentSchema = z.object({
  type: z.enum(['form', 'workflow', 'dashboard', 'automation']),
  refId: z.string().min(1),
  name: z.string().min(1).max(160),
});
export type AddAppComponentInput = z.infer<typeof addAppComponentSchema>;

export const addAppPageSchema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(160),
  type: z.enum(['form', 'list', 'dashboard', 'custom']),
  formId: z.string().nullable().optional(),
  dashboardId: z.string().nullable().optional(),
  layout: z.array(z.any()).optional(),
});
export type AddAppPageInput = z.infer<typeof addAppPageSchema>;

export const updateAppPageSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  slug: z.string().min(1).max(160).optional(),
  type: z.enum(['form', 'list', 'dashboard', 'custom']).optional(),
  formId: z.string().nullable().optional(),
  dashboardId: z.string().nullable().optional(),
  layout: z.array(z.any()).optional(),
});
export type UpdateAppPageInput = z.infer<typeof updateAppPageSchema>;

export const addAppDataModelSchema = z.object({
  name: z.string().min(1).max(160),
  fields: z.array(z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    required: z.boolean().optional(),
    label: z.string().optional(),
  })),
  relationships: z.array(z.any()).optional(),
});
export type AddAppDataModelInput = z.infer<typeof addAppDataModelSchema>;

export const publishModuleSchema = z.object({
  scope: z.enum(['ORGANIZATION', 'GLOBAL']),
  // Optional release metadata. When omitted, the patch version is auto-bumped.
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  bump: z.enum(['major', 'minor', 'patch']).optional(),
  changelog: z.string().max(5000).optional(),
  // Store-listing metadata (persisted on the module).
  category: z.string().max(80).optional(),
  longDescription: z.string().max(5000).optional(),
  publisher: z.string().max(120).optional(),
  screenshots: z.array(z.string()).optional(),
});
export type PublishModuleInput = z.infer<typeof publishModuleSchema>;

export const rollbackModuleSchema = z.object({
  releaseId: z.string().min(1),
});
export type RollbackModuleInput = z.infer<typeof rollbackModuleSchema>;

// Install a builder-published app from the marketplace into the current tenant.
export const installBuilderAppSchema = z.object({
  moduleId: z.string().min(1),
  releaseId: z.string().optional(), // defaults to the module's current release
});
export type InstallBuilderAppInput = z.infer<typeof installBuilderAppSchema>;

export const createAutomationRuleSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().optional(),
  trigger: z.string(),
  triggerConfig: z.record(z.unknown()).optional(),
  conditions: z.array(z.any()).optional(),
  actions: z.array(z.any()).optional(),
  settings: z.record(z.unknown()).optional(),
});
export const updateAutomationRuleSchema = createAutomationRuleSchema.partial().extend({ status: z.string().optional() });

export const createWebPageSchema = z.object({
  name: z.string().min(1).max(160),
  slug: builderSlugSchema,
  sections: z.array(z.any()).optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
  visibility: z.string().optional(),
});
export const updateWebPageSchema = createWebPageSchema.omit({ slug: true }).partial().extend({ status: z.string().optional(), sortOrder: z.number().int().optional() });

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(160),
  slug: builderSlugSchema,
  content: z.string().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  featuredImage: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  readTime: z.string().optional(),
});
export const updateBlogPostSchema = createBlogPostSchema.omit({ slug: true }).partial().extend({ status: z.string().optional() });

export const createWebAssetSchema = z.object({
  name: z.string().min(1).max(160),
  type: z.string(),
  url: z.string().url(),
  size: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export const updateWebAssetSchema = createWebAssetSchema.partial();

export const createWebTemplateSchema = z.object({
  name: z.string().min(1).max(160),
  type: z.string(),
  content: z.string(),
  styles: z.string().optional(),
  scripts: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});
export const updateWebTemplateSchema = createWebTemplateSchema.partial().extend({ status: z.string().optional() });

export const createWebMenuSchema = z.object({
  name: z.string().min(1).max(160),
  location: z.string(),
  items: z.array(z.any()).optional(),
  settings: z.record(z.unknown()).optional(),
});
export const updateWebMenuSchema = createWebMenuSchema.partial().extend({ status: z.string().optional() });

export const createWebSeoSchema = z.object({
  path: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  ogImage: z.string().optional(),
  twitterCard: z.string().optional(),
  canonicalUrl: z.string().optional(),
  schemaJson: z.string().optional(),
});
export const updateWebSeoSchema = createWebSeoSchema.partial();

// ─────────────────────────────────────────────────
// WEB STUDIO — CMS COLLECTIONS
// ─────────────────────────────────────────────────

export const webCollectionFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    'Text', 'RichText', 'Number', 'Price', 'Boolean', 'Date', 'Image', 'Gallery',
    'Select', 'Color', 'URL', 'Email', 'Reference', 'Tags', 'Textarea',
  ]),
  required: z.boolean().optional(),
  options: z.string().optional(), // newline/comma-separated for Select
  referenceCollection: z.string().optional(), // slug of referenced collection
  helpText: z.string().optional(),
});
export type WebCollectionFieldInput = z.infer<typeof webCollectionFieldSchema>;

export const createWebCollectionSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and dashes only'),
  singular: z.string().max(120).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  kind: z.enum(['GENERIC', 'PRODUCT', 'POST', 'PORTFOLIO', 'TEAM', 'TESTIMONIAL']).optional(),
  fields: z.array(webCollectionFieldSchema).optional(),
  settings: z.record(z.unknown()).optional(),
});
export type CreateWebCollectionInput = z.infer<typeof createWebCollectionSchema>;

export const updateWebCollectionSchema = createWebCollectionSchema.omit({ slug: true }).partial().extend({
  status: z.string().optional(),
});
export type UpdateWebCollectionInput = z.infer<typeof updateWebCollectionSchema>;

export const createWebCollectionItemSchema = z.object({
  slug: z.string().max(160).optional(), // auto-derived from title field when omitted
  data: z.record(z.unknown()),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateWebCollectionItemInput = z.infer<typeof createWebCollectionItemSchema>;

export const updateWebCollectionItemSchema = createWebCollectionItemSchema.partial();
export type UpdateWebCollectionItemInput = z.infer<typeof updateWebCollectionItemSchema>;

// Seed a ready-made collection (Products, Projects, Team, Testimonials, Blog).
export const seedWebCollectionSchema = z.object({
  preset: z.enum(['products', 'projects', 'team', 'testimonials', 'blog', 'services', 'events']),
});
export type SeedWebCollectionInput = z.infer<typeof seedWebCollectionSchema>;

// Public form submission capture.
export const createWebFormSubmissionSchema = z.object({
  formName: z.string().min(1).max(120),
  pageSlug: z.string().optional(),
  data: z.record(z.unknown()),
  meta: z.record(z.unknown()).optional(),
});
export type CreateWebFormSubmissionInput = z.infer<typeof createWebFormSubmissionSchema>;

// ─────────────────────────────────────────────────
// WEB STUDIO — STOREFRONT ORDERS (e-commerce)
// ─────────────────────────────────────────────────
export const webCheckoutSchema = z.object({
  customer: z.object({
    name: z.string().min(1).max(160),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  items: z.array(z.object({
    productSlug: z.string().optional(),
    name: z.string().min(1),
    price: z.number().nonnegative(),
    qty: z.number().int().positive(),
    image: z.string().optional(),
  })).min(1, 'Cart is empty'),
  notes: z.string().optional(),
  currency: z.string().optional(),
});
export type WebCheckoutInput = z.infer<typeof webCheckoutSchema>;

export const updateWebOrderSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED']),
});
export type UpdateWebOrderInput = z.infer<typeof updateWebOrderSchema>;

// ════════════════════════════════════════════════
// CRM Phase 1: Opportunity Line Items & Price Books
// ════════════════════════════════════════════════

export const createOpportunityLineItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().min(0).max(100).default(0),
  sortOrder: z.number().int().nonnegative().default(0),
});
export type CreateOpportunityLineItemInput = z.infer<typeof createOpportunityLineItemSchema>;
export const updateOpportunityLineItemSchema = createOpportunityLineItemSchema.partial();
export type UpdateOpportunityLineItemInput = z.infer<typeof updateOpportunityLineItemSchema>;

export const createPriceBookSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).default('USD'),
  isDefault: z.boolean().default(false),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});
export type CreatePriceBookInput = z.infer<typeof createPriceBookSchema>;
export const updatePriceBookSchema = createPriceBookSchema.partial();
export type UpdatePriceBookInput = z.infer<typeof updatePriceBookSchema>;

export const createPriceBookEntrySchema = z.object({
  productId: z.string().min(1),
  listPrice: z.number().nonnegative(),
  minQuantity: z.number().positive().default(1),
});
export type CreatePriceBookEntryInput = z.infer<typeof createPriceBookEntrySchema>;

// ════════════════════════════════════════════════
// CRM Phase 2: Contact Tags
// ════════════════════════════════════════════════

export const createContactTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().max(7).default('#3b82f6'),
});
export type CreateContactTagInput = z.infer<typeof createContactTagSchema>;

export const mergeContactsSchema = z.object({
  primaryContactId: z.string().min(1),
  secondaryContactId: z.string().min(1),
});
export type MergeContactsInput = z.infer<typeof mergeContactsSchema>;

export const createCustomerTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().max(7).default('#3b82f6'),
});
export type CreateCustomerTagInput = z.infer<typeof createCustomerTagSchema>;

// ════════════════════════════════════════════════
// CRM Phase 3: Sales Targets & Reports
// ════════════════════════════════════════════════

export const createSalesTargetSchema = z.object({
  userId: z.string().optional(),
  period: z.string().min(1).max(20),
  targetType: z.enum(['REVENUE', 'DEALS', 'UNITS']).default('REVENUE'),
  target: z.number().positive(),
});
export type CreateSalesTargetInput = z.infer<typeof createSalesTargetSchema>;
export const updateSalesTargetSchema = createSalesTargetSchema.partial();
export type UpdateSalesTargetInput = z.infer<typeof updateSalesTargetSchema>;

export const createSavedReportSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['PIPELINE', 'LEADS', 'ACTIVITIES', 'REVENUE', 'CONVERSION']),
  filters: z.record(z.any()).default({}),
  columns: z.array(z.string()).default([]),
  chartType: z.enum(['BAR', 'LINE', 'PIE', 'FUNNEL']).optional(),
  isShared: z.boolean().default(false),
  schedule: z.string().optional(),
});
export type CreateSavedReportInput = z.infer<typeof createSavedReportSchema>;

// ════════════════════════════════════════════════
// CRM Phase 4: Workflow Automation & Sequences
// ════════════════════════════════════════════════

export const createCrmWorkflowRuleSchema = z.object({
  name: z.string().min(1).max(100),
  entity: z.enum(['LEAD', 'OPPORTUNITY', 'ACTIVITY', 'CONTACT']),
  trigger: z.enum(['ON_CREATE', 'ON_UPDATE', 'ON_STAGE_CHANGE', 'ON_STATUS_CHANGE', 'SCHEDULED']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GT', 'LT', 'GTE', 'LTE', 'IN', 'NOT_IN']),
    value: z.any(),
  })).default([]),
  actions: z.array(z.object({
    type: z.enum(['ASSIGN', 'CREATE_ACTIVITY', 'SEND_EMAIL', 'UPDATE_FIELD', 'NOTIFY']),
    config: z.record(z.any()),
  })).min(1),
  isActive: z.boolean().default(true),
});
export type CreateCrmWorkflowRuleInput = z.infer<typeof createCrmWorkflowRuleSchema>;
export const updateCrmWorkflowRuleSchema = createCrmWorkflowRuleSchema.partial();
export type UpdateCrmWorkflowRuleInput = z.infer<typeof updateCrmWorkflowRuleSchema>;

export const createEmailSequenceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  steps: z.array(z.object({
    templateId: z.string().min(1),
    delayDays: z.number().int().min(0).default(1),
    sortOrder: z.number().int().nonnegative().default(0),
  })).min(1),
});
export type CreateEmailSequenceInput = z.infer<typeof createEmailSequenceSchema>;

export const enrollSequenceSchema = z.object({
  contactId: z.string().optional(),
  leadId: z.string().optional(),
});
export type EnrollSequenceInput = z.infer<typeof enrollSequenceSchema>;

// ════════════════════════════════════════════════
// CRM Phase 5: Territories & Commissions
// ════════════════════════════════════════════════

export const createSalesTerritorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  criteria: z.record(z.any()).default({}),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});
export type CreateSalesTerritoryInput = z.infer<typeof createSalesTerritorySchema>;
export const updateSalesTerritorySchema = createSalesTerritorySchema.partial();
export type UpdateSalesTerritoryInput = z.infer<typeof updateSalesTerritorySchema>;

export const addTeamMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['REP', 'MANAGER', 'DIRECTOR']).default('REP'),
});
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;

export const createCommissionRuleSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['PERCENTAGE', 'FLAT', 'TIERED']).default('PERCENTAGE'),
  rate: z.number().min(0).max(100),
  tiers: z.array(z.object({
    min: z.number().nonnegative(),
    max: z.number().positive(),
    rate: z.number().min(0).max(100),
  })).default([]),
  appliesToAll: z.boolean().default(true),
  productIds: z.array(z.string()).default([]),
});
export type CreateCommissionRuleInput = z.infer<typeof createCommissionRuleSchema>;
export const updateCommissionRuleSchema = createCommissionRuleSchema.partial();
export type UpdateCommissionRuleInput = z.infer<typeof updateCommissionRuleSchema>;

export const calculateCommissionsSchema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});
export type CalculateCommissionsInput = z.infer<typeof calculateCommissionsSchema>;

// ════════════════════════════════════════════════
// CRM Phase 6: Web Forms & Documents
// ════════════════════════════════════════════════

export const createWebToLeadFormSchema = z.object({
  name: z.string().min(1).max(100),
  fields: z.array(z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['TEXT', 'EMAIL', 'PHONE', 'SELECT', 'TEXTAREA', 'NUMBER']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).min(1),
  settings: z.object({
    redirectUrl: z.string().optional(),
    notifyEmail: z.string().email().optional(),
    assignToId: z.string().optional(),
    sourceId: z.string().optional(),
    campaignId: z.string().optional(),
  }).default({}),
});
export type CreateWebToLeadFormInput = z.infer<typeof createWebToLeadFormSchema>;
export const updateWebToLeadFormSchema = createWebToLeadFormSchema.partial();
export type UpdateWebToLeadFormInput = z.infer<typeof updateWebToLeadFormSchema>;

export const submitWebFormSchema = z.object({
  data: z.record(z.string()),
});
export type SubmitWebFormInput = z.infer<typeof submitWebFormSchema>;

export const createCrmDocumentSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['PROPOSAL', 'CONTRACT', 'ATTACHMENT', 'OTHER']),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  entityType: z.enum(['LEAD', 'OPPORTUNITY', 'CUSTOMER', 'CONTACT', 'QUOTATION']),
  entityId: z.string().min(1),
});
export type CreateCrmDocumentInput = z.infer<typeof createCrmDocumentSchema>;

// ════════════════════════════════════════════════════
// Phase 7: Custom Fields
// ════════════════════════════════════════════════════

const customFieldEntityEnum = z.enum([
  'CUSTOMER', 'CONTACT', 'LEAD', 'OPPORTUNITY', 'QUOTATION', 'VENDOR',
]);

export const createCustomFieldSchema = z.object({
  entity: customFieldEntityEnum,
  fieldName: z.string().regex(/^[a-z][a-z0-9_]*$/, 'Must start with lowercase letter, only a-z 0-9 _'),
  label: z.string().min(1).max(200),
  fieldType: z.enum([
    'TEXT', 'NUMBER', 'DECIMAL', 'DATE', 'DATETIME', 'BOOLEAN',
    'PICKLIST', 'MULTI_PICKLIST', 'URL', 'EMAIL', 'PHONE',
    'TEXTAREA', 'LOOKUP', 'FORMULA',
  ]),
  description: z.string().max(500).optional(),
  isRequired: z.boolean().optional(),
  defaultValue: z.string().optional(),
  options: z.array(z.object({
    value: z.string().min(1),
    label: z.string().min(1),
    color: z.string().optional(),
  })).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    regex: z.string().optional(),
    maxLength: z.number().int().positive().optional(),
  }).optional(),
  lookupEntity: z.string().optional(),
  formulaExpr: z.string().optional(),
  sortOrder: z.number().int().optional(),
  section: z.string().optional(),
});
export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;

export const updateCustomFieldSchema = createCustomFieldSchema.partial();
export type UpdateCustomFieldInput = z.infer<typeof updateCustomFieldSchema>;

export const upsertCustomFieldValuesSchema = z.object({
  values: z.array(z.object({
    fieldId: z.string().min(1),
    value: z.string().nullable(),
  })),
});
export type UpsertCustomFieldValuesInput = z.infer<typeof upsertCustomFieldValuesSchema>;

export const createRecordTypeSchema = z.object({
  entity: customFieldEntityEnum,
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  fieldLayout: z.array(z.object({
    section: z.string().min(1),
    fields: z.array(z.string()),
  })).optional(),
  pipelineId: z.string().optional(),
  isDefault: z.boolean().optional(),
});
export type CreateRecordTypeInput = z.infer<typeof createRecordTypeSchema>;

export const updateRecordTypeSchema = createRecordTypeSchema.partial();
export type UpdateRecordTypeInput = z.infer<typeof updateRecordTypeSchema>;

// ════════════════════════════════════════════════════
// Phase 8: Approvals
// ════════════════════════════════════════════════════

export const createApprovalProcessSchema = z.object({
  name: z.string().min(1).max(200),
  entity: z.enum(['QUOTATION', 'OPPORTUNITY', 'DISCOUNT', 'SALES_ORDER']),
  triggerConditions: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'IN']),
    value: z.string().min(1),
  })),
  steps: z.array(z.object({
    order: z.number().int().positive(),
    approverType: z.enum(['USER', 'ROLE', 'MANAGER']),
    approverId: z.string().optional(),
    autoApproveAfterHours: z.number().positive().optional(),
  })).min(1),
});
export type CreateApprovalProcessInput = z.infer<typeof createApprovalProcessSchema>;

export const updateApprovalProcessSchema = createApprovalProcessSchema.partial().extend({ isActive: z.boolean().optional() });
export type UpdateApprovalProcessInput = z.infer<typeof updateApprovalProcessSchema>;

export const submitApprovalSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  processId: z.string().optional(),
});
export type SubmitApprovalInput = z.infer<typeof submitApprovalSchema>;

export const approvalActionSchema = z.object({
  comments: z.string().max(2000).optional(),
});
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;

// ════════════════════════════════════════════════════
// Phase 9: CPQ
// ════════════════════════════════════════════════════

export const createQuotationTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  headerHtml: z.string().optional(),
  footerHtml: z.string().optional(),
  termsTemplate: z.string().optional(),
  logoUrl: z.string().url().optional(),
  colorScheme: z.object({
    primary: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
});
export type CreateQuotationTemplateInput = z.infer<typeof createQuotationTemplateSchema>;

export const updateQuotationTemplateSchema = createQuotationTemplateSchema.partial();
export type UpdateQuotationTemplateInput = z.infer<typeof updateQuotationTemplateSchema>;

export const sendForSignatureSchema = z.object({
  signerName: z.string().min(1).max(200),
  signerEmail: z.string().email(),
});
export type SendForSignatureInput = z.infer<typeof sendForSignatureSchema>;

export const submitSignatureSchema = z.object({
  signatureData: z.string().min(1),
});
export type SubmitSignatureInput = z.infer<typeof submitSignatureSchema>;

export const createQuotationVersionSchema = z.object({
  changeNote: z.string().max(500).optional(),
});
export type CreateQuotationVersionInput = z.infer<typeof createQuotationVersionSchema>;

// ════════════════════════════════════════════════════
// Phase 10: Collaboration
// ════════════════════════════════════════════════════

export const createCrmCommentSchema = z.object({
  body: z.string().min(1).max(10000),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
});
export type CreateCrmCommentInput = z.infer<typeof createCrmCommentSchema>;

export const updateCrmCommentSchema = z.object({
  body: z.string().min(1).max(10000),
});
export type UpdateCrmCommentInput = z.infer<typeof updateCrmCommentSchema>;

export const createCrmNoteSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(50000),
  noteType: z.enum(['GENERAL', 'MEETING_NOTES', 'COMPETITIVE_INTEL', 'OBJECTION', 'NEXT_STEPS']).optional(),
});
export type CreateCrmNoteInput = z.infer<typeof createCrmNoteSchema>;

export const updateCrmNoteSchema = createCrmNoteSchema.partial();
export type UpdateCrmNoteInput = z.infer<typeof updateCrmNoteSchema>;

// ════════════════════════════════════════════════════
// Phase 11: Playbooks
// ════════════════════════════════════════════════════

export const createPlaybookSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  pipelineId: z.string().optional(),
});
export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>;

export const updatePlaybookSchema = createPlaybookSchema.partial();
export type UpdatePlaybookInput = z.infer<typeof updatePlaybookSchema>;

export const playbookStageSchema = z.object({
  stageName: z.string().min(1).max(200),
  guidanceNotes: z.string().optional(),
  checklist: z.array(z.object({
    item: z.string().min(1),
    isRequired: z.boolean().default(false),
  })).optional(),
  requiredFields: z.array(z.string()).optional(),
  talkingPoints: z.array(z.string()).optional(),
  exitCriteria: z.array(z.object({
    criterion: z.string().min(1),
    isRequired: z.boolean().default(false),
  })).optional(),
  sortOrder: z.number().int().optional(),
});
export type PlaybookStageInput = z.infer<typeof playbookStageSchema>;

export const createBattlecardSchema = z.object({
  competitor: z.string().min(1).max(200),
  playbookId: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  objections: z.array(z.object({
    objection: z.string().min(1),
    response: z.string().min(1),
  })).optional(),
  winStrategy: z.string().optional(),
  loseReasons: z.array(z.string()).optional(),
});
export type CreateBattlecardInput = z.infer<typeof createBattlecardSchema>;

export const updateBattlecardSchema = createBattlecardSchema.partial();
export type UpdateBattlecardInput = z.infer<typeof updateBattlecardSchema>;

// ════════════════════════════════════════════════════
// Phase 12: Dashboards
// ════════════════════════════════════════════════════

export const createCrmDashboardSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  isShared: z.boolean().optional(),
});
export type CreateCrmDashboardInput = z.infer<typeof createCrmDashboardSchema>;

export const updateCrmDashboardSchema = createCrmDashboardSchema.partial();
export type UpdateCrmDashboardInput = z.infer<typeof updateCrmDashboardSchema>;

export const createDashboardWidgetSchema = z.object({
  widgetType: z.enum([
    'KPI_CARD', 'BAR_CHART', 'LINE_CHART', 'PIE_CHART',
    'FUNNEL', 'TABLE', 'LEADERBOARD', 'GAUGE',
  ]),
  title: z.string().min(1).max(200),
  dataSource: z.enum([
    'PIPELINE', 'LEADS', 'ACTIVITIES', 'REVENUE',
    'TARGETS', 'CONVERSIONS', 'COMMISSIONS',
  ]),
  config: z.object({
    metric: z.string().min(1),
    groupBy: z.string().optional(),
    dateRange: z.enum([
      'TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_QUARTER',
      'THIS_YEAR', 'LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS',
      'LAST_YEAR', 'CUSTOM',
    ]).optional(),
    filters: z.record(z.string()).optional(),
    colorScheme: z.string().optional(),
    threshold: z.object({
      warning: z.number(),
      danger: z.number(),
    }).optional(),
  }),
  refreshInterval: z.number().int().min(0).max(1440).optional(),
});
export type CreateDashboardWidgetInput = z.infer<typeof createDashboardWidgetSchema>;

export const updateDashboardWidgetSchema = createDashboardWidgetSchema.partial();
export type UpdateDashboardWidgetInput = z.infer<typeof updateDashboardWidgetSchema>;

export const updateDashboardLayoutSchema = z.object({
  layout: z.array(z.object({
    widgetId: z.string().min(1),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1).max(12),
    h: z.number().int().min(1).max(8),
  })),
});
export type UpdateDashboardLayoutInput = z.infer<typeof updateDashboardLayoutSchema>;

// ════════════════════════════════════════════════════
// Phase 11+: Advanced Inventory
// ════════════════════════════════════════════════════

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  parentId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createVariantSchema = z.object({
  parentSkuId: z.string().min(1, 'Parent SKU ID is required'),
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Variant name is required').max(200),
  attributes: z.record(z.unknown()).default({}),
  costPrice: z.number().nonnegative('Cost price must be non-negative'),
  sellPrice: z.number().nonnegative('Sell price must be non-negative'),
  barcode: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
});
export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const createBinLocationSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  zone: z.string().min(1, 'Zone is required').max(50).default('A'),
  aisle: z.string().max(50).optional().nullable(),
  rack: z.string().max(50).optional().nullable(),
  bin: z.string().max(50).optional().nullable(),
  code: z.string().min(1, 'Code is required').max(100),
  name: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  capacity: z.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type CreateBinLocationInput = z.infer<typeof createBinLocationSchema>;

export const createSerialNumberSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  warehouseId: z.string().optional().nullable(),
  serialNo: z.string().min(1, 'Serial No is required').max(100),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'IN_REPAIR', 'SCRAPPED', 'RETURNED']).default('AVAILABLE'),
  purchaseDate: z.string().optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  purchaseOrderId: z.string().optional().nullable(),
  salesOrderId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  customFields: z.record(z.unknown()).default({}),
});
export type CreateSerialNumberInput = z.infer<typeof createSerialNumberSchema>;

export const updateSerialNumberSchema = createSerialNumberSchema.partial();
export type UpdateSerialNumberInput = z.infer<typeof updateSerialNumberSchema>;

export const createBatchSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  batchNo: z.string().min(1, 'Batch No is required').max(100),
  lotNo: z.string().max(100).optional().nullable(),
  quantity: z.number().nonnegative().default(0),
  manufactureDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  supplierBatchNo: z.string().max(100).optional().nullable(),
  costPrice: z.number().nonnegative().optional().nullable(),
  status: z.enum(['ACTIVE', 'PARTIALLY_USED', 'EXHAUSTED', 'EXPIRED', 'QUARANTINE']).default('ACTIVE'),
  notes: z.string().max(2000).optional().nullable(),
});
export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const updateBatchSchema = createBatchSchema.partial();
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;

export const createCycleCountItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  binLocationId: z.string().optional().nullable(),
  expectedQty: z.number(),
  countedQty: z.number().optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
});

export const createCycleCountSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  countedBy: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(createCycleCountItemSchema).min(1, 'At least one item is required'),
});
export type CreateCycleCountInput = z.infer<typeof createCycleCountSchema>;

export const submitCycleCountSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1, 'Item ID is required'),
    countedQty: z.number().nonnegative('Counted quantity must be non-negative'),
    remarks: z.string().max(1000).optional().nullable(),
  })).min(1, 'At least one item is required'),
  remarks: z.string().max(2000).optional().nullable(),
});
export type SubmitCycleCountInput = z.infer<typeof submitCycleCountSchema>;

export const createCycleCountScheduleSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  zone: z.string().max(50).optional().nullable(),
  binScope: z.string().max(100).optional().nullable(),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  blindCount: z.boolean().default(false),
  nextDueDate: z.string().min(1, 'Next due date is required'),
  active: z.boolean().default(true),
});
export type CreateCycleCountScheduleInput = z.infer<typeof createCycleCountScheduleSchema>;
export const updateCycleCountScheduleSchema = createCycleCountScheduleSchema.partial();
export type UpdateCycleCountScheduleInput = z.infer<typeof updateCycleCountScheduleSchema>;

export const createLicensePlateSchema = z.object({
  code: z.string().min(1, 'License plate code is required').max(100),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  binId: z.string().optional().nullable(),
});
export type CreateLicensePlateInput = z.infer<typeof createLicensePlateSchema>;

export const addLicensePlateItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  lotBatchId: z.string().optional().nullable(),
  serialNumberId: z.string().optional().nullable(),
});
export type AddLicensePlateItemInput = z.infer<typeof addLicensePlateItemSchema>;

export const moveLicensePlateSchema = z.object({
  binId: z.string().min(1, 'Destination bin ID is required'),
});
export type MoveLicensePlateInput = z.infer<typeof moveLicensePlateSchema>;

export const createPutawayTaskSchema = z.object({
  stockEntryId: z.string().min(1, 'Stock entry ID is required'),
  inventoryItemId: z.string().min(1, 'Inventory item ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  suggestedBinId: z.string().optional().nullable(),
});
export type CreatePutawayTaskInput = z.infer<typeof createPutawayTaskSchema>;

export const completePutawayTaskSchema = z.object({
  notes: z.string().max(1000).optional().nullable(),
});
export type CompletePutawayTaskInput = z.infer<typeof completePutawayTaskSchema>;

export const quarantineBatchSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(1000),
});
export type QuarantineBatchInput = z.infer<typeof quarantineBatchSchema>;

export const releaseBatchQuarantineSchema = z.object({
  reason: z.string().max(1000).optional().nullable(),
});
export type ReleaseBatchQuarantineInput = z.infer<typeof releaseBatchQuarantineSchema>;

export const createStockReservationSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  sourceType: z.enum(['SALES_ORDER', 'TRANSFER', 'MANUAL']).default('MANUAL'),
  sourceId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export type CreateStockReservationInput = z.infer<typeof createStockReservationSchema>;

export const assembleKitSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
});
export type AssembleKitInput = z.infer<typeof assembleKitSchema>;

export const disassembleKitSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
});
export type DisassembleKitInput = z.infer<typeof disassembleKitSchema>;

export const createTransferApprovalRuleSchema = z.object({
  warehouseId: z.string().optional().nullable(),
  thresholdValue: z.number().nonnegative(),
  isActive: z.boolean().default(true),
});
export type CreateTransferApprovalRuleInput = z.infer<typeof createTransferApprovalRuleSchema>;
export const updateTransferApprovalRuleSchema = createTransferApprovalRuleSchema.partial();
export type UpdateTransferApprovalRuleInput = z.infer<typeof updateTransferApprovalRuleSchema>;

export const rejectTransferSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(1000),
});
export type RejectTransferInput = z.infer<typeof rejectTransferSchema>;

export const createPickWaveSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  salesOrderIds: z.array(z.string()).min(1, 'At least one sales order is required'),
  notes: z.string().max(1000).optional().nullable(),
});
export type CreatePickWaveInput = z.infer<typeof createPickWaveSchema>;

export const recordPickSchema = z.object({
  pickedQty: z.number().nonnegative(),
  scannedSerials: z.array(z.string()).optional().default([]),
});
export type RecordPickInput = z.infer<typeof recordPickSchema>;

export const createConsignmentStockSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required').max(200),
  productId: z.string().min(1, 'Product ID is required'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  quantityOnHand: z.number().nonnegative().default(0),
  unitCost: z.number().nonnegative(),
});
export type CreateConsignmentStockInput = z.infer<typeof createConsignmentStockSchema>;

export const recordConsignmentConsumptionSchema = z.object({
  quantity: z.number().positive('Quantity must be positive'),
  reference: z.string().max(200).optional().nullable(),
});
export type RecordConsignmentConsumptionInput = z.infer<typeof recordConsignmentConsumptionSchema>;

export const receiveWithTraceabilitySchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  valuationRate: z.number().nonnegative().default(0),
  serialNumbers: z.array(z.string()).optional().default([]),
  batchNo: z.string().max(100).optional().nullable(),
  lotNo: z.string().max(100).optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});
export type ReceiveWithTraceabilityInput = z.infer<typeof receiveWithTraceabilitySchema>;

export const createQAInspectionTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  productId: z.string().optional().nullable(),
  checklist: z.array(z.object({ parameter: z.string(), criteria: z.string() })).default([]),
  isActive: z.boolean().default(true),
});
export type CreateQAInspectionTemplateInput = z.infer<typeof createQAInspectionTemplateSchema>;
export const updateQAInspectionTemplateSchema = createQAInspectionTemplateSchema.partial();
export type UpdateQAInspectionTemplateInput = z.infer<typeof updateQAInspectionTemplateSchema>;

export const createRequisitionFromReorderRuleSchema = z.object({
  requiredDate: z.string().optional().nullable(),
});
export type CreateRequisitionFromReorderRuleInput = z.infer<typeof createRequisitionFromReorderRuleSchema>;

export const createKitVersionSchema = z.object({
  notes: z.string().max(1000).optional().nullable(),
});
export type CreateKitVersionInput = z.infer<typeof createKitVersionSchema>;

export const createQACheckpointSchema = z.object({
  parameter: z.string().min(1, 'Parameter is required'),
  criteria: z.string().min(1, 'Criteria is required'),
  sortOrder: z.number().int().default(0),
});

export const createQAInspectionSchema = z.object({
  referenceType: z.enum(['PURCHASE_RECEIPT', 'STOCK_ENTRY', 'PRODUCTION']),
  referenceId: z.string().min(1, 'Reference ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  warehouseId: z.string().optional().nullable(),
  inspectedQty: z.number().positive('Inspected quantity must be positive'),
  inspectedBy: z.string().optional().nullable(),
  remarks: z.string().max(2000).optional().nullable(),
  checkpoints: z.array(createQACheckpointSchema).min(1, 'At least one checkpoint is required'),
});
export type CreateQAInspectionInput = z.infer<typeof createQAInspectionSchema>;

export const submitQAInspectionSchema = z.object({
  status: z.enum(['PASS', 'FAIL', 'PARTIAL', 'CANCELLED']),
  disposition: z.string().max(200).optional().nullable(),
  acceptedQty: z.number().nonnegative(),
  rejectedQty: z.number().nonnegative(),
  remarks: z.string().max(2000).optional().nullable(),
  checkpoints: z.array(z.object({
    id: z.string().min(1),
    result: z.enum(['PASS', 'FAIL', 'NA']),
    observedValue: z.string().max(200).optional().nullable(),
    remarks: z.string().max(1000).optional().nullable(),
  })).min(1),
});
export type SubmitQAInspectionInput = z.infer<typeof submitQAInspectionSchema>;

export const createReorderRuleSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  warehouseId: z.string().optional().nullable(),
  minQty: z.number().nonnegative(),
  maxQty: z.number().nonnegative().optional().nullable(),
  reorderQty: z.number().positive(),
  leadTimeDays: z.number().int().nonnegative().default(0),
  preferredVendorId: z.string().optional().nullable(),
  autoCreatePO: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type CreateReorderRuleInput = z.infer<typeof createReorderRuleSchema>;

export const createKitItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  sortOrder: z.number().int().default(0),
});

export const createKitSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Kit name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  sellPrice: z.number().nonnegative(),
  discount: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  components: z.array(createKitItemSchema).min(1, 'At least one component is required'),
});
export type CreateKitInput = z.infer<typeof createKitSchema>;

export const createStockEntryItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  fromWarehouseId: z.string().optional().nullable(),
  toWarehouseId: z.string().optional().nullable(),
  fromBinId: z.string().optional().nullable(),
  toBinId: z.string().optional().nullable(),
  uomId: z.string().optional().nullable(),
  qty: z.number().positive('Quantity must be greater than zero'),
  valuationRate: z.number().nonnegative().optional(),
  batchId: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  serialNo: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const createStockEntrySchema = z.object({
  type: z.enum(['MATERIAL_RECEIPT', 'MATERIAL_ISSUE', 'MATERIAL_TRANSFER', 'STOCK_ADJUSTMENT', 'OPENING_STOCK', 'SCRAP']),
  purpose: z.string().optional().nullable(),
  remarks: z.string().max(2000).optional().nullable(),
  fromWarehouseId: z.string().optional().nullable(),
  toWarehouseId: z.string().optional().nullable(),
  referenceDoc: z.string().optional().nullable(),
  referenceType: z.string().optional().nullable(),
  items: z.array(createStockEntryItemSchema).min(1, 'At least one item is required'),
});
export type CreateStockEntryInput = z.infer<typeof createStockEntrySchema>;

export const updateStockEntrySchema = createStockEntrySchema.partial();
export type UpdateStockEntryInput = z.infer<typeof updateStockEntrySchema>;

export const transferStockSchema = z.object({
  fromWarehouseId: z.string().min(1, 'Source warehouse is required'),
  toWarehouseId: z.string().min(1, 'Destination warehouse is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    qty: z.number().positive('Quantity must be greater than zero'),
    batchId: z.string().optional().nullable(),
    serialNo: z.string().optional().nullable(),
  })).min(1, 'At least one item is required'),
  remarks: z.string().max(2000).optional().nullable(),
});
export type TransferStockInput = z.infer<typeof transferStockSchema>;

// ════════════════════════════════════════════════════
// Change History
// ════════════════════════════════════════════════════

export const changeHistoryQuerySchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ChangeHistoryQueryInput = z.infer<typeof changeHistoryQuerySchema>;

// ════════════════════════════════════════════════════
// Access Packages
// ════════════════════════════════════════════════════

export const createAccessPackageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
  fieldAccess: z.record(z.record(z.enum(['hidden', 'readonly', 'editable']))).default({}),
  recordFilter: z.record(z.record(z.unknown())).default({}),
});
export type CreateAccessPackageInput = z.infer<typeof createAccessPackageSchema>;

export const updateAccessPackageSchema = createAccessPackageSchema.partial();
export type UpdateAccessPackageInput = z.infer<typeof updateAccessPackageSchema>;

export const assignAccessPackageSchema = z.object({
  roleId: z.string().min(1),
  accessPackageId: z.string().min(1),
});
export type AssignAccessPackageInput = z.infer<typeof assignAccessPackageSchema>;

// ════════════════════════════════════════════════════
// Demo Data
// ════════════════════════════════════════════════════

export const loadDemoDataSchema = z.object({
  modules: z.array(z.string()).optional(),
});
export type LoadDemoDataInput = z.infer<typeof loadDemoDataSchema>;

export const removeDemoDataSchema = z.object({
  module: z.string().optional(),
});
export type RemoveDemoDataInput = z.infer<typeof removeDemoDataSchema>;

// ════════════════════════════════════════════════════
// Healthcare Schemas
// ════════════════════════════════════════════════════

export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
  vitalsHistory: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
});
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial();
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const createPractitionerSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  specialty: z.string().min(1, 'Specialty is required').max(100),
  licenseNumber: z.string().min(1, 'License number is required').max(50),
});
export type CreatePractitionerInput = z.infer<typeof createPractitionerSchema>;

export const updatePractitionerSchema = createPractitionerSchema.partial();
export type UpdatePractitionerInput = z.infer<typeof updatePractitionerSchema>;

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  practitionerId: z.string().min(1, 'Practitioner ID is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().max(2000).optional().nullable(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  practitionerId: z.string().min(1, 'Practitioner ID is required'),
  details: z.string().min(1, 'Details are required'),
});
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

export const logDrugRegisterSchema = z.object({
  name: z.string().min(1, 'Drug name is required').max(200),
  batchNumber: z.string().min(1, 'Batch number is required').max(100),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  isControlled: z.boolean().default(false),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});
export type LogDrugRegisterInput = z.infer<typeof logDrugRegisterSchema>;

export const createMedicalEncounterSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  practitionerId: z.string().min(1, 'Practitioner ID is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  treatmentCode: z.string().min(1, 'Treatment code is required'),
  billingAmount: z.number().positive('Billing amount must be greater than zero'),
});
export type CreateMedicalEncounterInput = z.infer<typeof createMedicalEncounterSchema>;

// ════════════════════════════════════════════════════
// Error Reporting Schemas
// ════════════════════════════════════════════════════

export const errorReportSchema = z.object({
  message: z.string().min(1, 'Error message is required'),
  stack: z.string().optional().nullable(),
  url: z.string().min(1, 'URL is required'),
  userAgent: z.string().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  userEmail: z.string().email('Invalid email address').or(z.string().length(0)).optional().nullable(),
  userName: z.string().optional().nullable(),
  requestId: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
});
export type ErrorReportInput = z.infer<typeof errorReportSchema>;

// ════════════════════════════════════════════════════
// Fixed Asset Management Schemas
// ════════════════════════════════════════════════════

export const createFixedAssetCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  depreciationMethod: z.enum(['SLM', 'WDV']),
  expectedLifeMonths: z.number().int().positive('Expected useful life in months must be positive'),
  depreciationRate: z.coerce.number().min(0).max(100).optional().nullable(),
  assetAccountId: z.string().optional().nullable(),
  depreciationAccountId: z.string().optional().nullable(),
  expenseAccountId: z.string().optional().nullable(),
});
export type CreateFixedAssetCategoryInput = z.infer<typeof createFixedAssetCategorySchema>;

export const createFixedAssetSchema = z.object({
  assetCode: z.string().min(1, 'Asset code is required').max(100),
  name: z.string().min(1, 'Asset name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  purchaseValue: z.number().positive('Purchase value must be positive'),
  salvageValue: z.number().nonnegative('Salvage value must be non-negative'),
  usefulLifeYears: z.number().int().positive('Useful life in years must be positive'),
  depreciationMethod: z.enum(['SLM', 'WDV']),
  depreciationRate: z.number().min(0).max(100).optional().nullable(),
  accountId: z.string().min(1, 'GL Asset account is required'),
  accumDepAccountId: z.string().min(1, 'Accumulated Depreciation contra-account is required'),
  locationId: z.string().optional().nullable(),
  custodianId: z.string().optional().nullable(),
});
export type CreateFixedAssetInput = z.infer<typeof createFixedAssetSchema>;

export const updateFixedAssetSchema = createFixedAssetSchema.partial().extend({
  status: z.enum(['ACTIVE', 'DISPOSED', 'UNDER_MAINTENANCE']).optional(),
});
export type UpdateFixedAssetInput = z.infer<typeof updateFixedAssetSchema>;

export const transferFixedAssetSchema = z.object({
  transferDate: z.string().min(1, 'Transfer date is required'),
  toLocationId: z.string().optional().nullable(),
  toCustodianId: z.string().optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
});
export type TransferFixedAssetInput = z.infer<typeof transferFixedAssetSchema>;

export const logFixedAssetMaintenanceSchema = z.object({
  maintenanceDate: z.string().min(1, 'Maintenance date is required'),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION']),
  description: z.string().min(1, 'Description is required').max(2000),
  cost: z.number().nonnegative('Maintenance cost must be non-negative'),
  performedBy: z.string().min(1, 'Performed by is required').max(200),
  nextMaintenanceDate: z.string().optional().nullable(),
});
export type LogFixedAssetMaintenanceInput = z.infer<typeof logFixedAssetMaintenanceSchema>;

// Note: CRM Contract Zod schemas (createContractSchema, updateContractSchema,
// contractStatusSchema, renewContractSchema) are colocated in
// apps/api/src/modules/crm/crm-contracts.service.ts rather than here, matching
// how that service file is consumed directly by crm-contracts.controller.ts.

export const customerNoteSchema = z.object({ content: z.string(), type: z.string().optional() }); export type CustomerNoteInput = z.infer<typeof customerNoteSchema>; export const vendorNoteSchema = z.object({ content: z.string(), type: z.string().optional() }); export type VendorNoteInput = z.infer<typeof vendorNoteSchema>;
export const customerBulkStatusSchema = z.object({ ids: z.array(z.string()), status: z.string() }); export const vendorBulkStatusSchema = z.object({ ids: z.array(z.string()), status: z.string() });

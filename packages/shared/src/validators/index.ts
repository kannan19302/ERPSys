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
  type: z.enum(['form', 'list', 'dashboard']),
  formId: z.string().optional(),
  dashboardId: z.string().optional(),
});
export type AddAppPageInput = z.infer<typeof addAppPageSchema>;

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

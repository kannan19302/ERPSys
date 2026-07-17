// ─────────────────────────────────────────────────
// Shared Constants — Universal ERP System
// ─────────────────────────────────────────────────

// ── Pagination Defaults ──
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// ── Entity Statuses ──
export const ENTITY_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'INVITED', 'LOCKED'] as const;
export const TENANT_STATUSES = ['ACTIVE', 'SUSPENDED', 'CANCELLED'] as const;

// ── Invoice Statuses ──
export const INVOICE_STATUSES = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'VOID',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// ── Order Statuses ──
export const SALES_ORDER_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const;
export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];

export const PURCHASE_ORDER_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

// ── Product Types ──
export const PRODUCT_TYPES = ['GOODS', 'SERVICE', 'DIGITAL', 'SUBSCRIPTION'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

// ── Customer Types ──
export const CUSTOMER_TYPES = ['COMPANY', 'INDIVIDUAL'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

// ── Leave Types ──
export const LEAVE_TYPES = [
  'ANNUAL',
  'SICK',
  'PERSONAL',
  'MATERNITY',
  'PATERNITY',
  'UNPAID',
  'COMPENSATORY',
] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

// ── Currencies (common subset) ──
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
] as const;

// ── Units of Measure ──
export const UNITS_OF_MEASURE = [
  { code: 'EACH', name: 'Each' },
  { code: 'KG', name: 'Kilogram' },
  { code: 'LTR', name: 'Litre' },
  { code: 'MTR', name: 'Meter' },
  { code: 'SQM', name: 'Square Meter' },
  { code: 'HR', name: 'Hour' },
  { code: 'DAY', name: 'Day' },
  { code: 'BOX', name: 'Box' },
  { code: 'PACK', name: 'Pack' },
  { code: 'SET', name: 'Set' },
] as const;

// ── RBAC Permissions ──
export const MODULES = [
  'admin',
  'finance',
  'hr',
  'crm',
  'inventory',
  'procurement',
  'sales',
  'supply-chain',
  'projects',
  'analytics',
  'documents',
  'communication',
] as const;

export const ACTIONS = ['create', 'read', 'update', 'delete', 'export', 'approve'] as const;

// ── Date Formats ──
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss'Z'";
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';
export const DISPLAY_DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';

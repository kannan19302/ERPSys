// ─────────────────────────────────────────────────
// Core Types — Universal ERP System
// ─────────────────────────────────────────────────

import { CustomerType, ProductType } from '../constants';

// ── Tenant ──
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

// ── User ──
export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'LOCKED';

export interface UserWithRoles extends User {
  roles: Role[];
}

// ── Role & Permissions ──
export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  module: string;
  resource: string;
  action: string;
}

// ── Organization ──
export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  address: Address | null;
  currency: string;
  timezone: string;
  fiscalYearStart: number;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// ── Department ──
export interface Department {
  id: string;
  tenantId: string;
  orgId: string;
  name: string;
  code: string;
  parentId: string | null;
  managerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Customer ──
export interface Customer {
  id: string;
  tenantId: string;
  orgId: string;
  type: CustomerType;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  billingAddress: Address | null;
  shippingAddress: Address | null;
  creditLimit: number | null;
  paymentTerms: number;
  status: EntityStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Vendor ──
export interface Vendor {
  id: string;
  tenantId: string;
  orgId: string;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  address: Address | null;
  paymentTerms: number;
  status: EntityStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Product ──
export interface Product {
  id: string;
  tenantId: string;
  orgId: string;
  sku: string;
  name: string;
  description: string | null;
  type: ProductType;
  category: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  taxCategory: string | null;
  isActive: boolean;
  images: string[];
  attributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ── Common Types ──
export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    statusCode: number;
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    timestamp: string;
    path: string;
  };
}

// ── Audit Log ──
export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';

// ── Change History (Field-Level Audit Trail) ──
export interface FieldChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
}

export type ChangeAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';

export interface ChangeHistoryEntry {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  action: ChangeAction;
  fieldChanges: FieldChange[];
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ── Permission Registry ──
export type PermissionLevel = 'endpoint' | 'page' | 'component' | 'field' | 'record';

export interface PermissionDefinition {
  code: string;
  module: string;
  resource: string;
  action: string;
  level: PermissionLevel;
  description: string;
  /**
   * Optional sub-resource grouping label for UI display (Access Control matrix
   * drill-in, role editor category sections). Only populated for modules whose
   * permission count is large enough that flat module-level grouping becomes
   * unreadable — currently only `admin` (21 resources, ~53 codes). Every other
   * module stays `undefined` and renders with the existing flat module grouping.
   */
  category?: string;
}

export type FieldAccessLevel = 'hidden' | 'readonly' | 'editable';

export interface AccessPackageData {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  permissions: string[];
  fieldAccess: Record<string, Record<string, FieldAccessLevel>>;
  recordFilter: Record<string, Record<string, unknown>>;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolvedAccess {
  endpoints: string[];
  pages: string[];
  components: string[];
  fields: Record<string, Record<string, FieldAccessLevel>>;
  recordFilters: Record<string, Record<string, unknown>>;
}

// ── Demo Data ──
export interface DemoDataStatus {
  loaded: boolean;
  loadedAt: Date | null;
  modules: Record<string, { count: number; loaded: boolean }>;
}

// ── Purchase Requisitions ──
export interface PurchaseRequisition {
  id: string;
  tenantId: string;
  orgId: string;
  requisitionNumber: string;
  title: string;
  description: string | null;
  status: string;
  requestedById: string;
  departmentId: string | null;
  requiredDate: string | null;
  estimatedCost: number;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: PurchaseRequisitionItem[];
}

export interface PurchaseRequisitionItem {
  id: string;
  tenantId: string;
  requisitionId: string;
  productId: string | null;
  description: string;
  quantity: number;
  estimatedPrice: number;
  totalAmount: number;
  sortOrder: number;
}

// ── Blanket Purchase Agreements ──
export interface BlanketPurchaseAgreement {
  id: string;
  tenantId: string;
  orgId: string;
  vendorId: string;
  agreementNumber: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  agreementLimit: number;
  releasedAmount: number;
  currency: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: BlanketPurchaseAgreementItem[];
}

export interface BlanketPurchaseAgreementItem {
  id: string;
  tenantId: string;
  agreementId: string;
  productId: string | null;
  description: string;
  quantity: number;
  releasedQty: number;
  unitPrice: number;
  totalAmount: number;
  sortOrder: number;
}

// ── Supplier Scorecard ──
export interface SupplierScorecard {
  vendorId: string;
  vendorName: string;
  onTimeDeliveryRate: number; // percentage (0-100)
  qualityRate: number; // percentage (0-100) based on GRN accepted vs total
  totalOrders: number;
  totalSpend: number;
  defectRate: number; // percentage (0-100)
  avgLeadTimeDays: number;
}

// ── 3-Way Match Check ──
export interface ThreeWayMatchResult {
  purchaseOrderId: string;
  poNumber: string;
  status: 'MATCHED' | 'DISCREPANCY' | 'PENDING';
  overallMatch: boolean;
  items: ThreeWayMatchItem[];
}

export interface ThreeWayMatchItem {
  productId: string | null;
  description: string;
  orderedQty: number;
  receivedQty: number;
  invoicedQty: number;
  orderedUnitPrice: number;
  receivedUnitPrice: number;
  invoicedUnitPrice: number;
  qtyMatch: boolean;
  priceMatch: boolean;
}

// ── Fixed Asset Management ──
export interface FixedAssetCategory {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  depreciationMethod: 'SLM' | 'WDV';
  expectedLifeMonths: number;
  depreciationRate: number | null;
  assetAccountId: string | null;
  depreciationAccountId: string | null;
  expenseAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FixedAsset {
  id: string;
  tenantId: string;
  orgId: string;
  assetCode: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  purchaseDate: string;
  purchaseValue: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: string;
  depreciationRate: number | null;
  currentValue: number;
  accountId: string;
  accumDepAccountId: string;
  locationId: string | null;
  custodianId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  category?: FixedAssetCategory | null;
  depreciations?: AssetDepreciation[];
  transfers?: AssetTransferLog[];
  maintenanceLogs?: AssetMaintenanceLog[];
}

export interface AssetDepreciation {
  id: string;
  tenantId: string;
  assetId: string;
  date: string;
  amount: number;
  periodName: string | null;
  accumulatedDepreciation: number;
  bookValue: number;
  status: 'PENDING' | 'POSTED';
  journalId: string | null;
  createdAt: string;
}

export interface AssetTransferLog {
  id: string;
  tenantId: string;
  assetId: string;
  transferDate: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  fromCustodianId: string | null;
  toCustodianId: string | null;
  reason: string | null;
  performedBy: string;
  createdAt: string;
}

export interface AssetMaintenanceLog {
  id: string;
  tenantId: string;
  assetId: string;
  maintenanceDate: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION';
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate: string | null;
  createdAt: string;
}


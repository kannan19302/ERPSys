'use client';

import { useApiQuery } from './useApi';
import { queryKeys } from '../queryKeys';

type ListResponse<T> = T[] | { data: T[]; total?: number };

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) return (data as any).data || [];
  return [];
}

// ═══════════════════════════════════════════════
// Finance
// ═══════════════════════════════════════════════
export function useInvoices() {
  return useApiQuery<ListResponse<any>>(queryKeys.finance.invoices(), '/finance/invoices', { select: normalizeList });
}
export function usePayments() {
  return useApiQuery<ListResponse<any>>(queryKeys.finance.payments(), '/finance/payments', { select: normalizeList });
}
export function useAccounts() {
  return useApiQuery<ListResponse<any>>(queryKeys.finance.accounts(), '/advanced-finance/accounts', { select: normalizeList });
}
export function useJournals() {
  return useApiQuery<ListResponse<any>>(queryKeys.finance.journals(), '/advanced-finance/journals', { select: normalizeList });
}
export function useBudgets() {
  return useApiQuery<ListResponse<any>>(queryKeys.finance.budgets(), '/advanced-finance/budgets', { select: normalizeList });
}
export function useFixedAssets() {
  return useApiQuery<ListResponse<any>>(queryKeys.finance.fixedAssets(), '/advanced-finance/fixed-assets', { select: normalizeList });
}
export function useBankAccounts() {
  return useApiQuery<ListResponse<any>>(queryKeys.finance.bankAccounts(), '/advanced-finance/bank-accounts', { select: normalizeList });
}
export function useTaxRules() {
  return useApiQuery<ListResponse<any>>(queryKeys.finance.taxRules(), '/advanced-finance/tax-rules', { select: normalizeList });
}

// ═══════════════════════════════════════════════
// CRM
// ═══════════════════════════════════════════════
export function useCustomers() {
  return useApiQuery<ListResponse<any>>(queryKeys.crm.customers(), '/crm/customers', { select: normalizeList });
}
export function useVendors() {
  return useApiQuery<ListResponse<any>>(queryKeys.crm.vendors(), '/crm/vendors', { select: normalizeList });
}
export function useContacts() {
  return useApiQuery<ListResponse<any>>(queryKeys.crm.contacts(), '/crm/contacts', { select: normalizeList });
}
export function useLeads(status?: string) {
  const path = status ? `/crm/leads?status=${status}` : '/crm/leads';
  return useApiQuery<ListResponse<any>>([...queryKeys.crm.leads(), status], path, { select: normalizeList });
}
export function useLead(id: string) {
  return useApiQuery<any>(queryKeys.crm.lead(id), `/crm/leads/${id}`, { enabled: !!id });
}
export function useOpportunities() {
  return useApiQuery<ListResponse<any>>(queryKeys.crm.opportunities(), '/crm/opportunities', { select: normalizeList });
}
export function useOpportunity(id: string) {
  return useApiQuery<any>(queryKeys.crm.opportunity(id), `/crm/opportunities/${id}`, { enabled: !!id });
}
export function usePipelines() {
  return useApiQuery<ListResponse<any>>(queryKeys.crm.pipelines(), '/crm/pipelines', { select: normalizeList });
}
export function useActivities() {
  return useApiQuery<ListResponse<any>>(queryKeys.crm.activities(), '/crm/activities', { select: normalizeList });
}
export function useCampaigns() {
  return useApiQuery<ListResponse<any>>(queryKeys.crm.campaigns(), '/crm/campaigns', { select: normalizeList });
}
export function useTerritories() {
  return useApiQuery<ListResponse<any>>(queryKeys.crm.territories(), '/crm/territories', { select: normalizeList });
}

// ═══════════════════════════════════════════════
// HR
// ═══════════════════════════════════════════════
export function useEmployees() {
  return useApiQuery<ListResponse<any>>(queryKeys.hr.employees(), '/hr/employees', { select: normalizeList });
}
export function useDepartments() {
  return useApiQuery<ListResponse<any>>(queryKeys.hr.departments(), '/hr/departments', { select: normalizeList });
}
export function usePayrollRuns() {
  return useApiQuery<ListResponse<any>>(queryKeys.hr.payroll(), '/advanced-hr/payroll-runs', { select: normalizeList });
}
export function useLeaveRequests() {
  return useApiQuery<ListResponse<any>>(queryKeys.hr.leaves(), '/advanced-hr/leave-requests', { select: normalizeList });
}
export function useAttendanceRecords() {
  return useApiQuery<ListResponse<any>>(queryKeys.hr.attendance(), '/advanced-hr/attendance', { select: normalizeList });
}

// ═══════════════════════════════════════════════
// Inventory
// ═══════════════════════════════════════════════
export function useProducts(params?: { page?: number; limit?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return useApiQuery<any>(
    [...queryKeys.inventory.products(), qs],
    `/inventory/products${qs ? `?${qs}` : ''}`,
  );
}
export function useProduct(id: string) {
  return useApiQuery<any>(queryKeys.inventory.product(id), `/inventory/products/${id}`, { enabled: !!id });
}
export function useWarehouses() {
  return useApiQuery<any>(queryKeys.inventory.warehouses(), '/inventory/warehouses');
}
export function useStockLevels(warehouseId?: string) {
  const path = warehouseId ? `/inventory/stock-levels?warehouseId=${warehouseId}` : '/inventory/stock-levels';
  return useApiQuery<any>([...queryKeys.inventory.stockLevels(), warehouseId], path);
}
export function useStockEntries() {
  return useApiQuery<ListResponse<any>>(queryKeys.inventory.stockEntries(), '/inventory/stock-entries', { select: normalizeList });
}
export function useStockLedger() {
  return useApiQuery<ListResponse<any>>(queryKeys.inventory.stockLedger(), '/inventory/stock-ledger', { select: normalizeList });
}
export function useSerialNumbers() {
  return useApiQuery<any>(queryKeys.inventory.serialNumbers(), '/inventory/serial-numbers');
}
export function useBatches() {
  return useApiQuery<any>(queryKeys.inventory.batches(), '/inventory/batches');
}
export function useBinLocations() {
  return useApiQuery<ListResponse<any>>(queryKeys.inventory.binLocations(), '/inventory/bin-locations', { select: normalizeList });
}
export function useCycleCounts() {
  return useApiQuery<ListResponse<any>>(queryKeys.inventory.cycleCounts(), '/inventory/cycle-counts', { select: normalizeList });
}

// ═══════════════════════════════════════════════
// Procurement
// ═══════════════════════════════════════════════
export function usePurchaseOrders() {
  return useApiQuery<any>(queryKeys.procurement.purchaseOrders(), '/procurement/purchase-orders');
}
export function useRFQs() {
  return useApiQuery<any>(queryKeys.procurement.rfqs(), '/procurement/rfqs');
}
export function useProcurementVendors() {
  return useApiQuery<any>(queryKeys.procurement.vendors(), '/procurement/vendors');
}
export function useContracts() {
  return useApiQuery<ListResponse<any>>(queryKeys.procurement.contracts(), '/procurement/contracts', { select: normalizeList });
}

// ═══════════════════════════════════════════════
// Sales
// ═══════════════════════════════════════════════
export function useQuotations() {
  return useApiQuery<ListResponse<any>>(queryKeys.sales.quotations(), '/sales/quotations', { select: normalizeList });
}
export function useSalesOrders() {
  return useApiQuery<ListResponse<any>>(queryKeys.sales.orders(), '/sales/orders', { select: normalizeList });
}
export function useDeliveryNotes() {
  return useApiQuery<ListResponse<any>>(queryKeys.sales.deliveryNotes(), '/sales/delivery-notes', { select: normalizeList });
}

// ═══════════════════════════════════════════════
// Manufacturing
// ═══════════════════════════════════════════════
export function useWorkOrders() {
  return useApiQuery<ListResponse<any>>(queryKeys.manufacturing.workOrders(), '/manufacturing/work-orders', { select: normalizeList });
}
export function useBOMs() {
  return useApiQuery<ListResponse<any>>(queryKeys.manufacturing.boms(), '/manufacturing/boms', { select: normalizeList });
}

// ═══════════════════════════════════════════════
// Admin
// ═══════════════════════════════════════════════
export function useUsers() {
  return useApiQuery<ListResponse<any>>(queryKeys.admin.users(), '/admin/users', { select: normalizeList });
}
export function useRoles() {
  return useApiQuery<ListResponse<any>>(queryKeys.admin.roles(), '/admin/roles', { select: normalizeList });
}
export function useActivityFeed(limit = 20) {
  return useApiQuery<any[]>(queryKeys.admin.activityFeed(), `/admin/activity-feed?limit=${limit}`);
}

// ═══════════════════════════════════════════════
// Projects
// ═══════════════════════════════════════════════
export function useProjects() {
  return useApiQuery<ListResponse<any>>(queryKeys.projects.list(), '/projects', { select: normalizeList });
}

// ═══════════════════════════════════════════════
// Builder
// ═══════════════════════════════════════════════
export function useBuilderForms() {
  return useApiQuery<any>(queryKeys.builder.forms(), '/builder/forms');
}
export function useBuilderWorkflows() {
  return useApiQuery<ListResponse<any>>(queryKeys.builder.workflows(), '/builder/workflows', { select: normalizeList });
}
export function useBuilderDashboards() {
  return useApiQuery<ListResponse<any>>(queryKeys.builder.dashboards(), '/builder/dashboards', { select: normalizeList });
}
export function useBuilderModules() {
  return useApiQuery<ListResponse<any>>(queryKeys.builder.modules(), '/builder/modules', { select: normalizeList });
}

// ═══════════════════════════════════════════════
// Billing / SaaS
// ═══════════════════════════════════════════════
export function useSubscription() {
  return useApiQuery<any>(queryKeys.billing.subscription(), '/billing/subscription');
}
export function useUsageSummary() {
  return useApiQuery<any>(queryKeys.billing.usage(), '/billing/usage');
}

// ═══════════════════════════════════════════════
// AI
// ═══════════════════════════════════════════════
export function useAiStatus() {
  return useApiQuery<{ configured: boolean }>(queryKeys.ai.status(), '/ai/status');
}

// ═══════════════════════════════════════════════
// Reporting
// ═══════════════════════════════════════════════
export function useSemanticLayer() {
  return useApiQuery<any[]>(queryKeys.reporting.semanticLayer(), '/reporting/engine/semantic-layer');
}

// ═══════════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════════
export function useUnreadNotificationCount() {
  return useApiQuery<{ count: number }>(queryKeys.notifications.unread(), '/notifications/unread-count', { refetchInterval: 30_000 });
}

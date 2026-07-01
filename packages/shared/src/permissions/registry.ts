import type { PermissionDefinition, PermissionLevel } from '../types';

function p(module: string, resource: string, action: string, level: PermissionLevel = 'endpoint', description = ''): PermissionDefinition {
  return { code: `${module}.${resource}.${action}`, module, resource, action, level, description };
}

export const PERMISSION_REGISTRY: PermissionDefinition[] = [
  // Admin
  p('admin', 'user', 'read', 'endpoint', 'View users'),
  p('admin', 'user', 'create', 'endpoint', 'Create users'),
  p('admin', 'user', 'update', 'endpoint', 'Update users'),
  p('admin', 'user', 'delete', 'endpoint', 'Delete users'),
  p('admin', 'role', 'read', 'endpoint', 'View roles'),
  p('admin', 'role', 'create', 'endpoint', 'Create roles'),
  p('admin', 'role', 'update', 'endpoint', 'Update roles'),
  p('admin', 'role', 'delete', 'endpoint', 'Delete roles'),
  p('admin', 'setting', 'read', 'endpoint', 'View settings'),
  p('admin', 'setting', 'update', 'endpoint', 'Update settings'),
  p('admin', 'access-package', 'read', 'endpoint', 'View access packages'),
  p('admin', 'access-package', 'create', 'endpoint', 'Create access packages'),
  p('admin', 'access-package', 'update', 'endpoint', 'Update access packages'),
  p('admin', 'access-package', 'delete', 'endpoint', 'Delete access packages'),
  p('admin', 'demo', 'manage', 'endpoint', 'Load/remove demo data'),
  p('admin', 'localization', 'read', 'endpoint', 'View translations'),
  p('admin', 'localization', 'create', 'endpoint', 'Create translations'),
  p('admin', 'localization', 'delete', 'endpoint', 'Delete translations'),

  // Finance
  p('finance', 'invoice', 'read', 'endpoint', 'View invoices'),
  p('finance', 'invoice', 'create', 'endpoint', 'Create invoices'),
  p('finance', 'invoice', 'update', 'endpoint', 'Update invoices'),
  p('finance', 'invoice', 'delete', 'endpoint', 'Delete invoices'),
  p('finance', 'invoice', 'send', 'endpoint', 'Send invoices'),
  p('finance', 'invoice', 'void', 'endpoint', 'Void invoices'),
  p('finance', 'invoice', 'amount', 'field', 'View invoice amounts'),
  p('finance', 'payment', 'read', 'endpoint', 'View payments'),
  p('finance', 'payment', 'create', 'endpoint', 'Create payments'),
  p('finance', 'account', 'read', 'endpoint', 'View accounts'),
  p('finance', 'account', 'create', 'endpoint', 'Create accounts'),
  p('finance', 'report', 'read', 'endpoint', 'View finance reports'),
  p('finance', 'report', 'export', 'endpoint', 'Export finance reports'),

  // HR
  p('hr', 'employee', 'read', 'endpoint', 'View employees'),
  p('hr', 'employee', 'create', 'endpoint', 'Create employees'),
  p('hr', 'employee', 'update', 'endpoint', 'Update employees'),
  p('hr', 'employee', 'delete', 'endpoint', 'Delete employees'),
  p('hr', 'employee', 'salary', 'field', 'View employee salary'),
  p('hr', 'department', 'read', 'endpoint', 'View departments'),
  p('hr', 'department', 'create', 'endpoint', 'Create departments'),
  p('hr', 'payroll', 'read', 'endpoint', 'View payroll'),
  p('hr', 'payroll', 'create', 'endpoint', 'Process payroll'),
  p('hr', 'payroll', 'approve', 'endpoint', 'Approve payroll'),
  p('hr', 'leave', 'read', 'endpoint', 'View leave requests'),
  p('hr', 'leave', 'approve', 'endpoint', 'Approve leave requests'),
  p('hr', 'attendance', 'read', 'endpoint', 'View attendance'),

  // CRM
  p('crm', 'contact', 'read', 'endpoint', 'View contacts'),
  p('crm', 'contact', 'create', 'endpoint', 'Create contacts'),
  p('crm', 'contact', 'update', 'endpoint', 'Update contacts'),
  p('crm', 'contact', 'delete', 'endpoint', 'Delete contacts'),
  p('crm', 'lead', 'read', 'endpoint', 'View leads'),
  p('crm', 'lead', 'create', 'endpoint', 'Create leads'),
  p('crm', 'lead', 'update', 'endpoint', 'Update leads'),
  p('crm', 'lead', 'delete', 'endpoint', 'Delete leads'),
  p('crm', 'lead', 'convert', 'endpoint', 'Convert leads'),
  p('crm', 'opportunity', 'read', 'endpoint', 'View opportunities'),
  p('crm', 'opportunity', 'create', 'endpoint', 'Create opportunities'),
  p('crm', 'opportunity', 'update', 'endpoint', 'Update opportunities'),
  p('crm', 'activity', 'read', 'endpoint', 'View activities'),
  p('crm', 'activity', 'create', 'endpoint', 'Create activities'),
  p('crm', 'case', 'read', 'endpoint', 'View customer service cases'),
  p('crm', 'case', 'create', 'endpoint', 'Create customer service cases'),
  p('crm', 'case', 'update', 'endpoint', 'Update customer service cases'),

  // Inventory
  p('inventory', 'product', 'read', 'endpoint', 'View products'),
  p('inventory', 'product', 'create', 'endpoint', 'Create products'),
  p('inventory', 'product', 'update', 'endpoint', 'Update products'),
  p('inventory', 'product', 'delete', 'endpoint', 'Delete products'),
  p('inventory', 'warehouse', 'read', 'endpoint', 'View warehouses'),
  p('inventory', 'warehouse', 'create', 'endpoint', 'Create warehouses'),
  p('inventory', 'stock', 'read', 'endpoint', 'View stock'),
  p('inventory', 'stock', 'adjust', 'endpoint', 'Adjust stock'),
  p('inventory', 'stock', 'transfer', 'endpoint', 'Transfer stock'),

  // Procurement
  p('procurement', 'vendor', 'read', 'endpoint', 'View vendors'),
  p('procurement', 'vendor', 'create', 'endpoint', 'Create vendors'),
  p('procurement', 'purchase-order', 'read', 'endpoint', 'View purchase orders'),
  p('procurement', 'purchase-order', 'create', 'endpoint', 'Create purchase orders'),
  p('procurement', 'purchase-order', 'approve', 'endpoint', 'Approve purchase orders'),
  p('procurement', 'rfq', 'read', 'endpoint', 'View RFQs'),
  p('procurement', 'rfq', 'create', 'endpoint', 'Create RFQs'),

  // Sales
  p('sales', 'quotation', 'read', 'endpoint', 'View quotations'),
  p('sales', 'quotation', 'create', 'endpoint', 'Create quotations'),
  p('sales', 'quotation', 'send', 'endpoint', 'Send quotations'),
  p('sales', 'sales-order', 'read', 'endpoint', 'View sales orders'),
  p('sales', 'sales-order', 'create', 'endpoint', 'Create sales orders'),
  p('sales', 'sales-order', 'confirm', 'endpoint', 'Confirm sales orders'),
  p('sales', 'return', 'read', 'endpoint', 'View returns'),
  p('sales', 'return', 'create', 'endpoint', 'Create returns'),
  p('sales', 'return', 'approve', 'endpoint', 'Approve returns'),

  // Manufacturing
  p('manufacturing', 'bom', 'read', 'endpoint', 'View BOMs'),
  p('manufacturing', 'bom', 'create', 'endpoint', 'Create BOMs'),
  p('manufacturing', 'work-order', 'read', 'endpoint', 'View work orders'),
  p('manufacturing', 'work-order', 'create', 'endpoint', 'Create work orders'),

  // Projects
  p('projects', 'project', 'read', 'endpoint', 'View projects'),
  p('projects', 'project', 'create', 'endpoint', 'Create projects'),
  p('projects', 'project', 'update', 'endpoint', 'Update projects'),
  p('projects', 'task', 'read', 'endpoint', 'View tasks'),
  p('projects', 'task', 'create', 'endpoint', 'Create tasks'),
  p('projects', 'task', 'update', 'endpoint', 'Update tasks'),

  // Super Admin (system-level)
  p('system', 'superadmin', 'access', 'endpoint', 'Access super admin panel'),
  p('system', 'tenant', 'read', 'endpoint', 'View all tenants'),
  p('system', 'tenant', 'create', 'endpoint', 'Provision tenants'),
  p('system', 'tenant', 'update', 'endpoint', 'Update tenants'),
  p('system', 'analytics', 'read', 'endpoint', 'View cross-tenant analytics'),
  p('system', 'health', 'read', 'endpoint', 'View system health'),

  // Page-level permissions
  p('page', 'super-admin', 'access', 'page', 'Access super admin pages'),
  p('page', 'admin', 'access', 'page', 'Access admin pages'),
  p('page', 'finance', 'access', 'page', 'Access finance pages'),
  p('page', 'hr', 'access', 'page', 'Access HR pages'),
  p('page', 'crm', 'access', 'page', 'Access CRM pages'),
  p('page', 'inventory', 'access', 'page', 'Access inventory pages'),
  p('page', 'procurement', 'access', 'page', 'Access procurement pages'),
  p('page', 'sales', 'access', 'page', 'Access sales pages'),
  p('page', 'manufacturing', 'access', 'page', 'Access manufacturing pages'),
  p('page', 'projects', 'access', 'page', 'Access projects pages'),
];

export const PERMISSION_MAP = new Map(
  PERMISSION_REGISTRY.map((p) => [p.code, p]),
);

export function getPermissionsByModule(module: string): PermissionDefinition[] {
  return PERMISSION_REGISTRY.filter((p) => p.module === module);
}

export function getPermissionsByLevel(level: PermissionLevel): PermissionDefinition[] {
  return PERMISSION_REGISTRY.filter((p) => p.level === level);
}

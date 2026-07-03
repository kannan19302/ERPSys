import type { PermissionDefinition, PermissionLevel } from '../types';

function p(module: string, resource: string, action: string, level: PermissionLevel = 'endpoint', description = '', category?: string): PermissionDefinition {
  return { code: `${module}.${resource}.${action}`, module, resource, action, level, description, category };
}

/**
 * Sub-resource -> UI category label, admin module only (see
 * .ai/ADMIN_UI_ACCESS_CONTROL_SPEC.md Section 2.1). Verified against the real
 * `resource` strings already used by `p('admin', ...)` calls below, not the
 * spec's illustrative resource names (some differ, e.g. `bulk-ops` not
 * `bulk-operation`, `delegations` not `delegation`, `alerts` not `alert`).
 * Every non-admin module leaves `category` undefined and keeps flat grouping.
 */
function admin(resource: string, action: string, level: PermissionLevel, description: string, category: string): PermissionDefinition {
  return p('admin', resource, action, level, description, category);
}

export const PERMISSION_REGISTRY: PermissionDefinition[] = [
  // Admin
  admin('user', 'read', 'endpoint', 'View users', 'Users & Roles'),
  admin('user', 'create', 'endpoint', 'Create users', 'Users & Roles'),
  admin('user', 'update', 'endpoint', 'Update users', 'Users & Roles'),
  admin('user', 'delete', 'endpoint', 'Delete users', 'Users & Roles'),
  admin('role', 'read', 'endpoint', 'View roles', 'Users & Roles'),
  admin('role', 'create', 'endpoint', 'Create roles', 'Users & Roles'),
  admin('role', 'update', 'endpoint', 'Update roles', 'Users & Roles'),
  admin('role', 'delete', 'endpoint', 'Delete roles', 'Users & Roles'),
  admin('access-package', 'read', 'endpoint', 'View access packages', 'Users & Roles'),
  admin('access-package', 'create', 'endpoint', 'Create access packages', 'Users & Roles'),
  admin('access-package', 'update', 'endpoint', 'Update access packages', 'Users & Roles'),
  admin('access-package', 'delete', 'endpoint', 'Delete access packages', 'Users & Roles'),
  admin('setting', 'read', 'endpoint', 'View settings', 'General Settings'),
  admin('setting', 'update', 'endpoint', 'Update settings', 'General Settings'),
  admin('localization', 'read', 'endpoint', 'View translations', 'General Settings'),
  admin('localization', 'create', 'endpoint', 'Create translations', 'General Settings'),
  admin('localization', 'delete', 'endpoint', 'Delete translations', 'General Settings'),
  admin('demo', 'manage', 'endpoint', 'Load/remove demo data', 'General Settings'),
  admin('user-group', 'read', 'endpoint', 'View user groups', 'User Groups'),
  admin('user-group', 'create', 'endpoint', 'Create user groups', 'User Groups'),
  admin('user-group', 'update', 'endpoint', 'Update user groups', 'User Groups'),
  admin('user-group', 'delete', 'endpoint', 'Delete user groups', 'User Groups'),
  admin('security', 'read', 'endpoint', 'View security audit logs, sessions, MFA, SSO, password policy', 'Security'),
  admin('security', 'update', 'endpoint', 'Manage security settings, sessions, MFA, SSO, password policy', 'Security'),
  admin('automation', 'read', 'endpoint', 'View automation rules', 'Automation'),
  admin('automation', 'create', 'endpoint', 'Create automation rules', 'Automation'),
  admin('automation', 'update', 'endpoint', 'Update/test automation rules', 'Automation'),
  admin('automation', 'delete', 'endpoint', 'Delete automation rules', 'Automation'),
  admin('platform', 'read', 'endpoint', 'View platform settings, modules, feature flags, marketplace', 'Platform'),
  admin('platform', 'update', 'endpoint', 'Manage platform settings, modules, feature flags, marketplace', 'Platform'),
  admin('operations', 'read', 'endpoint', 'View operations dashboard, jobs, logs, backups', 'Operations'),
  admin('operations', 'update', 'endpoint', 'Manage operations: retry jobs, trigger tasks, create backups', 'Operations'),
  admin('org-hierarchy', 'read', 'endpoint', 'View org hierarchy, departments, cost centers', 'Org Hierarchy'),
  admin('org-hierarchy', 'create', 'endpoint', 'Create departments and cost centers', 'Org Hierarchy'),
  admin('org-hierarchy', 'update', 'endpoint', 'Update departments and cost centers', 'Org Hierarchy'),
  admin('org-hierarchy', 'delete', 'endpoint', 'Delete departments and cost centers', 'Org Hierarchy'),
  admin('bulk-ops', 'read', 'endpoint', 'View bulk operations', 'Bulk Operations'),
  admin('bulk-ops', 'create', 'endpoint', 'Create bulk operations', 'Bulk Operations'),
  admin('custom-fields', 'read', 'endpoint', 'View custom field definitions and values', 'Custom Fields'),
  admin('custom-fields', 'create', 'endpoint', 'Create custom field definitions', 'Custom Fields'),
  admin('custom-fields', 'update', 'endpoint', 'Update custom field definitions and values', 'Custom Fields'),
  admin('custom-fields', 'delete', 'endpoint', 'Delete custom field definitions', 'Custom Fields'),
  admin('data-quality', 'read', 'endpoint', 'View duplicate detection results', 'Data Quality'),
  admin('data-quality', 'update', 'endpoint', 'Scan, merge, and dismiss duplicate records', 'Data Quality'),
  admin('delegations', 'read', 'endpoint', 'View delegation rules', 'Delegation'),
  admin('delegations', 'create', 'endpoint', 'Create delegation rules', 'Delegation'),
  admin('delegations', 'update', 'endpoint', 'Update/revoke delegation rules', 'Delegation'),
  admin('recycle-bin', 'read', 'endpoint', 'View recycle bin items and stats', 'Recycle Bin'),
  admin('recycle-bin', 'update', 'endpoint', 'Restore recycle bin items', 'Recycle Bin'),
  admin('recycle-bin', 'delete', 'endpoint', 'Permanently delete or purge recycle bin items', 'Recycle Bin'),
  admin('subscription', 'read', 'endpoint', 'View subscription plan and billing history', 'Subscription'),
  admin('subscription', 'update', 'endpoint', 'Change subscription plan or seats', 'Subscription'),
  admin('alerts', 'read', 'endpoint', 'View alerts and alert thresholds', 'Alerts'),
  admin('alerts', 'update', 'endpoint', 'Mark/dismiss alerts and manage thresholds', 'Alerts'),

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

  // Communication (Connect) — coarse legacy strings still used by some controller routes.
  // These are genuinely 2-segment codes at runtime (`communication.read`, not
  // `communication.general.read`) — verified by grepping every @Permissions(...) string in
  // communication.controller.ts. Declared as literal PermissionDefinitions (not via the `p()`
  // helper, which always emits a 3-segment `module.resource.action` code) so the registry entry
  // exactly matches what RbacGuard actually checks; a near-miss code here would leave these four
  // permissions invisible to the Access Control admin UI despite "existing" in this file.
  { code: 'communication.read', module: 'communication', resource: 'general', action: 'read', level: 'endpoint', description: 'View communication module (legacy coarse permission)' },
  { code: 'communication.create', module: 'communication', resource: 'general', action: 'create', level: 'endpoint', description: 'Create in communication module (legacy coarse permission)' },
  { code: 'communication.update', module: 'communication', resource: 'general', action: 'update', level: 'endpoint', description: 'Update in communication module (legacy coarse permission)' },
  { code: 'communication.delete', module: 'communication', resource: 'general', action: 'delete', level: 'endpoint', description: 'Delete in communication module (legacy coarse permission)' },
  // Communication (Connect) — fine-grained resource permissions enforced by RbacGuard
  p('communication', 'channel', 'read', 'endpoint', 'View channels and workspace'),
  p('communication', 'channel', 'create', 'endpoint', 'Create channels, spaces, DMs and groups'),
  p('communication', 'channel', 'manage', 'endpoint', 'Rename or archive channels'),
  p('communication', 'channel', 'join', 'endpoint', 'Join public channels'),
  p('communication', 'channel.member', 'manage', 'endpoint', 'Add or remove channel members'),
  p('communication', 'message', 'read', 'endpoint', 'View messages'),
  p('communication', 'message', 'create', 'endpoint', 'Send, edit, delete, react to messages'),
  p('communication', 'message', 'search', 'endpoint', 'Search message content across joined channels'),
  p('communication', 'message-attachment', 'upload', 'endpoint', 'Upload a file attachment to a Connect message'),
  p('communication', 'notification', 'read', 'endpoint', 'View notifications'),
  p('communication', 'notification', 'create', 'endpoint', 'Create notifications'),
  p('communication', 'notification', 'update', 'endpoint', 'Update notification status'),
  p('communication', 'email-template', 'read', 'endpoint', 'View email templates'),
  p('communication', 'email-template', 'create', 'endpoint', 'Create email templates'),

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
  p('system', 'operations', 'backup', 'endpoint', 'Create/view platform-wide database backups (Super Admin / Platform Operator only — a Postgres backup captures every tenant, never seed to a tenant-scoped role)'),

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
  p('admin', 'api-keys', 'create', 'endpoint', 'Access admin api-keys create'),
  p('admin', 'api-keys', 'delete', 'endpoint', 'Access admin api-keys delete'),
  p('admin', 'api-keys', 'read', 'endpoint', 'Access admin api-keys read'),
  p('admin', 'devops', 'read', 'endpoint', 'Access admin devops read'),
  p('admin', 'setting', 'create', 'endpoint', 'Access admin setting create'),
  p('admin', 'sync', 'create', 'endpoint', 'Access admin sync create'),
  p('admin', 'sync', 'read', 'endpoint', 'Access admin sync read'),
  p('admin', 'webhooks', 'create', 'endpoint', 'Access admin webhooks create'),
  p('admin', 'webhooks', 'delete', 'endpoint', 'Access admin webhooks delete'),
  p('admin', 'webhooks', 'read', 'endpoint', 'Access admin webhooks read'),
  { code: 'advanced_finance.create', module: 'advanced_finance', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: advanced_finance create' },
  { code: 'advanced_finance.read', module: 'advanced_finance', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: advanced_finance read' },
  { code: 'ai.create', module: 'ai', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: ai create' },
  { code: 'ai.read', module: 'ai', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: ai read' },
  p('ai', 'admin', 'manage', 'endpoint', 'Manage the AI assistant kill switch and engine control (dedicated AI admin console, admin-only)'),
  p('analytics', 'dashboard', 'create', 'endpoint', 'Access analytics dashboard create'),
  p('analytics', 'dashboard', 'read', 'endpoint', 'Access analytics dashboard read'),
  p('analytics', 'kpi', 'read', 'endpoint', 'Access analytics kpi read'),
  p('analytics', 'report', 'create', 'endpoint', 'Access analytics report create'),
  p('analytics', 'report', 'read', 'endpoint', 'Access analytics report read'),
  { code: 'auth.create', module: 'auth', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: auth create' },
  { code: 'auth.read', module: 'auth', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: auth read' },
  { code: 'auth.update', module: 'auth', resource: 'general', action: 'update', level: 'endpoint', description: 'Coarse legacy permission: auth update' },
  p('builder', 'automation', 'create', 'endpoint', 'Access builder automation create'),
  p('builder', 'automation', 'delete', 'endpoint', 'Access builder automation delete'),
  p('builder', 'automation', 'read', 'endpoint', 'Access builder automation read'),
  p('builder', 'automation', 'update', 'endpoint', 'Access builder automation update'),
  p('builder', 'blog', 'create', 'endpoint', 'Access builder blog create'),
  p('builder', 'blog', 'delete', 'endpoint', 'Access builder blog delete'),
  p('builder', 'blog', 'read', 'endpoint', 'Access builder blog read'),
  p('builder', 'blog', 'update', 'endpoint', 'Access builder blog update'),
  { code: 'builder.create', module: 'builder', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: builder create' },
  p('builder', 'dashboard', 'create', 'endpoint', 'Access builder dashboard create'),
  p('builder', 'dashboard', 'delete', 'endpoint', 'Access builder dashboard delete'),
  p('builder', 'dashboard', 'read', 'endpoint', 'Access builder dashboard read'),
  p('builder', 'dashboard', 'update', 'endpoint', 'Access builder dashboard update'),
  { code: 'builder.delete', module: 'builder', resource: 'general', action: 'delete', level: 'endpoint', description: 'Coarse legacy permission: builder delete' },
  p('builder', 'form', 'create', 'endpoint', 'Access builder form create'),
  p('builder', 'form', 'delete', 'endpoint', 'Access builder form delete'),
  p('builder', 'form', 'read', 'endpoint', 'Access builder form read'),
  p('builder', 'form', 'update', 'endpoint', 'Access builder form update'),
  p('builder', 'import', 'create', 'endpoint', 'Access builder import create'),
  p('builder', 'import', 'read', 'endpoint', 'Access builder import read'),
  p('builder', 'module', 'create', 'endpoint', 'Access builder module create'),
  p('builder', 'module', 'delete', 'endpoint', 'Access builder module delete'),
  p('builder', 'module', 'read', 'endpoint', 'Access builder module read'),
  p('builder', 'module', 'update', 'endpoint', 'Access builder module update'),
  p('builder', 'page', 'create', 'endpoint', 'Access builder page create'),
  p('builder', 'page', 'delete', 'endpoint', 'Access builder page delete'),
  p('builder', 'page', 'read', 'endpoint', 'Access builder page read'),
  p('builder', 'page', 'update', 'endpoint', 'Access builder page update'),
  { code: 'builder.read', module: 'builder', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: builder read' },
  p('builder', 'record', 'create', 'endpoint', 'Access builder record create'),
  p('builder', 'record', 'delete', 'endpoint', 'Access builder record delete'),
  p('builder', 'record', 'read', 'endpoint', 'Access builder record read'),
  p('builder', 'record', 'update', 'endpoint', 'Access builder record update'),
  p('builder', 'schema', 'create', 'endpoint', 'Access builder schema create'),
  p('builder', 'schema', 'delete', 'endpoint', 'Access builder schema delete'),
  p('builder', 'schema', 'read', 'endpoint', 'Access builder schema read'),
  p('builder', 'schema', 'update', 'endpoint', 'Access builder schema update'),
  { code: 'builder.update', module: 'builder', resource: 'general', action: 'update', level: 'endpoint', description: 'Coarse legacy permission: builder update' },
  p('builder', 'web', 'create', 'endpoint', 'Access builder web create'),
  p('builder', 'web', 'delete', 'endpoint', 'Access builder web delete'),
  p('builder', 'web', 'read', 'endpoint', 'Access builder web read'),
  p('builder', 'web', 'update', 'endpoint', 'Access builder web update'),
  p('builder', 'workflow', 'create', 'endpoint', 'Access builder workflow create'),
  p('builder', 'workflow', 'delete', 'endpoint', 'Access builder workflow delete'),
  p('builder', 'workflow', 'read', 'endpoint', 'Access builder workflow read'),
  p('builder', 'workflow', 'update', 'endpoint', 'Access builder workflow update'),
  p('crm', 'activity', 'update', 'endpoint', 'Access crm activity update'),
  { code: 'crm.create', module: 'crm', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: crm create' },
  p('crm', 'opportunity', 'delete', 'endpoint', 'Access crm opportunity delete'),
  p('crm', 'product', 'create', 'endpoint', 'Access crm product create'),
  p('crm', 'product', 'delete', 'endpoint', 'Access crm product delete'),
  p('crm', 'product', 'read', 'endpoint', 'Access crm product read'),
  p('crm', 'product', 'update', 'endpoint', 'Access crm product update'),
  { code: 'crm.read', module: 'crm', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: crm read' },
  p('crm', 'report', 'create', 'endpoint', 'Access crm report create'),
  p('crm', 'report', 'delete', 'endpoint', 'Access crm report delete'),
  p('crm', 'report', 'read', 'endpoint', 'Access crm report read'),
  p('crm', 'report', 'update', 'endpoint', 'Access crm report update'),
  p('crm', 'settings', 'create', 'endpoint', 'Access crm settings create'),
  p('crm', 'settings', 'delete', 'endpoint', 'Access crm settings delete'),
  p('crm', 'settings', 'read', 'endpoint', 'Access crm settings read'),
  p('crm', 'settings', 'update', 'endpoint', 'Access crm settings update'),
  p('documents', 'document', 'create', 'endpoint', 'Access documents document create'),
  p('documents', 'document', 'read', 'endpoint', 'Access documents document read'),
  p('documents', 'folder', 'create', 'endpoint', 'Access documents folder create'),
  p('documents', 'folder', 'read', 'endpoint', 'Access documents folder read'),
  { code: 'education.create', module: 'education', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: education create' },
  { code: 'education.read', module: 'education', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: education read' },
  { code: 'field_service.create', module: 'field_service', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: field_service create' },
  { code: 'field_service.read', module: 'field_service', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: field_service read' },
  { code: 'field_service.update', module: 'field_service', resource: 'general', action: 'update', level: 'endpoint', description: 'Coarse legacy permission: field_service update' },
  p('finance', 'accounting-book', 'create', 'endpoint', 'Access finance accounting-book create'),
  p('finance', 'accounting-book', 'read', 'endpoint', 'Access finance accounting-book read'),
  { code: 'healthcare.create', module: 'healthcare', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: healthcare create' },
  { code: 'healthcare.read', module: 'healthcare', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: healthcare read' },
  { code: 'healthcare.update', module: 'healthcare', resource: 'general', action: 'update', level: 'endpoint', description: 'Coarse legacy permission: healthcare update' },
  p('hr', 'leave', 'create', 'endpoint', 'Access hr leave create'),
  p('inventory', 'stock', 'create', 'endpoint', 'Access inventory stock create'),
  p('inventory', 'stock', 'update', 'endpoint', 'Access inventory stock update'),
  p('inventory', 'warehouse', 'delete', 'endpoint', 'Access inventory warehouse delete'),
  p('inventory', 'warehouse', 'update', 'endpoint', 'Access inventory warehouse update'),
  { code: 'localization.read', module: 'localization', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: localization read' },
  p('manufacturing', 'bom', 'update', 'endpoint', 'Access manufacturing bom update'),
  { code: 'manufacturing.create', module: 'manufacturing', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: manufacturing create' },
  { code: 'manufacturing.read', module: 'manufacturing', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: manufacturing read' },
  p('manufacturing', 'work-order', 'update', 'endpoint', 'Access manufacturing work-order update'),
  { code: 'marketplace.create', module: 'marketplace', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: marketplace create' },
  { code: 'marketplace.read', module: 'marketplace', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: marketplace read' },
  p('pos', 'cash-entry', 'create', 'endpoint', 'Access pos cash-entry create'),
  p('pos', 'cash-entry', 'read', 'endpoint', 'Access pos cash-entry read'),
  p('pos', 'coupon', 'create', 'endpoint', 'Access pos coupon create'),
  p('pos', 'coupon', 'read', 'endpoint', 'Access pos coupon read'),
  p('pos', 'coupon', 'validate', 'endpoint', 'Access pos coupon validate'),
  p('pos', 'customer', 'create', 'endpoint', 'Access pos customer create'),
  p('pos', 'customer', 'read', 'endpoint', 'Access pos customer read'),
  p('pos', 'discount', 'create', 'endpoint', 'Access pos discount create'),
  p('pos', 'discount', 'read', 'endpoint', 'Access pos discount read'),
  p('pos', 'gift-card', 'create', 'endpoint', 'Access pos gift-card create'),
  p('pos', 'gift-card', 'read', 'endpoint', 'Access pos gift-card read'),
  p('pos', 'held-order', 'create', 'endpoint', 'Access pos held-order create'),
  p('pos', 'held-order', 'read', 'endpoint', 'Access pos held-order read'),
  p('pos', 'layaway', 'create', 'endpoint', 'Access pos layaway create'),
  p('pos', 'layaway', 'read', 'endpoint', 'Access pos layaway read'),
  p('pos', 'loyalty', 'create', 'endpoint', 'Access pos loyalty create'),
  p('pos', 'loyalty', 'read', 'endpoint', 'Access pos loyalty read'),
  p('pos', 'loyalty', 'redeem', 'endpoint', 'Access pos loyalty redeem'),
  p('pos', 'open-tab', 'create', 'endpoint', 'Access pos open-tab create'),
  p('pos', 'open-tab', 'read', 'endpoint', 'Access pos open-tab read'),
  p('pos', 'order', 'create', 'endpoint', 'Access pos order create'),
  p('pos', 'order', 'read', 'endpoint', 'Access pos order read'),
  p('pos', 'price-list', 'create', 'endpoint', 'Access pos price-list create'),
  p('pos', 'price-list', 'read', 'endpoint', 'Access pos price-list read'),
  p('pos', 'product', 'search', 'endpoint', 'Access pos product search'),
  p('pos', 'promotion', 'create', 'endpoint', 'Access pos promotion create'),
  p('pos', 'promotion', 'read', 'endpoint', 'Access pos promotion read'),
  p('pos', 'register', 'create', 'endpoint', 'Access pos register create'),
  p('pos', 'register', 'read', 'endpoint', 'Access pos register read'),
  p('pos', 'report', 'read', 'endpoint', 'Access pos report read'),
  p('pos', 'return', 'create', 'endpoint', 'Access pos return create'),
  p('pos', 'return', 'read', 'endpoint', 'Access pos return read'),
  p('pos', 'shift', 'create', 'endpoint', 'Access pos shift create'),
  p('pos', 'shift', 'read', 'endpoint', 'Access pos shift read'),
  p('pos', 'store-credit', 'read', 'endpoint', 'Access pos store-credit read'),
  p('pos', 'tax-profile', 'create', 'endpoint', 'Access pos tax-profile create'),
  p('pos', 'tax-profile', 'read', 'endpoint', 'Access pos tax-profile read'),
  p('pos', 'terminal', 'create', 'endpoint', 'Access pos terminal create'),
  p('pos', 'terminal', 'read', 'endpoint', 'Access pos terminal read'),
  p('procurement', 'purchase-order', 'update', 'endpoint', 'Access procurement purchase-order update'),
  p('procurement', 'purchase-receipt', 'create', 'endpoint', 'Access procurement purchase-receipt create'),
  p('procurement', 'vendor', 'manage', 'endpoint', 'Access procurement vendor manage'),
  p('projects', 'timesheet', 'create', 'endpoint', 'Access projects timesheet create'),
  { code: 'real_estate.read', module: 'real_estate', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: real_estate read' },
  { code: 'reporting.create', module: 'reporting', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: reporting create' },
  { code: 'reporting.read', module: 'reporting', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: reporting read' },
  { code: 'saas.create', module: 'saas', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: saas create' },
  { code: 'saas.read', module: 'saas', resource: 'general', action: 'read', level: 'endpoint', description: 'Coarse legacy permission: saas read' },
  p('sales', 'delivery-note', 'create', 'endpoint', 'Access sales delivery-note create'),
  p('sales', 'delivery-note', 'read', 'endpoint', 'Access sales delivery-note read'),
  p('sales', 'delivery-note', 'update', 'endpoint', 'Access sales delivery-note update'),
  p('sales', 'order', 'create', 'endpoint', 'Access sales order create'),
  p('sales', 'order', 'read', 'endpoint', 'Access sales order read'),
  p('sales', 'order', 'update', 'endpoint', 'Access sales order update'),
  p('sales', 'quotation', 'update', 'endpoint', 'Access sales quotation update'),
  p('sales', 'return', 'update', 'endpoint', 'Access sales return update'),
  p('supply-chain', 'forecast', 'read', 'endpoint', 'Access supply-chain forecast read'),
  p('supply-chain', 'shipment', 'create', 'endpoint', 'Access supply-chain shipment create'),
  p('supply-chain', 'shipment', 'read', 'endpoint', 'Access supply-chain shipment read'),
  p('supply-chain', 'shipment', 'update', 'endpoint', 'Access supply-chain shipment update'),
  { code: 'workflow.create', module: 'workflow', resource: 'general', action: 'create', level: 'endpoint', description: 'Coarse legacy permission: workflow create' },
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

/**
 * Distinct `category` labels for a module, in first-seen registry order (stable
 * for UI rendering). Empty array for modules with no `category` set — callers
 * should fall back to flat module-level rendering in that case.
 */
export function getCategoriesForModule(module: string): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const perm of PERMISSION_REGISTRY) {
    if (perm.module !== module || !perm.category) continue;
    if (!seen.has(perm.category)) {
      seen.add(perm.category);
      categories.push(perm.category);
    }
  }
  return categories;
}

/** All permissions for a given module + category pair. */
export function getPermissionsByCategory(module: string, category: string): PermissionDefinition[] {
  return PERMISSION_REGISTRY.filter((p) => p.module === module && p.category === category);
}

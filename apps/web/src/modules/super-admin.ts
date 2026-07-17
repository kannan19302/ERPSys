import { defineModule, defineResource } from '@unerp/framework';

export const tenantResource = defineResource({
  name: 'platform-tenants',
  labelSingular: 'Tenant',
  labelPlural: 'Tenants',
  endpoint: '/super-admin/tenants',
  titleField: 'name',
  permissions: { read: 'system.tenant.read', create: 'system.tenant.create', update: 'system.tenant.update' },
  status: { field: 'status', tones: { ACTIVE: 'success', TRIAL: 'info', SUSPENDED: 'warning', CANCELLED: 'danger' } },
  fields: [
    { name: 'name', label: 'Organization Name', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'text', required: true },
    { name: 'plan', label: 'Plan', type: 'select', defaultValue: 'STARTER', options: [{ value: 'STARTER', label: 'Starter' }, { value: 'PRO', label: 'Pro' }, { value: 'ENTERPRISE', label: 'Enterprise' }] },
    { name: 'adminEmail', label: 'Admin Email', type: 'email', required: true },
    { name: 'status', label: 'Status', type: 'text', readOnly: true },
    { name: 'userCount', label: 'Users', type: 'number', readOnly: true },
    { name: 'createdAt', label: 'Created', type: 'datetime', readOnly: true },
  ],
  list: { columns: ['name', 'slug', 'plan', 'status', 'userCount', 'createdAt'], searchable: true, pageSize: 25, defaultSort: { field: 'createdAt', direction: 'desc' }, selectable: true },
});

export const adminUserResource = defineResource({
  name: 'platform-admins',
  labelSingular: 'Administrator',
  labelPlural: 'Administrators',
  endpoint: '/super-admin/admins',
  titleField: 'email',
  permissions: { read: 'system.superadmin.access' },
  fields: [
    { name: 'name', label: 'Name', type: 'text', readOnly: true },
    { name: 'email', label: 'Email', type: 'email', readOnly: true },
    { name: 'role', label: 'Role', type: 'text', readOnly: true },
    { name: 'tenantName', label: 'Tenant', type: 'text', readOnly: true },
    { name: 'status', label: 'Status', type: 'text', readOnly: true },
    { name: 'lastLoginAt', label: 'Last Login', type: 'datetime', readOnly: true },
  ],
  list: { columns: ['name', 'email', 'role', 'tenantName', 'status', 'lastLoginAt'], searchable: true, pageSize: 25, defaultSort: { field: 'lastLoginAt', direction: 'desc' } },
});

export const superAdminModule = defineModule({ id: 'super-admin', title: 'Super Admin', basePath: '/settings/super-admin', permission: 'system.tenant.read', resources: [tenantResource, adminUserResource] });

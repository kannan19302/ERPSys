import { defineModule, defineResource } from '@unerp/framework';

export const financeAuditResource = defineResource({
  name: 'finance-audit-logs',
  labelSingular: 'Finance Audit Log',
  labelPlural: 'Finance Audit Logs',
  endpoint: '/advanced-finance/audit-logs',
  titleField: 'entityId',
  permissions: { read: 'finance.audit.read' },
  fields: [
    { name: 'createdAt', label: 'Time', type: 'datetime', readOnly: true },
    { name: 'entityType', label: 'Entity Type', type: 'text', readOnly: true },
    { name: 'entityId', label: 'Entity ID', type: 'text', readOnly: true },
    { name: 'action', label: 'Action', type: 'text', readOnly: true },
    { name: 'userName', label: 'User', type: 'text', readOnly: true },
  ],
  list: { columns: ['createdAt', 'entityType', 'entityId', 'action', 'userName'], searchable: true, pageSize: 25, defaultSort: { field: 'createdAt', direction: 'desc' }, filters: ['entityType'] },
});

export const financeAuditModule = defineModule({ id: 'finance-audit', title: 'Finance Audit', basePath: '/finance/advanced/audit-logs', permission: 'finance.audit.read', resources: [financeAuditResource] });

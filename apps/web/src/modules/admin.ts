import { defineModule, defineResource } from '@unerp/framework';

export const activityFeedResource = defineResource({
  name: 'activity-feed',
  labelSingular: 'Activity Event',
  labelPlural: 'Activity Feed',
  endpoint: '/admin/activity-feed',
  titleField: 'entityId',
  permissions: { read: 'admin.setting.read' },
  fields: [
    { name: 'createdAt', label: 'Time', type: 'datetime', readOnly: true },
    { name: 'userName', label: 'User', type: 'text', readOnly: true },
    { name: 'entityType', label: 'Entity Type', type: 'text', readOnly: true },
    { name: 'entityId', label: 'Entity ID', type: 'text', readOnly: true },
    { name: 'action', label: 'Action', type: 'text', readOnly: true },
  ],
  list: { columns: ['createdAt', 'userName', 'entityType', 'entityId', 'action'], searchable: true, pageSize: 20, defaultSort: { field: 'createdAt', direction: 'desc' }, filters: ['entityType', 'userId'] },
});

export const adminModule = defineModule({ id: 'admin', title: 'Administration', basePath: '/settings', permission: 'admin.setting.read', resources: [activityFeedResource] });
